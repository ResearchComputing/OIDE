from sandstone.lib.filesystem.handlers import FilesystemHandler
from sandstone.lib.filesystem.handlers import FileHandler
from sandstone.lib.filesystem.handlers import FileContentsHandler
from sandstone.lib.filesystem.handlers import DirectoryHandler



URL_SCHEMA = [
            (r"/a/filesystem/", FilesystemHandler),
            (r"/a/filesystem/directories/(.*)/", DirectoryHandler),
            (r"/a/filesystem/files/(.*)/", FileHandler),
            (r"/a/filesystem/files/(.*)/contents/", FileContentsHandler),
        ]
