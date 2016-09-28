import os
import sys
import logging
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.httpserver

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
        app_static_handlers = []
        for spec in get_installed_app_static_specs():
            s_url = r"/static/{}/(.*)".format(spec[0])
            app_static_handlers.append(
                (s_url, tornado.web.StaticFileHandler, {'path': spec[1]})
            )

        handlers = [
                (r"/static/core/(.*)", tornado.web.StaticFileHandler, {'path': STATIC_DIR}),
            ] + app_static_handlers + URL_SCHEMA

        app_settings = dict(
            project_dir=PROJECT_DIR,
            static_dir=STATIC_DIR,
            login_url=settings.LOGIN_URL,
            cookie_secret = settings.COOKIE_SECRET,
            debug = settings.DEBUG,
            xsrf_cookies=True,
            ui_methods=ui_methods,
            )

        tornado.web.Application.__init__(self, handlers, **app_settings)


def main():
    application = SandstoneApplication()
    if settings.USE_SSL:
        ssl_server = tornado.httpserver.HTTPServer(application, ssl_options={
            "certfile": settings.SSL_CERT,
            "keyfile": settings.SSL_KEY,
        })
        ssl_server.listen(int(os.environ.get('SANDSTONE_PORT', 8888)))
    else:
        application.listen(int(os.environ.get('SANDSTONE_PORT', 8888)))
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
