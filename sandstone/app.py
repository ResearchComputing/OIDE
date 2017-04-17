import os
import sys
import re
import logging
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.httpserver
from tornado.web import URLSpec as url

from datetime import date

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(PROJECT_DIR,'client/sandstone')

from sandstone import settings
from sandstone.lib import ui_methods
from sandstone.lib.app_loader import get_installed_app_static_specs
import sandstone.urls
from sandstone.urls import URL_SCHEMA




class SandstoneApplication(tornado.web.Application):
    def __init__(self, *args, **kwargs):
        url_prefix = settings.URL_PREFIX
        app_static_handlers = []
        for spec in get_installed_app_static_specs():
            s_url = r"/static/{}/(.*)".format(spec[0])
            app_static_handlers.append(
                (s_url, tornado.web.StaticFileHandler, {'path': spec[1]})
            )

        # Build the URLSpecs for the configured auth handlers
        self._login_url = '/auth/login'
        auth_urls = self._build_auth_urlspecs()

        handlers = [
                (r"/static/core/(.*)", tornado.web.StaticFileHandler, {'path': STATIC_DIR}),
            ] + auth_urls + app_static_handlers + URL_SCHEMA

        app_settings = dict(
            project_dir=PROJECT_DIR,
            static_dir=STATIC_DIR,
            login_url=url_prefix+self._login_url,
            cookie_secret = settings.COOKIE_SECRET,
            xsrf_cookies=True,
            ui_methods=ui_methods,
            )

        tornado.web.Application.__init__(self, handlers, **app_settings)

        # Apply url prefix to handlers
        self._apply_prefix()

    def _apply_prefix(self):
        prefix = settings.URL_PREFIX
        for handler in self.handlers[0][1]:
            handler.regex = re.compile(handler.regex.pattern.replace('/', '{}/'.format(prefix), 1))
            # This is necessary for url reversals to work properly
            handler._path = prefix + handler._path

    def _get_handler_for_module(self, module_path):
        module_cmps = module_path.split('.')
        mod_path = '.'.join(module_cmps[:-1])
        handler_class = module_cmps[-1]
        handler_class = module_cmps[-1]

        mod = __import__(mod_path, fromlist=[handler_class])
        handler = getattr(mod, handler_class)
        return handler

    def _build_auth_urlspecs(self):
        prefix = settings.URL_PREFIX

        login_handler_mod = settings.LOGIN_HANDLER
        logout_handler_mod = settings.LOGOUT_HANDLER
        login_handler = self._get_handler_for_module(login_handler_mod)
        logout_handler = self._get_handler_for_module(logout_handler_mod)

        url_specs = []
        login_urlspec = url(self._login_url,login_handler)
        url_specs.append(login_urlspec)
        logout_urlspec = url('/auth/logout',logout_handler)
        url_specs.append(logout_urlspec)
        return url_specs


def main(**kwargs):
    port = kwargs.get('port', '8888')
    prefix = kwargs.get('prefix', None)

    if prefix: settings.URL_PREFIX = prefix

    application = SandstoneApplication(debug=settings.DEBUG)
    if settings.USE_SSL:
        ssl_server = tornado.httpserver.HTTPServer(application, ssl_options={
            "certfile": settings.SSL_CERT,
            "keyfile": settings.SSL_KEY,
        })
        ssl_server.listen(int(port))
    else:
        application.listen(int(port))
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
