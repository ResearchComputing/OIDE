import os
import pwd
import urllib
import mock
from sandstone.lib.handlers.base import BaseHandler
from sandstone.lib.handlers.logout import LogoutHandler
from sandstone.lib.test_utils import TestHandlerBase
from tornado.testing import gen_test
from tornado.websocket import websocket_connect


EXEC_USER = pwd.getpwuid(os.getuid())[0]

class MainHandlerTestCase(TestHandlerBase):
    @mock.patch('sandstone.settings.URL_PREFIX','')
    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_get_authed(self,m):
        response = self.fetch(
            '/',
            method='GET',
            follow_redirects=False)

        # Use of angular routing on client-side means there should
        # be no redirection.
        self.assertEqual(response.code, 200)
        login_form = """<form action="/auth/login" method="POST" class="form-signin" role="form">"""
        self.assertNotIn(login_form,response.body)

    @mock.patch('sandstone.settings.URL_PREFIX','')
    def test_get_unauthed(self):
        response = self.fetch(
            '/',
            method='GET',
            follow_redirects=False)

        self.assertEqual(response.code, 302)
        self.assertEqual(response.headers['Location'],'/auth/login?next=%2F')

    @mock.patch('sandstone.settings.URL_PREFIX','')
    def test_get_unauthed_redirect(self):
        response = self.fetch(
            '/',
            method='GET')

        self.assertEqual(response.code, 200)
        login_form = """<form action="/auth/login" method="POST" class="form-signin" role="form">"""
        self.assertIn(login_form,response.body)

class BaseHandlerTestCase(TestHandlerBase):
    @mock.patch('sandstone.settings.URL_PREFIX','')
    @mock.patch.object(BaseHandler,'get_secure_cookie',return_value=EXEC_USER)
    def test_get_current_user_authed(self,m):
        request = mock.Mock()
        handler = BaseHandler(self.get_app(),request)
        user = handler.get_current_user()
        self.assertEqual(user,EXEC_USER)

    @mock.patch('sandstone.settings.URL_PREFIX','')
    def test_get_current_user_unauthed(self):
        request = mock.Mock()
        request.cookies = None
        handler = BaseHandler(self.get_app(),request)
        user = handler.get_current_user()
        self.assertEqual(user, None)

    @mock.patch('sandstone.settings.URL_PREFIX','')
    def test_get_template_path(self):
        app = self.get_app()
        request = mock.Mock()
        handler = BaseHandler(app,request)
        tpath = handler.get_template_path()
        self.assertEqual(tpath,app.settings['project_dir'])

class PAMLoginHandlerTestCase(TestHandlerBase):
    @mock.patch('sandstone.settings.URL_PREFIX','')
    def test_get(self):
        response = self.fetch(
            '/auth/login',
            method='GET')

        self.assertEqual(response.code, 200)
        login_form = """<form action="/auth/login" method="POST" class="form-signin" role="form">"""
        self.assertIn(login_form,response.body)

    @mock.patch('sandstone.settings.URL_PREFIX','')
    @mock.patch('simplepam.authenticate',return_value=True)
    def test_post(self,m):
        post_args = {
            'username': 'goodun',
            'password': 'goodpwd',
        }
        response = self.fetch(
            '/auth/login',
            method='POST',
            body=urllib.urlencode(post_args),
            follow_redirects=False)
        self.assertEqual(response.code, 302)
        self.assertEqual(response.headers["Location"],'/')

    @mock.patch('sandstone.settings.URL_PREFIX','')
    def test_post_bad_creds(self):
        post_args = {
            'username': 'fakeun',
            'password': 'fakepwd',
        }
        response = self.fetch(
            '/auth/login',
            method='POST',
            body=urllib.urlencode(post_args),
            follow_redirects=False)

        self.assertEqual(response.code, 403)
        login_form = """<form action="/auth/login" method="POST" class="form-signin" role="form">"""
        self.assertIn(login_form,response.body)


# class UpdateHandlerTestCase(TestHandlerBase):
#     # Based on websocket tests written for Tornado
#     # https://github.com/tornadoweb/tornado/blob/master/tornado/test/websocket_test.py
#     @gen_test
#     def test_a(self):
#         message = {
#           'key': 'editor:openDocument',
#           'data': {
#               'filename': 'somepath'
#           }
#         }
#         ws = yield websocket_connect(
#             'ws://localhost:%d/messages' % self.get_http_port(),
#             io_loop=self.io_loop)
#         ws.write_message(str(message))
#         response = yield ws.read_message()
#         self.assertIn(
#                 str(message), response
#         )

# class LogoutHandlerTestCase(TestHandlerBase):
#     @mock.patch.object(BaseHandler,'get_argument',return_value='next_url')
#     def test_get(self,m):
#         request = mock.Mock()
#         request.body = ''
#         handler = LogoutHandler(self.get_app(),request)
#         with mock.patch.object(handler,'clear_cookie',wraps=handler.clear_cookie) as mock_clear:
#             handler.get()
#             mock_clear.assert_called()
