import os
import signals

APP_SPECIFICATION = {
    'APP_DESCRIPTION': {
        'name': 'Filebrowser',
        'link': '/#/filebrowser',
        'description': 'A file browser',
    },
    'NG_MODULE_NAME': 'filebrowser',
    'NG_MODULE_STYLESHEETS': (
        'filebrowser.css',
    ),
    'NG_MODULE_SCRIPTS': (
        'filebrowser.js',
        'file.service.js',
        'filetree.controller.js',
        'filebrowser.controller.js',
    ),
}

FILESYSTEM_ROOT_DIRECTORIES = (
    os.path.join('$HOME', ''),
    '/tmp/',
    )
