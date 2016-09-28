import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.escape
import json
from pydispatch import dispatcher


class BroadcastManager(object):
    _clients = set()

    @classmethod
    def add_client(cls, client):
        cls._clients.add(client)

    @classmethod
    def broadcast(cls, message):
        for client in cls._clients:
            try:
                client.write_message(message)
            except:
                import pdb
                pdb.set_trace()

    @classmethod
    def remove_client(cls, client):
        if client:
            cls._clients.remove(client)

class BroadcastHandler(tornado.websocket.WebSocketHandler):
    """
    Used to receive and send messages to connected apps
    """
    def open(self):
        BroadcastManager.add_client(self)
    def on_message(self, message):
        # broadcast message
        BroadcastManager.broadcast(message)
        # get the event from the message
        message_info = tornado.escape.json_decode(message)
        event = message_info['key']
        data = message_info['data']
        dispatcher.send(signal=event, sender=data)

    def on_close(self):
        # remove the client from the list of clients
        BroadcastManager.remove_client(self)
