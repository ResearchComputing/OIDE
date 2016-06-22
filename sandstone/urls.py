from sandstone.lib.handlers.pam_auth import PAMLoginHandler
from sandstone.lib.handlers.logout import LogoutHandler
from sandstone.lib.handlers.main import MainHandler
from sandstone.lib.handlers.state import StateHandler
from sandstone.lib.app_loader import DependencyHandler

from sandstone.lib.app_loader import get_installed_app_urls



APP_SCHEMA = get_installed_app_urls()
URL_SCHEMA = [
            (r"/auth/login", PAMLoginHandler),
            (r"/auth/logout", LogoutHandler),
            (r"/", MainHandler),
            (r"/a/deps", DependencyHandler),
            (r"/a/state", StateHandler),
        ] + APP_SCHEMA
