import os
import re
import uuid
import json
import logging
import operator
import tornado.web
import tornado.ioloop
import tempfile

from tornado.concurrent import Future
from tornado import gen

import sandstone.lib.decorators
from sandstone import settings
from sandstone.lib.handlers.base import BaseHandler
from sandstone.lib.filesystem.mixins import FSMixin
from sandstone.lib.filesystem.filewatcher import Filewatcher



@tornado.web.stream_request_body
class SimpleUploadHandler(BaseHandler, FSMixin):

    @tornado.web.authenticated
    def post(self):
        fp = self.request.headers['Uploaddir']
        dest_path = os.path.join(fp,self.filename)
        self.fd.close()
        # shutil.move(self.fd.name,dest_path)
        self.fs.move(self.fd.name, dest_path)
        os.chmod(dest_path, 0644)

    @tornado.web.authenticated
    def prepare(self):
        self.tmp_cache = ''
        self.stream_started = False
        self.request.connection.set_max_body_size(2*1024**3)
        fd_info = tempfile.mkstemp()
        self.fd = open(fd_info[1],'w')

    def data_received(self, data):
        self.tmp_cache += data
        pdata = self._process(data)
        self.fd.write(pdata)

    def _process(self, data):
        trimmed = data.splitlines()
        tmp = data.splitlines(True)

        if not self.stream_started:
            self.boundary = trimmed[0].strip()
            tmp = tmp[1:]
            trimmed = trimmed[1:]
            self.stream_started = True

            try:
                first_elem = trimmed[:5].index("")
                metadata = trimmed[:first_elem]
                self.filename = metadata[0].split(';')[-1].split('=')[-1][1:-1]
                tmp = tmp[first_elem + 1:]
                trimmed = trimmed[first_elem + 1:]
            except ValueError:
                pass

        try:
            last_elem = trimmed.index(self.boundary + "--")
            self.stream_started = False
            return "".join(tmp[:last_elem - 1])
        except ValueError:
            return "".join(tmp)
