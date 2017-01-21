import json
import copy
import tornado.web
from sandstone.lib.handlers.base import BaseHandler



class JSONHandler(BaseHandler):
    """
    This handler adds support for parsing JSON-encoded body
    arguments for use in REST endpoints. This handler will
    raise an HTTP 400 if the body is not empty, and cannot
    be parsed as JSON.
    """
    _ARG_DEFAULT = object()

    def initialize(self,*args,**kwargs):
        """
        Only try to parse as JSON if the JSON content type
        header is set.
        """
        super(JSONHandler,self).initialize(*args,**kwargs)
        content_type = self.request.headers.get('Content-Type', '')
        if 'application/json' in content_type.lower():
            self._parse_json_body_arguments()

    def _parse_json_body_arguments(self):
        if self.request.body == '':
            return
        try:
            body_args = json.loads(self.request.body)
            for k,v in body_args.iteritems():
                self.request.body_arguments[k] = v
        except:
            raise tornado.web.HTTPError(400)

    def get_body_argument(self,name,default=_ARG_DEFAULT,strip=True):
        arg = self.request.body_arguments.get(name,default)
        if not arg:
            if default is self._ARG_DEFAULT:
                raise self.MissingArgumentError(name)
            return default
        return arg

    def get_body_arguments(self,name,strip=True):
        args = copy.deepcopy(self.request.body_arguments)
        return args
