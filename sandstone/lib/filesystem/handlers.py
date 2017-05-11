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

class DownloadFileHandler(BaseHandler):
    CACHE_MAX_AGE = 86400 * 365 * 10  # 10 years

    _static_hashes = {}  # type: typing.Dict
    _lock = threading.Lock()  # protects _static_hashes

    @classmethod
    def reset(cls):
        with cls._lock:
            cls._static_hashes = {}

    def head(self, path):
        return self.get(path, include_body=False)

    @tornado.web.asynchronous    
    @gen.coroutine
    def get(self, path, include_body=True):
        # Set up our path instance variables.
        self.path = self.parse_url_path(path)
        del path  # make sure we don't refer to path instead of self.path again
        self.absolute_path = os.path.abspath(self.path)
        # self.absolute_path = self.validate_absolute_path(
        #     self.root, absolute_path)
        if self.absolute_path is None:
            return

        self.modified = self.get_modified_time()
        self.set_headers()

        if self.should_return_304():
            self.set_status(304)
            return

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
                self.set_header('Content-Type', 'application/force-download')
                self.set_header('Content-Disposition', 'attachment; filename=%s' % self.path)
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
            content = self.get_content(self.absolute_path, start, end)
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

    def compute_etag(self):
        """Sets the ``Etag`` header based on static url version.
        This allows efficient ``If-None-Match`` checks against cached
        versions, and sends the correct ``Etag`` for a partial response
        (i.e. the same ``Etag`` as the full file).
        .. versionadded:: 3.1
        """
        version_hash = self._get_cached_version(self.absolute_path)
        if not version_hash:
            return None
        return '"%s"' % (version_hash, )

    def set_headers(self):
        """Sets the content and caching headers on the response.
        .. versionadded:: 3.1
        """
        self.set_header("Accept-Ranges", "bytes")
        self.set_etag_header()

        if self.modified is not None:
            self.set_header("Last-Modified", self.modified)

        content_type = self.get_content_type()
        if content_type:
            self.set_header("Content-Type", content_type)

        cache_time = self.get_cache_time(self.path, self.modified,
                                         content_type)
        if cache_time > 0:
            self.set_header("Expires", datetime.datetime.utcnow() +
                            datetime.timedelta(seconds=cache_time))
            self.set_header("Cache-Control", "max-age=" + str(cache_time))

        self.set_extra_headers(self.path)

    def should_return_304(self):
        """Returns True if the headers indicate that we should return 304.
        .. versionadded:: 3.1
        """
        if self.check_etag_header():
            return True

        # Check the If-Modified-Since, and don't send the result if the
        # content has not been modified
        ims_value = self.request.headers.get("If-Modified-Since")
        if ims_value is not None:
            date_tuple = email.utils.parsedate(ims_value)
            if date_tuple is not None:
                if_since = datetime.datetime(*date_tuple[:6])
                if if_since >= self.modified:
                    return True

        return False

    @classmethod
    def get_absolute_path(cls, root, path):
        """Returns the absolute location of ``path`` relative to ``root``.
        ``root`` is the path configured for this `StaticFileHandler`
        (in most cases the ``static_path`` `Application` setting).
        This class method may be overridden in subclasses.  By default
        it returns a filesystem path, but other strings may be used
        as long as they are unique and understood by the subclass's
        overridden `get_content`.
        .. versionadded:: 3.1
        """
        abspath = os.path.abspath(os.path.join(root, path))
        return abspath

    def validate_absolute_path(self, root, absolute_path):
        """Validate and return the absolute path.
        ``root`` is the configured path for the `StaticFileHandler`,
        and ``path`` is the result of `get_absolute_path`
        This is an instance method called during request processing,
        so it may raise `HTTPError` or use methods like
        `RequestHandler.redirect` (return None after redirecting to
        halt further processing).  This is where 404 errors for missing files
        are generated.
        This method may modify the path before returning it, but note that
        any such modifications will not be understood by `make_static_url`.
        In instance methods, this method's result is available as
        ``self.absolute_path``.
        .. versionadded:: 3.1
        """
        # os.path.abspath strips a trailing /.
        # We must add it back to `root` so that we only match files
        # in a directory named `root` instead of files starting with
        # that prefix.
        root = os.path.abspath(root)
        if not root.endswith(os.path.sep):
            # abspath always removes a trailing slash, except when
            # root is '/'. This is an unusual case, but several projects
            # have independently discovered this technique to disable
            # Tornado's path validation and (hopefully) do their own,
            # so we need to support it.
            root += os.path.sep
        # The trailing slash also needs to be temporarily added back
        # the requested path so a request to root/ will match.
        if not (absolute_path + os.path.sep).startswith(root):
            raise HTTPError(403, "%s is not in root static directory",
                            self.path)
        if (os.path.isdir(absolute_path) and
                self.default_filename is not None):
            # need to look at the request.path here for when path is empty
            # but there is some prefix to the path that was already
            # trimmed by the routing
            if not self.request.path.endswith("/"):
                self.redirect(self.request.path + "/", permanent=True)
                return
            absolute_path = os.path.join(absolute_path, self.default_filename)
        if not os.path.exists(absolute_path):
            raise HTTPError(404)
        if not os.path.isfile(absolute_path):
            raise HTTPError(403, "%s is not a file", self.path)
        return absolute_path

    @classmethod
    def get_content(cls, abspath, start=None, end=None):
        """Retrieve the content of the requested resource which is located
        at the given absolute path.
        This class method may be overridden by subclasses.  Note that its
        signature is different from other overridable class methods
        (no ``settings`` argument); this is deliberate to ensure that
        ``abspath`` is able to stand on its own as a cache key.
        This method should either return a byte string or an iterator
        of byte strings.  The latter is preferred for large files
        as it helps reduce memory fragmentation.
        .. versionadded:: 3.1
        """
        with open(abspath, "rb") as file:
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

    @classmethod
    def get_content_version(cls, abspath):
        """Returns a version string for the resource at the given path.
        This class method may be overridden by subclasses.  The
        default implementation is a hash of the file's contents.
        .. versionadded:: 3.1
        """
        data = cls.get_content(abspath)
        hasher = hashlib.md5()
        if isinstance(data, bytes):
            hasher.update(data)
        else:
            for chunk in data:
                hasher.update(chunk)
        return hasher.hexdigest()

    def _stat(self):
        if not hasattr(self, '_stat_result'):
            self._stat_result = os.stat(self.absolute_path)
        return self._stat_result

    def get_content_size(self):
        """Retrieve the total size of the resource at the given path.
        This method may be overridden by subclasses.
        .. versionadded:: 3.1
        .. versionchanged:: 4.0
           This method is now always called, instead of only when
           partial results are requested.
        """
        stat_result = self._stat()
        return stat_result[stat.ST_SIZE]

    def get_modified_time(self):
        """Returns the time that ``self.absolute_path`` was last modified.
        May be overridden in subclasses.  Should return a `~datetime.datetime`
        object or None.
        .. versionadded:: 3.1
        """
        stat_result = self._stat()
        modified = datetime.datetime.utcfromtimestamp(
            stat_result[stat.ST_MTIME])
        return modified

    def get_content_type(self):
        """Returns the ``Content-Type`` header to be used for this request.
        .. versionadded:: 3.1
        """
        mime_type, encoding = mimetypes.guess_type(self.absolute_path)
        # per RFC 6713, use the appropriate type for a gzip compressed file
        if encoding == "gzip":
            return "application/gzip"
        # As of 2015-07-21 there is no bzip2 encoding defined at
        # http://www.iana.org/assignments/media-types/media-types.xhtml
        # So for that (and any other encoding), use octet-stream.
        elif encoding is not None:
            return "application/octet-stream"
        elif mime_type is not None:
            return mime_type
        # if mime_type not detected, use application/octet-stream
        else:
            return "application/octet-stream"

    def set_extra_headers(self, path):
        """For subclass to add extra headers to the response"""
        pass

    def get_cache_time(self, path, modified, mime_type):
        """Override to customize cache control behavior.
        Return a positive number of seconds to make the result
        cacheable for that amount of time or 0 to mark resource as
        cacheable for an unspecified amount of time (subject to
        browser heuristics).
        By default returns cache expiry of 10 years for resources requested
        with ``v`` argument.
        """
        return self.CACHE_MAX_AGE if "v" in self.request.arguments else 0

    @classmethod
    def make_static_url(cls, settings, path, include_version=True):
        """Constructs a versioned url for the given path.
        This method may be overridden in subclasses (but note that it
        is a class method rather than an instance method).  Subclasses
        are only required to implement the signature
        ``make_static_url(cls, settings, path)``; other keyword
        arguments may be passed through `~RequestHandler.static_url`
        but are not standard.
        ``settings`` is the `Application.settings` dictionary.  ``path``
        is the static path being requested.  The url returned should be
        relative to the current host.
        ``include_version`` determines whether the generated URL should
        include the query string containing the version hash of the
        file corresponding to the given ``path``.
        """
        url = settings.get('static_url_prefix', '/static/') + path
        if not include_version:
            return url

        version_hash = cls.get_version(settings, path)
        if not version_hash:
            return url

        return '%s?v=%s' % (url, version_hash)

    def parse_url_path(self, url_path):
        """Converts a static URL path into a filesystem path.
        ``url_path`` is the path component of the URL with
        ``static_url_prefix`` removed.  The return value should be
        filesystem path relative to ``static_path``.
        This is the inverse of `make_static_url`.
        """
        if os.path.sep != "/":
            url_path = url_path.replace("/", os.path.sep)
        return url_path

    @classmethod
    def get_version(cls, settings, path):
        """Generate the version string to be used in static URLs.
        ``settings`` is the `Application.settings` dictionary and ``path``
        is the relative location of the requested asset on the filesystem.
        The returned value should be a string, or ``None`` if no version
        could be determined.
        .. versionchanged:: 3.1
           This method was previously recommended for subclasses to override;
           `get_content_version` is now preferred as it allows the base
           class to handle caching of the result.
        """
        abs_path = cls.get_absolute_path(settings['static_path'], path)
        return cls._get_cached_version(abs_path)

    @classmethod
    def _get_cached_version(cls, abs_path):
        with cls._lock:
            hashes = cls._static_hashes
            if abs_path not in hashes:
                try:
                    hashes[abs_path] = cls.get_content_version(abs_path)
                except Exception:
                    gen_log.error("Could not open static file %r", abs_path)
                    hashes[abs_path] = None
            hsh = hashes.get(abs_path)
            if hsh:
                return hsh
        return None
