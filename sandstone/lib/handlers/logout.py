from sandstone.lib.handlers.base import BaseHandler
from sandstone import settings



class LogoutHandler(BaseHandler):

    def get(self):
        self.clear_cookie('user')
        self.clear_cookie('_xsrf')
        self.redirect(self.get_argument('next', settings.URL_PREFIX + '/auth/login'))
