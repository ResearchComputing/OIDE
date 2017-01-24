import os
import pwd
import urllib
import mock
import json
import tempfile
import shutil
import stat
import subprocess
import tornado.escape
from sandstone.lib.handlers.base import BaseHandler
from sandstone.lib.test_utils import TestHandlerBase

from sandstone.lib.filesystem.filewatcher import Filewatcher
from sandstone.lib.filesystem.handlers import FilesystemHandler



EXEC_USER = pwd.getpwuid(os.getuid())[0]

class FilesystemHandlerTestCase(TestHandlerBase):
    def setUp(self,*args,**kwargs):
        self.test_dir = tempfile.mkdtemp()
        self.json_headers = {
            'Content-Type': 'application/json;charset=UTF-8'
        }
        super(FilesystemHandlerTestCase,self).setUp(*args,**kwargs)

    def tearDown(self,*args,**kwargs):
        shutil.rmtree(self.test_dir)
        super(FilesystemHandlerTestCase,self).tearDown(*args,**kwargs)

    def test_get_unauthed(self):
        response = self.fetch(
            '/a/filesystem/',
            method='GET',
            follow_redirects=False)

        self.assertEqual(response.code, 302)
        self.assertTrue(response.headers['Location'].startswith('/auth/login?next=%2F'))

    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_get(self,m):
        with mock.patch('sandstone.settings.VOLUMES',[self.test_dir]):
            response = self.fetch(
                '/a/filesystem/',
                method='GET',
                follow_redirects=False)

            self.assertEqual(response.code, 200)
            res = json.loads(response.body)
            self.assertEqual(res['type'],u'filesystem')
            self.assertEqual(res['volumes'][0]['filepath'],self.test_dir)

    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_put_bad_path(self,m):
        fakep = os.path.join(self.test_dir,'fake.txt')
        newpath = os.path.join(self.test_dir,'testfile2.txt')

        args = {
            'filepath': fakep,
            'action': {
                'action': 'move',
                'newpath': newpath
            }
        }

        response = self.fetch(
            '/a/filesystem/',
            method='PUT',
            headers=self.json_headers,
            body=json.dumps(args),
            follow_redirects=False
        )

        self.assertEqual(response.code, 404)

    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_put_move(self,m):
        fp = os.path.join(self.test_dir,'testfile.txt')
        newpath = os.path.join(self.test_dir,'testfile2.txt')
        open(fp,'w').close()

        args = {
            'filepath': fp,
            'action': {
                'action': 'move',
                'newpath': newpath
            }
        }

        response = self.fetch(
            '/a/filesystem/',
            method='PUT',
            headers=self.json_headers,
            body=json.dumps(args),
            follow_redirects=False
        )

        self.assertEqual(response.code, 200)
        res = json.loads(response.body)

        self.assertTrue('uri' in res)
        self.assertFalse(os.path.exists(fp))
        self.assertTrue(os.path.exists(newpath))

    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_put_copy(self,m):
        fp = os.path.join(self.test_dir,'testfile.txt')
        newpath = os.path.join(self.test_dir,'testfile2.txt')
        open(fp,'w').close()

        args = {
            'filepath': fp,
            'action': {
                'action': 'copy',
                'copypath': newpath
            }
        }

        response = self.fetch(
            '/a/filesystem/',
            method='PUT',
            headers=self.json_headers,
            body=json.dumps(args),
            follow_redirects=False
        )

        self.assertEqual(response.code, 200)
        res = json.loads(response.body)

        self.assertTrue('uri' in res)
        self.assertTrue(os.path.exists(fp))
        self.assertTrue(os.path.exists(newpath))

    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_put_rename(self,m):
        fp = os.path.join(self.test_dir,'testfile.txt')
        newpath = os.path.join(self.test_dir,'testfile2.txt')
        open(fp,'w').close()

        args = {
            'filepath': fp,
            'action': {
                'action': 'rename',
                'newname': 'testfile2.txt'
            }
        }

        response = self.fetch(
            '/a/filesystem/',
            method='PUT',
            headers=self.json_headers,
            body=json.dumps(args),
            follow_redirects=False
        )

        self.assertEqual(response.code, 200)
        res = json.loads(response.body)

        self.assertTrue('uri' in res)
        self.assertFalse(os.path.exists(fp))
        self.assertTrue(os.path.exists(newpath))

class FilewatcherCreateHandlerTestCase(TestHandlerBase):
    def setUp(self,*args,**kwargs):
        self.test_dir = tempfile.mkdtemp()
        self.json_headers = {
            'Content-Type': 'application/json;charset=UTF-8'
        }
        super(FilewatcherCreateHandlerTestCase,self).setUp(*args,**kwargs)

    def tearDown(self,*args,**kwargs):
        shutil.rmtree(self.test_dir)
        super(FilewatcherCreateHandlerTestCase,self).tearDown(*args,**kwargs)

    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_post(self,m):
        fakep = os.path.join(self.test_dir,'fakedir','')
        args = {
            'filepath': self.test_dir
        }
        with mock.patch.object(Filewatcher,'add_directory_to_watch',return_value=None) as mfw:
            response = self.fetch(
                '/a/filesystem/watchers/',
                method='POST',
                headers=self.json_headers,
                body=json.dumps(args),
                follow_redirects=False
            )

            self.assertEqual(response.code, 200)
            res = json.loads(response.body)

            mfw.assert_called_with(self.test_dir)

        args = {
            'filepath': fakep
        }
        response = self.fetch(
            '/a/filesystem/watchers/',
            method='POST',
            headers=self.json_headers,
            body=json.dumps(args),
            follow_redirects=False
        )

        self.assertEqual(response.code, 404)

class FilewatcherDeleteHandlerTestCase(TestHandlerBase):
    def setUp(self,*args,**kwargs):
        self.test_dir = tempfile.mkdtemp()
        self.json_headers = {
            'Content-Type': 'application/json;charset=UTF-8'
        }
        super(FilewatcherDeleteHandlerTestCase,self).setUp(*args,**kwargs)

    def tearDown(self,*args,**kwargs):
        shutil.rmtree(self.test_dir)
        super(FilewatcherDeleteHandlerTestCase,self).tearDown(*args,**kwargs)

    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_delete(self,m):
        with mock.patch.object(Filewatcher,'remove_directory_to_watch',return_value=None) as mfw:
            escaped_path = tornado.escape.url_escape(self.test_dir)
            response = self.fetch(
                '/a/filesystem/watchers/{}/'.format(escaped_path),
                method='DELETE',
                headers=self.json_headers,
                follow_redirects=False
            )

            self.assertEqual(response.code, 200)
            res = json.loads(response.body)

            mfw.assert_called_with(self.test_dir)

class FileHandlerTestCase(TestHandlerBase):
    def setUp(self,*args,**kwargs):
        self.test_dir = tempfile.mkdtemp()
        self.json_headers = {
            'Content-Type': 'application/json;charset=UTF-8'
        }
        super(FileHandlerTestCase,self).setUp(*args,**kwargs)

    def tearDown(self,*args,**kwargs):
        shutil.rmtree(self.test_dir)
        super(FileHandlerTestCase,self).tearDown(*args,**kwargs)

    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_get(self,m):
        fp = os.path.join(self.test_dir,'testfile.txt')
        fakep = os.path.join(self.test_dir,'fake.txt')
        open(fp,'w').close()

        escaped_path = tornado.escape.url_escape(fakep)
        response = self.fetch(
            '/a/filesystem/files/{}/'.format(escaped_path),
            method='GET',
            follow_redirects=False
        )
        self.assertEqual(response.code, 404)

        escaped_path = tornado.escape.url_escape(fp)
        response = self.fetch(
            '/a/filesystem/files/{}/'.format(escaped_path),
            method='GET',
            follow_redirects=False
        )
        self.assertEqual(response.code, 200)
        res = json.loads(response.body)

        self.assertEqual(res['filepath'],fp)
        self.assertEqual(res['type'],'file')

    @mock.patch('sandstone.lib.filesystem.interfaces.PosixFS.update_group')
    @mock.patch('sandstone.lib.filesystem.interfaces.PosixFS.exists')
    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_get_update_group(self,m,exists,update_group):
        fp = os.path.join(self.test_dir,'testfile.txt')
        escaped_path = tornado.escape.url_escape(fp)

        exists.return_value = False
        args = {
            'action': {
                'action': 'update_group',
                'group': 'testgrp'
            }
        }
        response = self.fetch(
            '/a/filesystem/files/{}/'.format(escaped_path),
            method='PUT',
            headers=self.json_headers,
            body=json.dumps(args),
            follow_redirects=False
        )
        self.assertEqual(response.code, 404)

        exists.return_value = True
        update_group.side_effect = OSError
        response = self.fetch(
            '/a/filesystem/files/{}/'.format(escaped_path),
            method='PUT',
            headers=self.json_headers,
            body=json.dumps(args),
            follow_redirects=False
        )
        self.assertEqual(response.code, 404)
        update_group.assert_called_with(fp,'testgrp')

        update_group.side_effect = None
        update_group.reset_mock()
        response = self.fetch(
            '/a/filesystem/files/{}/'.format(escaped_path),
            method='PUT',
            headers=self.json_headers,
            body=json.dumps(args),
            follow_redirects=False
        )
        self.assertEqual(response.code, 200)
        update_group.assert_called_with(fp,'testgrp')

    @mock.patch('sandstone.lib.filesystem.interfaces.PosixFS.update_permissions')
    @mock.patch('sandstone.lib.filesystem.interfaces.PosixFS.exists')
    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_get_update_group(self,m,exists,update_permissions):
        fp = os.path.join(self.test_dir,'testfile.txt')
        escaped_path = tornado.escape.url_escape(fp)

        args = {
            'action': {
                'action': 'update_permissions',
                'permissions': 'rwxrw-r--'
            }
        }
        exists.return_value = True
        update_permissions.side_effect = OSError
        response = self.fetch(
            '/a/filesystem/files/{}/'.format(escaped_path),
            method='PUT',
            headers=self.json_headers,
            body=json.dumps(args),
            follow_redirects=False
        )
        self.assertEqual(response.code, 404)
        update_permissions.assert_called_with(fp,'rwxrw-r--')

        update_permissions.side_effect = None
        update_permissions.reset_mock()
        response = self.fetch(
            '/a/filesystem/files/{}/'.format(escaped_path),
            method='PUT',
            headers=self.json_headers,
            body=json.dumps(args),
            follow_redirects=False
        )
        self.assertEqual(response.code, 200)
        update_permissions.assert_called_with(fp,'rwxrw-r--')
