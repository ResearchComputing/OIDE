from tornado.web import URLSpec as url
from sandstone.lib.filesystem.handlers import FilesystemHandler
from sandstone.lib.filesystem.handlers import FilewatcherCreateHandler
from sandstone.lib.filesystem.handlers import FilewatcherDeleteHandler
from sandstone.lib.filesystem.handlers import FileHandler
from sandstone.lib.filesystem.handlers import FileCreateHandler
from sandstone.lib.filesystem.handlers import FileContentsHandler
from sandstone.lib.filesystem.handlers import DirectoryHandler
from sandstone.lib.filesystem.handlers import DirectoryCreateHandler
from sandstone.lib.filesystem.handlers import DownloadFileHandler



URL_SCHEMA = [
            url(r"/a/filesystem/", FilesystemHandler ,name='filesystem:filesystem'),
            url(r"/a/filesystem/watchers/", FilewatcherCreateHandler ,name='filesystem:watchers-add'),
            url(r"/a/filesystem/watchers/(.*)/", FilewatcherDeleteHandler ,name='filesystem:watchers-delete'),
            url(r"/a/filesystem/directories/", DirectoryCreateHandler ,name='filesystem:directories'),
            url(r"/a/filesystem/directories/(.*)/", DirectoryHandler ,name='filesystem:directories-details'),
            url(r"/a/filesystem/files/", FileCreateHandler ,name='filesystem:files'),
            url(r"/a/filesystem/files/([^\/]*)/", FileHandler ,name='filesystem:files-details'),
            url(r"/a/filesystem/files/([^\/]*)/contents/", FileContentsHandler ,name='filesystem:files-contents'),
            url(r"/a/filesystem/files/([^\/]*)/download/", DownloadFileHandler ,name='filesystem:file-download'),
        ]
