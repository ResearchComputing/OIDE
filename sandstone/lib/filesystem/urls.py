from tornado.web import URLSpec as url
from sandstone.lib.filesystem.handlers import FilesystemHandler
from sandstone.lib.filesystem.handlers import FilewatcherHandler
from sandstone.lib.filesystem.handlers import FileHandler
from sandstone.lib.filesystem.handlers import FileCreateHandler
from sandstone.lib.filesystem.handlers import FileContentsHandler
from sandstone.lib.filesystem.handlers import DirectoryHandler
from sandstone.lib.filesystem.handlers import DirectoryCreateHandler



URL_SCHEMA = [
            url(r"/a/filesystem/", FilesystemHandler ,name='filesystem:filesystem'),
            url(r"/a/filesystem/watchers/(.*)?/?", FilewatcherHandler ,name='filesystem:watchers'),
            url(r"/a/filesystem/directories/", DirectoryCreateHandler ,name='filesystem:directories'),
            url(r"/a/filesystem/directories/(.*)/", DirectoryHandler ,name='filesystem:directories-details'),
            url(r"/a/filesystem/files/", FileCreateHandler ,name='filesystem:files'),
            url(r"/a/filesystem/files/([^\/]*)/", FileHandler ,name='filesystem:files-details'),
            url(r"/a/filesystem/files/([^\/]*)/contents/", FileContentsHandler ,name='filesystem:files-contents'),
        ]
