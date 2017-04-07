APP_SPECIFICATION = {
    'APP_DESCRIPTION': {
        'name': 'Terminal',
        'link': '/#/terminal',
        'description': 'An easy-to-use web-based SSH terminal.'
    },
    'NG_MODULE_NAME': 'terminal',
    'NG_MODULE_STYLESHEETS': (
        'terminal.css',
    ),
    'NG_MODULE_SCRIPTS': (
        'terminal.js',
    ),
}

# The command list that will be executed when a web terminal starts
WEB_TERMINAL_SHELL_CMD = ['bash']
# Environment variables added to web terminal sessions
WEB_TERMINAL_EXTRA_ENV = {
    'TEST_VAR': 'hi!'
}
