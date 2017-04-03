import unittest
import mock

from sandstone.lib import ui_methods
from sandstone import settings



APP_SPECS = settings.APP_SPECIFICATIONS
TEST_PREFIX = '/test/prefix'

class GetAppDescriptionTestCase(unittest.TestCase):
    @mock.patch('sandstone.settings.APP_SPECIFICATIONS',APP_SPECS)
    def test_get_default_desc(self):
        desc = ui_methods.get_app_descriptions()
        self.assertEqual(len(desc),len(APP_SPECS))
        self.assertEqual(type(desc),type([]))
        d = desc[0]
        self.assertEqual(type(d),type({}))
        self.assertIn('link',d)
        self.assertIn('name',d)
        self.assertIn('description',d)
        self.assertTrue(d['link'].startswith('/#/'))

    @mock.patch('sandstone.settings.APP_SPECIFICATIONS',[])
    def test_get_empty_desc(self):
        desc = ui_methods.get_app_descriptions()
        self.assertEqual(len(desc),0)
        self.assertEqual(type(desc),type([]))

class GetNgModuleSpecTestCase(unittest.TestCase):
    @mock.patch('sandstone.settings.APP_SPECIFICATIONS',APP_SPECS)
    def test_get_default_ng_specs(self):
        specs = ui_methods.get_ng_module_spec()
        self.assertEqual(len(specs),len(APP_SPECS))
        self.assertEqual(type(specs),type([]))
        d = specs[0]
        self.assertEqual(type(d),type({}))
        self.assertIn('module_name',d)
        self.assertIn('stylesheets',d)
        self.assertIn('scripts',d)

    @mock.patch('sandstone.settings.APP_SPECIFICATIONS',[])
    def test_get_empty_ng_specs(self):
        specs = ui_methods.get_ng_module_spec()
        self.assertEqual(len(specs),0)
        self.assertEqual(type(specs),type([]))

class GetUrlPrefixTestCase(unittest.TestCase):
    @mock.patch('sandstone.settings.URL_PREFIX','')
    def test_get_prefix_default(self):
        prefix = ui_methods.get_url_prefix()
        self.assertEqual(prefix,'')

    @mock.patch('sandstone.settings.URL_PREFIX',TEST_PREFIX)
    def test_get_prefix_set(self):
        prefix = ui_methods.get_url_prefix()
        self.assertEqual(prefix,TEST_PREFIX)
