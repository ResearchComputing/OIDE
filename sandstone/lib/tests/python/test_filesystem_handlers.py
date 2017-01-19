import os
import pwd
import urllib
import mock
import json
import tempfile
import shutil
import stat
import subprocess
from sandstone.lib.handlers.base import BaseHandler
from sandstone.lib.test_utils import TestHandlerBase

from sandstone.lib.filesystem.handlers import FilesystemHandler



EXEC_USER = pwd.getpwuid(os.getuid())[0]

class FilesystemHandlerTestCase(TestHandlerBase):
    def setUp(self,*args,**kwargs):
        self.test_dir = tempfile.mkdtemp()
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
    def test_put(self,m):
        fp = os.path.join(self.test_dir,'testfile.txt')
        newpath = os.path.join(self.test_dir,'testfile2.txt')
        open(fp,'w').close()

        # Move file
        args = {
            'filepath': fp,
            'action': {
                'action': 'move',
                'newpath': newpath
            }
        }
        response = self.fetch(
            '/a/filesystem/?'+urllib.urlencode(args),
            method='PUT',
            body='',
            follow_redirects=False)

        self.assertEqual(response.code, 200)
        res = json.loads(response.body)
        print res
