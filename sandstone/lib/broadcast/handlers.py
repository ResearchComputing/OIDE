import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.escape
from pydispatch import dispatcher
from sandstone.lib.broadcast.manager import BroadcastManager

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
