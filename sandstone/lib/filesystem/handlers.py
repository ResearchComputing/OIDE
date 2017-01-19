import json
import tornado.web
import tornado.escape

import sandstone.lib.decorators
from sandstone import settings
from sandstone.lib.handlers.base import BaseHandler
from sandstone.lib.filesystem.mixins import FSMixin
from sandstone.lib.filesystem.filewatcher import Filewatcher



class FilesystemHandler(BaseHandler,FSMixin):
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
            raise tornado.web.HTTPError(404)
        encoded_filepath = tornado.escape.url_escape(newpath,plus=True)
        resource_uri = self.reverse_url(handler_name,encoded_filepath)
        return resource_uri

    def _copy(self):
        """
        Called during a PUT request where the action specifies
        a copy operation. Returns resource URI of the new file.
        """
        copypath = self.action['copypath']
        try:
            self.fs.copy(self.fp,copypath)
        except OSError:
            raise tornado.web.HTTPError(404)
        encoded_filepath = tornado.escape.url_escape(copypath,plus=True)
        resource_uri = self.reverse_url(handler_name,encoded_filepath)

    def _rename(self):
        """
        Called during a PUT request where the action specifies
        a rename operation. Returns resource URI of the renamed file.
        """
        newname = self.action['newname']
        try:
            newpath = self.fs.rename(self.fp,newname)
        except OSError:
            raise tornado.web.HTTPError(404)
        encoded_filepath = tornado.escape.url_escape(newpath,plus=True)
        resource_uri = self.reverse_url(handler_name,encoded_filepath)

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
        self.fp = self.get_argument('filepath')
        action = self.get_argument('action')
        self.action = tornado.escape.json_decode(action)

        ptype = self.fs.get_type_from_path(self.fp)
        if ptype == 'directory':
            handler_name = 'filesystem:directories-details'
        else:
            handler_name = 'filesystem:files-details'

        if action['action'] == 'move':
            resource_uri = self._move()
            self.write({'uri':resource_uri})
        elif action['action'] == 'copy':
            resource_uri = self._copy()
            self.write({'uri':resource_uri})
        elif action['action'] == 'rename':
            resource_uri = self._rename()
            self.write({'uri':resource_uri})
        else:
            raise tornado.web.HTTPError(400)

class FilewatcherHandler(BaseHandler,FSMixin):
    """
    This handlers implements the filewatcher REST API.
    """

    @sandstone.lib.decorators.authenticated
    def get(self, *args):
        """
        Get list of active filewatchers.
        """
        pass

    @sandstone.lib.decorators.authenticated
    def post(self, *args):
        """
        Start a new filewatcher at the specified path.
        """
        filepath = self.get_argument('filepath', None)
        if filepath == None:
            raise tornado.web.HTTPError(400)
        Filewatcher.add_directory_to_watch(filepath)
        self.write({'msg':'Watcher added for {}'.format(filepath)})

    @sandstone.lib.decorators.authenticated
    def delete(self, filepath):
        """
        Stop and delete the specified filewatcher.
        """
        if filepath == None:
            raise tornado.web.HTTPError(400)
        Filewatcher.remove_directory_to_watch(filepath)
        self.write({'msg':'Watcher deleted for {}'.format(filepath)})


class FileHandler(BaseHandler,FSMixin):
    """
    This handler implements the file resource for the
    filesystem REST API.
    """

    @sandstone.lib.decorators.authenticated
    def get(self, filepath):
        """
        Get file details for the specified file.
        """
        if not self.fs.exists(filepath):
            raise tornado.web.HTTPError(404)

        res = self.fs.get_file_details(filepath)
        res = res.to_dict()
        self.write(res)

    @sandstone.lib.decorators.authenticated
    def put(self, filepath):
        """
        Change the group or permissions of the specified file. Action
        must be specified when calling this method.
        """
        if not self.fs.exists(filepath):
            raise tornado.web.HTTPError(404)

        action = self.get_argument('action')
        action = tornado.escape.json_decode(action)

        if action['action'] == 'update_group':
            newgrp = action['group']
            self.fs.update_group(filepath,newgrp)
            self.write({'msg':'Updated group for {}'.format(filepath)})
        elif action['action'] == 'update_permissions':
            newperms = action['permissions']
            self.fs.update_permissions(filepath,newperms)
            self.write({'msg':'Updated permissions for {}'.format(filepath)})

    @sandstone.lib.decorators.authenticated
    def delete(self, filepath):
        """
        Delete the specified file.
        """
        if not self.fs.exists(filepath):
            raise tornado.web.HTTPError(404)

        self.fs.delete(filepath)
        self.write({'msg':'File deleted at {}'.format(filepath)})

class FileCreateHandler(BaseHandler,FSMixin):
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
        filepath = self.get_argument('filepath')

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
        if not self.fs.exists(filepath):
            raise tornado.web.HTTPError(404)

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

        res = self.fs.get_directory_details(filepath,contents=contents,dir_sizes=dir_sizes)
        res = res.to_dict()
        self.write(res)

class DirectoryCreateHandler(BaseHandler,FSMixin):
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
        filepath = self.get_argument('filepath')

        self.fs.create_directory(filepath)

        encoded_filepath = tornado.escape.url_escape(filepath,plus=True)
        resource_uri = self.reverse_url('filesystem:directories-details', encoded_filepath)
        self.write({'uri':resource_uri})

class FileContentsHandler(BaseHandler, FSMixin):
    """
    This handler provides read and write functionality for file contents.
    """

    @sandstone.lib.decorators.authenticated
    def get(self, filepath):
        """
        Get the contents of the specified file.
        """
        if not self.fs.exists(filepath):
            raise tornado.web.HTTPError(404)

        contents = self.fs.read_file(filepath)
        self.write({'filepath':filepath,'contents': contents})

    @sandstone.lib.decorators.authenticated
    def post(self, filepath):
        """
        Write the given contents to the specified file. This is not
        an append, all file contents will be replaced by the contents
        given.
        """
        if not self.fs.exists(filepath):
            raise tornado.web.HTTPError(404)

        try:
            content = tornado.escape.json_decode(self.request.body)['content']
        except:
            raise tornado.web.HTTPError(400)

        self.fs.write_file(filepath, content)
        self.write({'msg': 'Updated file at {}'.format(filepath)})
