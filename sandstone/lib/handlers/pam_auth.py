import logging
import simplepam
from sandstone.lib.handlers.base import BaseHandler
from sandstone import settings



class PAMLoginHandler(BaseHandler):

    def get(self):
        self.render('lib/templates/login.html')

    def post(self):
        un = self.get_argument('username')
        pw = str(self.get_argument('password'))

        if simplepam.authenticate(un, str(pw), service='login'):
            self.set_secure_cookie('user', un)
            self.redirect(settings.URL_PREFIX+"/")
        else:
            failed_attempts=self.get_secure_cookie("failedattempts")
            if failed_attempts==False or failed_attempts == None:
                failed_attempts=0
            self.set_secure_cookie("failedattempts", str(int(failed_attempts)+1))
            self.set_status(403)
            self.render(
                'lib/templates/login.html',
                error='Username or Password incorrect!'
                )
