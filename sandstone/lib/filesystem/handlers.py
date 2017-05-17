import datetime
import json
import mimetypes
import os
import stat
import threading
import tornado.web
import tornado.escape

import sandstone.lib.decorators
from sandstone import settings
from sandstone.lib.handlers.base import BaseHandler
from sandstone.lib.handlers.rest import JSONHandler
from sandstone.lib.filesystem.mixins import FSMixin
from sandstone.lib.filesystem.filewatcher import Filewatcher

from tornado import httputil
from tornado import iostream
from tornado import gen
from tornado.log import access_log, app_log, gen_log
from tornado.web import StaticFileHandler



class FilesystemHandler(JSONHandler,FSMixin):
    """
    This handler implements the root filesystem resource for the
    filesystem REST API.
    """

    def _move(self):
        """
        Called during a PUT request where the action specifies
        a move operation. Returns resource URI of the destination file.
        """
        newpath = self.action['newpath']
        try:
            self.fs.move(self.fp,newpath)
        except OSError:
            raise tornado.web.HTTPError(400)
        return newpath

    def _copy(self):
        """
        Called during a PUT request where the action specifies
        a copy operation. Returns resource URI of the new file.
        """
        copypath = self.action['copypath']
        try:
            self.fs.copy(self.fp,copypath)
        except OSError:
            raise tornado.web.HTTPError(400)
        return copypath

    def _rename(self):
        """
        Called during a PUT request where the action specifies
        a rename operation. Returns resource URI of the renamed file.
        """
        newname = self.action['newname']
        try:
            newpath = self.fs.rename(self.fp,newname)
        except OSError:
            raise tornado.web.HTTPError(400)
        return newpath

    @sandstone.lib.decorators.authenticated
    def get(self):
        """
        Return details for the filesystem, including configured volumes.
        """
        res = self.fs.get_filesystem_details()
        res = res.to_dict()
        self.write(res)

    @sandstone.lib.decorators.authenticated
    def put(self):
        """
        Provides move, copy, and rename functionality. An action must be
        specified when calling this method.
        """
        self.fp = self.get_body_argument('filepath')
        self.action = self.get_body_argument('action')

        try:
            ptype = self.fs.get_type_from_path(self.fp)
        except OSError:
            raise tornado.web.HTTPError(404)
        if ptype == 'directory':
            self.handler_name = 'filesystem:directories-details'
        else:
            self.handler_name = 'filesystem:files-details'

        if self.action['action'] == 'move':
            newpath = self._move()
            self.write({'filepath':newpath})
        elif self.action['action'] == 'copy':
            newpath = self._copy()
            self.write({'filepath':newpath})
        elif self.action['action'] == 'rename':
            newpath = self._rename()
            self.write({'filepath':newpath})
        else:
            raise tornado.web.HTTPError(400)

class FilewatcherCreateHandler(JSONHandler,FSMixin):
    """
    This handlers implements the filewatcher create REST API.
    """

    @sandstone.lib.decorators.authenticated
    def post(self, *args):
        """
        Start a new filewatcher at the specified path.
        """
        filepath = self.get_body_argument('filepath')
        if not self.fs.exists(filepath):
            raise tornado.web.HTTPError(404)

        Filewatcher.add_directory_to_watch(filepath)
        self.write({'msg':'Watcher added for {}'.format(filepath)})

class FilewatcherDeleteHandler(JSONHandler,FSMixin):
    """
    This handlers implements the filewatcher delete REST API.
    """
    @sandstone.lib.decorators.authenticated
    def delete(self, filepath):
        """
        Stop and delete the specified filewatcher.
        """
        Filewatcher.remove_directory_to_watch(filepath)
        self.write({'msg':'Watcher deleted for {}'.format(filepath)})


class FileHandler(JSONHandler,FSMixin):
    """
    This handler implements the file resource for the
    filesystem REST API.
    """

    @sandstone.lib.decorators.authenticated
    def get(self, filepath):
        """
        Get file details for the specified file.
        """
        try:
            res = self.fs.get_file_details(filepath)
            res = res.to_dict()
            self.write(res)
        except OSError:
            raise tornado.web.HTTPError(404)

    @sandstone.lib.decorators.authenticated
    def put(self, filepath):
        """
        Change the group or permissions of the specified file. Action
        must be specified when calling this method.
        """
        action = self.get_body_argument('action')

        if action['action'] == 'update_group':
            newgrp = action['group']
            try:
                self.fs.update_group(filepath,newgrp)
                self.write({'msg':'Updated group for {}'.format(filepath)})
            except OSError:
                raise tornado.web.HTTPError(404)
        elif action['action'] == 'update_permissions':
            newperms = action['permissions']
            try:
                self.fs.update_permissions(filepath,newperms)
                self.write({'msg':'Updated permissions for {}'.format(filepath)})
            except OSError:
                raise tornado.web.HTTPError(404)
        else:
            raise tornado.web.HTTPError(400)

    @sandstone.lib.decorators.authenticated
    def delete(self, filepath):
        """
        Delete the specified file.
        """
        try:
            self.fs.delete(filepath)
            self.write({'msg':'File deleted at {}'.format(filepath)})
        except OSError:
            raise tornado.web.HTTPError(404)

class FileCreateHandler(JSONHandler,FSMixin):
    """
    This handler implements the file create resource for the
    filesystem REST API. Returns the resource URI if successfully
    created.
    """

    @sandstone.lib.decorators.authenticated
    def post(self):
        """
        Create a new file at the specified path.
        """
        filepath = self.get_body_argument('filepath')

        try:
            self.fs.create_file(filepath)
        except OSError, IOError:
            raise tornado.web.HTTPError(400)

        encoded_filepath = tornado.escape.url_escape(filepath,plus=True)
        resource_uri = self.reverse_url('filesystem:files-details', encoded_filepath)
        self.write({'uri':resource_uri})

class DirectoryHandler(FileHandler):
    """
    This handler implements the directory resource for the
    filesystem REST API.
    """

    @sandstone.lib.decorators.authenticated
    def get(self, filepath):
        """
        Get directory details for the specified file. If contents is
        set to True (default) then the directory contents will be sent
        along with the directory details. If dir_size is set to True
        (default=False) then du -hs will be run against subdirectories
        for accurate content sizes.
        """
        contents = self.get_argument('contents', False)
        if contents == u'true':
            contents = True
        else:
            contents = False
        dir_sizes = self.get_argument('dir_sizes', False)
        if dir_sizes == u'true':
            dir_sizes = True
        else:
            dir_sizes = False

        try:
            res = self.fs.get_directory_details(filepath,contents=contents,dir_sizes=dir_sizes)
            res = res.to_dict()
            self.write(res)
        except OSError:
            raise tornado.web.HTTPError(404)

class DirectoryCreateHandler(JSONHandler,FSMixin):
    """
    This handler implements the directory create resource for the
    filesystem REST API. Returns the resource URI if successfully
    created.
    """

    @sandstone.lib.decorators.authenticated
    def post(self):
        """
        Create a new directory at the specified path.
        """
        filepath = self.get_body_argument('filepath')

        try:
            self.fs.create_directory(filepath)
            encoded_filepath = tornado.escape.url_escape(filepath,plus=True)
            resource_uri = self.reverse_url('filesystem:directories-details', encoded_filepath)
            self.write({'uri':resource_uri})
        except OSError:
            raise tornado.web.HTTPError(404)

class FileContentsHandler(JSONHandler, FSMixin):
    """
    This handler provides read and write functionality for file contents.
    """

    @sandstone.lib.decorators.authenticated
    def get(self, filepath):
        """
        Get the contents of the specified file.
        """
        try:
            contents = self.fs.read_file(filepath)
            self.write({'filepath':filepath,'contents': contents})
        except OSError:
            raise tornado.web.HTTPError(404)

    @sandstone.lib.decorators.authenticated
    def post(self, filepath):
        """
        Write the given contents to the specified file. This is not
        an append, all file contents will be replaced by the contents
        given.
        """
        try:
            content = self.get_body_argument('content')
            self.fs.write_file(filepath, content)
            self.write({'msg': 'Updated file at {}'.format(filepath)})
        except OSError:
            raise tornado.web.HTTPError(404)

class FileDownloadHandler(BaseHandler,FSMixin):
    """
    This handler provides file downloads and hosting. FileContentsHandler will
    eventually be deprecated by this handler.
    """

    def head(self, filepath):
        return self.get(filepath, include_body=False)

    @sandstone.lib.decorators.authenticated
    @gen.coroutine
    def get(self, filepath, include_body=True):
        if not self.fs.exists(filepath):
            raise tornado.web.HTTPError(404)

        # Set up our path instance variables.
        self.filepath = filepath
        del filepath  # make sure we don't refer to filepath instead of self.filepath again

        self.set_headers()

        request_range = None
        range_header = self.request.headers.get("Range")
        if range_header:
            # As per RFC 2616 14.16, if an invalid Range header is specified,
            # the request will be treated as if the header didn't exist.
            request_range = httputil._parse_request_range(range_header)

        size = self.get_content_size()
        if request_range:
            start, end = request_range
            if (start is not None and start >= size) or end == 0:
                # As per RFC 2616 14.35.1, a range is not satisfiable only: if
                # the first requested byte is equal to or greater than the
                # content, or when a suffix with length 0 is specified
                self.set_status(416)  # Range Not Satisfiable
                self.set_header("Content-Type", "text/plain")
                self.set_header("Content-Range", "bytes */%s" % (size, ))
                return
            if start is not None and start < 0:
                start += size
            if end is not None and end > size:
                # Clients sometimes blindly use a large range to limit their
                # download size; cap the endpoint at the actual file size.
                end = size
            # Note: only return HTTP 206 if less than the entire range has been
            # requested. Not only is this semantically correct, but Chrome
            # refuses to play audio if it gets an HTTP 206 in response to
            # ``Range: bytes=0-``.
            if size != (end or size) - (start or 0):
                self.set_status(206)  # Partial Content
                self.set_header("Content-Range",
                                httputil._get_content_range(start, end, size))
        else:
            start = end = None

        if start is not None and end is not None:
            content_length = end - start
        elif end is not None:
            content_length = end
        elif start is not None:
            content_length = size - start
        else:
            content_length = size
        self.set_header("Content-Length", content_length)

        if include_body:
            content = self.get_content(start, end)
            if isinstance(content, bytes):
                content = [content]
            for chunk in content:
                try:
                    self.write(chunk)
                    yield self.flush()
                except iostream.StreamClosedError:
                    return
        else:
            assert self.request.method == "HEAD"

    def get_content(self, start=None, end=None):
        """
        Retrieve the content of the requested resource which is located
        at the given absolute path.
        This method should either return a byte string or an iterator
        of byte strings.  The latter is preferred for large files
        as it helps reduce memory fragmentation.
        """
        with open(self.filepath, "rb") as file:
            if start is not None:
                file.seek(start)
            if end is not None:
                remaining = end - (start or 0)
            else:
                remaining = None
            while True:
                chunk_size = 64 * 1024
                if remaining is not None and remaining < chunk_size:
                    chunk_size = remaining
                chunk = file.read(chunk_size)
                if chunk:
                    if remaining is not None:
                        remaining -= len(chunk)
                    yield chunk
                else:
                    if remaining is not None:
                        assert remaining == 0
                    return

    def set_headers(self):
        """
        Sets the content headers on the response.
        """
        self.set_header("Accept-Ranges", "bytes")

        content_type = self.get_content_type()
        if content_type:
            self.set_header("Content-Type", content_type)

    def _stat(self):
        if not hasattr(self, '_stat_result'):
            self._stat_result = os.stat(self.filepath)
        return self._stat_result

    def get_content_size(self):
        """
        Retrieve the total size of the resource at the given path.
        """
        stat_result = self._stat()
        return stat_result[stat.ST_SIZE]

    def get_content_type(self):
        """
        Returns the ``Content-Type`` header to be used for this request.
        """
        mime_type, encoding = mimetypes.guess_type(self.filepath)
        if encoding == "gzip":
            return "application/gzip"
        elif encoding is not None:
            return "application/octet-stream"
        elif mime_type is not None:
            return mime_type
        # if mime_type not detected, use application/octet-stream
        else:
            return "application/octet-stream"
