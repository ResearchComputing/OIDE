import tornado.web
from sandstone.lib.filesystem.interfaces import PosixFS



class FSMixin(tornado.web.RequestHandler):

    def initialize(self):
        self.fs = PosixFS()
