import logging
import os
from oide import settings
import oide.lib.decorators
from oide.lib.handlers.base import BaseHandler



def get_installed_app_static_specs():
    spec_list = []
    for app_name in settings.INSTALLED_APPS:
        try:
            app_settings = __import__(app_name+'.settings',fromlist=[''])
            static_dir = os.path.join(app_settings.APP_DIRECTORY,'static')
            spec_list.append(
                (
                    app_settings.APP_SPECIFICATION['NG_MODULE_NAME'],
                    static_dir,
                )
            )
        except ImportError:
            logging.debug('No settings specified for app: %s'%app_name)
        except AttributeError:
            logging.debug('No app spec or directory specified for app: %s'%app_name)
    return spec_list

def get_installed_app_urls():
    schema_list = []
    for app_name in settings.INSTALLED_APPS:
        try:
            app_urls = __import__(app_name+'.urls',fromlist=[''])
            schema_list += app_urls.URL_SCHEMA
        except ImportError:
            logging.debug('No urls specified for app: %s'%app_name)
        except AttributeError:
            logging.debug('No url schema for app: %s'%app_name)
    return schema_list


class DependencyHandler(BaseHandler):

    @oide.lib.decorators.authenticated
    def get(self):
        dep_list = []
        for app_spec in settings.APP_SPECIFICATIONS:
            dep_list.append(app_spec['NG_MODULE_NAME'])

        resp = {
            'dependencies': dep_list
        }
        self.write(resp)
