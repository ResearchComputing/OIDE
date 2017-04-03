import unittest
import mock
import os

from tornado.web import StaticFileHandler
import sandstone
from sandstone.app import SandstoneApplication
from sandstone.lib import ui_methods
from sandstone.lib.handlers.main import MainHandler
from sandstone.lib.handlers.pam_auth import PAMLoginHandler
from sandstone import settings as default_settings



TEST_PREFIX = '/test/prefix'
INSTALLED_APPS = (
    'sandstone.lib',
    'sandstone.apps.codeeditor',
    'sandstone.apps.filebrowser',
)
APP_SPECS = []
for mod_name in ['sandstone.apps.codeeditor.settings','sandstone.apps.filebrowser.settings']:
    mod = __import__(mod_name,fromlist=[''])
    APP_SPECS.append(mod.APP_SPECIFICATION)

class MainAppTestCase(unittest.TestCase):
    @mock.patch('sandstone.settings.URL_PREFIX','')
    @mock.patch('sandstone.settings.INSTALLED_APPS',INSTALLED_APPS)
    @mock.patch('sandstone.settings.APP_SPECIFICATIONS',APP_SPECS)
    def test_app_settings(self):
        app = SandstoneApplication()

        self.assertEqual(type(app.settings),type({}))

        expd = dict(
            project_dir=sandstone.__path__[0],
            static_dir=os.path.join(sandstone.__path__[0],'client/sandstone'),
            login_url='/auth/login',
            cookie_secret = default_settings.COOKIE_SECRET,
            xsrf_cookies=True,
            ui_methods=ui_methods,
        )
        self.assertDictContainsSubset(expd,app.settings)

    @mock.patch('sandstone.settings.URL_PREFIX',TEST_PREFIX)
    @mock.patch('sandstone.settings.INSTALLED_APPS',INSTALLED_APPS)
    @mock.patch('sandstone.settings.APP_SPECIFICATIONS',APP_SPECS)
    def test_app_settings_prefixed(self):
        app = SandstoneApplication()

        self.assertEqual(type(app.settings),type({}))

        expd = dict(
            login_url='{}/auth/login'.format(TEST_PREFIX),
        )
        self.assertDictContainsSubset(expd,app.settings)

    @mock.patch('sandstone.settings.URL_PREFIX','')
    @mock.patch('sandstone.settings.INSTALLED_APPS',INSTALLED_APPS)
    @mock.patch('sandstone.settings.APP_SPECIFICATIONS',APP_SPECS)
    def test_app_handlers(self):
        app = SandstoneApplication()
        handlers = app.handlers[0][1]
        hpaths = [h._path for h in handlers]

        self.assertEqual(handlers[0]._path,'/static/core/%s')
        self.assertTrue(issubclass(handlers[0].handler_class,StaticFileHandler))

        self.assertTrue('/' in hpaths)
        i = hpaths.index('/')
        self.assertTrue(issubclass(handlers[i].handler_class,MainHandler))
        self.assertTrue('/auth/login' in hpaths)
        i = hpaths.index('/auth/login')
        self.assertTrue(issubclass(handlers[i].handler_class,PAMLoginHandler))
        self.assertTrue('/auth/logout' in hpaths)
        self.assertTrue('/a/deps' in hpaths)
        self.assertTrue('/static/editor/%s' in hpaths)
        self.assertTrue('/static/filebrowser/%s' in hpaths)
        self.assertTrue('/a/filesystem/' in hpaths)
        self.assertTrue('/a/filesystem/directories/%s/' in hpaths)
        self.assertTrue('/a/filesystem/files/%s/' in hpaths)
        self.assertTrue('/a/filesystem/files/%s/contents/' in hpaths)

    @mock.patch('sandstone.settings.URL_PREFIX',TEST_PREFIX)
    @mock.patch('sandstone.settings.INSTALLED_APPS',INSTALLED_APPS)
    @mock.patch('sandstone.settings.APP_SPECIFICATIONS',APP_SPECS)
    def test_app_handlers_prefixed(self):
        app = SandstoneApplication()
        handlers = app.handlers[0][1]
        hpaths = [h._path for h in handlers]

        self.assertEqual(handlers[0]._path,'{}/static/core/%s'.format(TEST_PREFIX))
        self.assertTrue(issubclass(handlers[0].handler_class,StaticFileHandler))

        self.assertTrue('{}/'.format(TEST_PREFIX) in hpaths)
        i = hpaths.index('{}/'.format(TEST_PREFIX))
        self.assertTrue(issubclass(handlers[i].handler_class,MainHandler))
        self.assertTrue('{}/auth/login'.format(TEST_PREFIX) in hpaths)
        i = hpaths.index('{}/auth/login'.format(TEST_PREFIX))
        self.assertTrue(issubclass(handlers[i].handler_class,PAMLoginHandler))
        self.assertTrue('{}/auth/logout'.format(TEST_PREFIX) in hpaths)
        self.assertTrue('{}/a/deps'.format(TEST_PREFIX) in hpaths)
        self.assertTrue('{}/static/editor/%s'.format(TEST_PREFIX) in hpaths)
        self.assertTrue('{}/static/filebrowser/%s'.format(TEST_PREFIX) in hpaths)
        self.assertTrue('{}/a/filesystem/'.format(TEST_PREFIX) in hpaths)
        self.assertTrue('{}/a/filesystem/directories/%s/'.format(TEST_PREFIX) in hpaths)
        self.assertTrue('{}/a/filesystem/files/%s/'.format(TEST_PREFIX) in hpaths)
        self.assertTrue('{}/a/filesystem/files/%s/contents/'.format(TEST_PREFIX) in hpaths)
