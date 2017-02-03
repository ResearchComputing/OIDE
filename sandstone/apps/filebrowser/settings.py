import os

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
        'filebrowser.service.js',
        'volumes.controller.js',
        'details.controller.js',
        'createmodal.controller.js',
        'movemodal.controller.js',
        'deletemodal.controller.js',
        'uploadmodal.controller.js',
        'fb-filedetails/fb-filedetails.directive.js',
        'syncfocuswith/syncfocuswith.directive.js',
    ),
}
