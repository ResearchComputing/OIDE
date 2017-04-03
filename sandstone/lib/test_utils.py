import mock
from tornado.testing import AsyncHTTPTestCase
from tornado.testing import LogTrapTestCase
from sandstone.app import SandstoneApplication



class TestHandlerBase(AsyncHTTPTestCase, LogTrapTestCase):

    @mock.patch('sandstone.settings.URL_PREFIX','')
    def get_app(self):
        app = SandstoneApplication(debug=False)
        app.settings['xsrf_cookies'] = False
        return app
