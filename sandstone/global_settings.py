import os
import sys

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
# sys.path.insert(0,PROJECT_DIR)

# DB configuration
DATABASE = os.path.join('$HOME','.sandstone','sandstone.db')

# If USE_SSL is set to True, then both the SSL_CERT and SSL_KEY
# options need to be configured.
USE_SSL = False
# SSL_CERT = '/path/to/.pem'
# SSL_KEY = '/path/to/.pem'

# URL prefix (with no trailing slash) to be used by
# this instance of Sandstone. Example: "/sandstone/user"
URL_PREFIX = ''

# Handler used to authenticate a session. The default
# is sandstone.lib.handlers.pam_auth.PAMLoginHandler
LOGIN_HANDLER = 'sandstone.lib.handlers.pam_auth.PAMLoginHandler'

DEBUG = True

COOKIE_SECRET = 'YouShouldProbablyChangeThisValueForYourProject'

# App-Wide settings
INSTALLED_APPS = (
    'sandstone.lib',
    'sandstone.apps.codeeditor',
    'sandstone.apps.filebrowser',
    'sandstone.apps.webterminal'
)

VOLUMES = (
    os.path.join('$HOME', ''),
    '/tmp/',
)
