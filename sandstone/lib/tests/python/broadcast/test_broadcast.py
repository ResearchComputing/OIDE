import os
import pwd
import unittest
import mock
import tornado.web
import tornado.websocket
import tornado.escape
from tornado.testing import gen_test
from tornado.websocket import websocket_connect
from tornado.httpclient import HTTPRequest
from tornado.httpclient import HTTPError
from sandstone.lib.test_utils import TestHandlerBase
from sandstone.lib.handlers.base import BaseHandler
from sandstone.lib.broadcast.message import BroadcastMessage
from sandstone.lib.broadcast.manager import BroadcastManager
from sandstone.lib.broadcast.handlers import BroadcastHandler


EXEC_USER = pwd.getpwuid(os.getuid())[0]

class BroadcastMessageTestCase(unittest.TestCase):
    def test_init(self):
        key = 'test:test_msg'
        data = {'test':'test'}
        bmsg = BroadcastMessage(
            key=key,
            data=data)
        self.assertEqual(bmsg.key,key)
        self.assertEqual(bmsg.data,data)

        with self.assertRaises(BroadcastMessage.MessageValidationError):
            bmsg = BroadcastMessage(
                data=data)
        with self.assertRaises(BroadcastMessage.MessageValidationError):
            bmsg = BroadcastMessage(
                key=key)
        with self.assertRaises(BroadcastMessage.MessageValidationError):
            bmsg = BroadcastMessage(
                key=1,
                data=data)
        with self.assertRaises(BroadcastMessage.MessageValidationError):
            bmsg = BroadcastMessage(
                key='test',
                data=[])

    def test_create_from_string(self):
        msg_d = {
            'key': 'test:test_msg',
            'data': {'test':'test'},
            'extra': 'attr'
        }
        bmsg = BroadcastMessage.create_from_string(
            tornado.escape.json_encode(msg_d)
        )
        self.assertEqual(bmsg.key,msg_d['key'])
        self.assertEqual(bmsg.data,msg_d['data'])
        self.assertFalse(hasattr(bmsg,'extra'))

    def test_to_json_string(self):
        msg_d = {
            'key': 'test:test_msg',
            'data': {'test':'test'},
        }
        bmsg = BroadcastMessage(
            key=msg_d['key'],
            data=msg_d['data'])
        json_str = bmsg.to_json_string()
        self.assertEqual(
            json_str,
            tornado.escape.json_encode(msg_d)
        )

class BroadcastHandlerTestCase(TestHandlerBase):
    def setUp(self):
        BroadcastManager._clients = set()
        request = mock.Mock()
        reqh = tornado.web.RequestHandler(self.get_app(),request)
        reqh.set_secure_cookie('user',EXEC_USER)
        cookie = reqh._new_cookie.get('user')
        self.auth_cookie = 'user="{}"'.format(cookie.value)
        super(BroadcastHandlerTestCase,self).setUp()

    @gen_test
    def test_unauthed(self):
        msg = {
          'key': 'test:test_msg',
          'data': {
              'test': 'test'
          }
        }
        msg_json = tornado.escape.json_encode(msg)

        self.assertEqual(len(BroadcastManager._clients),0)

        with mock.patch('pydispatch.dispatcher.send',mock.MagicMock()) as d:
            with self.assertRaises(HTTPError):
                ws = yield websocket_connect(
                    HTTPRequest(
                        'ws://localhost:%d/messages' % self.get_http_port(),
                    ),
                    io_loop=self.io_loop)
            self.assertFalse(d.called)
        self.assertEqual(len(BroadcastManager._clients),0)

    @gen_test
    def test_send_message(self):
        msg = {
          'key': 'test:test_msg',
          'data': {
              'test': 'test'
          }
        }
        msg_json = tornado.escape.json_encode(msg)

        self.assertEqual(len(BroadcastManager._clients),0)

        with mock.patch('pydispatch.dispatcher.send',mock.MagicMock()) as d:
            ws = yield websocket_connect(
                HTTPRequest(
                    'ws://localhost:%d/messages' % self.get_http_port(),
                    headers={'Cookie':self.auth_cookie}),
                io_loop=self.io_loop)
            ws.write_message(msg_json)
            response = yield ws.read_message()
            self.assertEqual(msg_json, response)
            d.assert_called_with(
                signal='test:test_msg',
                sender={'test': 'test'}
                )

        self.assertEqual(len(BroadcastManager._clients),1)

        with mock.patch.object(BroadcastManager,'broadcast') as m:
            del msg['key']
            invalid_msg = tornado.escape.json_encode(msg)
            ws.write_message(invalid_msg)
            response = yield ws.read_message()
            self.assertEqual(response,None)
            self.assertFalse(m.called)

class BroadcastManagerTestCase(TestHandlerBase):
    def setUp(self):
        BroadcastManager._clients = set()
        super(BroadcastManagerTestCase,self).setUp()

    def test_add_client(self):
        request = mock.Mock()
        client1 = BroadcastHandler(self.get_app(),request)
        client2 = BroadcastHandler(self.get_app(),request)
        invalid_client = BaseHandler(self.get_app(),request)

        self.assertEqual(BroadcastManager._clients,set())
        BroadcastManager.add_client(client1)
        self.assertEqual(BroadcastManager._clients,set([client1]))
        BroadcastManager.add_client(client2)
        self.assertEqual(BroadcastManager._clients,set([client1,client2]))
        with self.assertRaises(TypeError):
            BroadcastManager.add_client(invalid_client)

    def test_remove_client(self):
        request = mock.Mock()
        client1 = BroadcastHandler(self.get_app(),request)
        client2 = BroadcastHandler(self.get_app(),request)
        client3 = BroadcastHandler(self.get_app(),request)
        BroadcastManager.add_client(client1)
        BroadcastManager.add_client(client2)

        BroadcastManager.remove_client(client3)
        self.assertEqual(BroadcastManager._clients,set([client1,client2]))
        BroadcastManager.remove_client(client1)
        self.assertEqual(BroadcastManager._clients,set([client2]))
        BroadcastManager.remove_client(client2)
        self.assertEqual(BroadcastManager._clients,set())
        BroadcastManager.remove_client(client2)
        self.assertEqual(BroadcastManager._clients,set())

    @mock.patch.object(BroadcastHandler,'write_message')
    def test_broadcast(self,m):
        request = mock.Mock()
        client1 = BroadcastHandler(self.get_app(),request)
        client2 = BroadcastHandler(self.get_app(),request)
        msg = tornado.escape.json_encode({'key':'test:test_msg','data':{}})
        bmsg = BroadcastMessage.create_from_string(msg)

        BroadcastManager.broadcast(bmsg)
        self.assertFalse(m.called)

        m.reset_mock()
        BroadcastManager.add_client(client1)
        BroadcastManager.broadcast(bmsg)
        self.assertEqual(m.call_count,1)
        m.assert_called_with(msg)

        m.reset_mock()
        BroadcastManager.add_client(client2)
        BroadcastManager.broadcast(bmsg)
        self.assertEqual(m.call_count,2)
        m.assert_called_with(msg)

        m.reset_mock()
        invalid_msg = msg
        with self.assertRaises(TypeError):
            BroadcastManager.broadcast(invalid_msg)
        self.assertFalse(m.called)
