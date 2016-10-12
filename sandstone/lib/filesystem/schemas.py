import copy
import cerberus
import tornado.escape



def extend_schema(addenda):
    base_schema = copy.deepcopy(BaseObject.schema)
    base_schema.update(addenda)
    return base_schema

class BaseObject:
    """
    Base object subclassed by all filesystem volume and object representations.
    Uses cerberus for data validation. Provides serializaiton and deserialization
    methods.
    """

    class ValidationError(Exception):
        pass

    schema = {
        'type': {
            'type': 'string',
            'allowed': ['volume','file','directory']
        },
        'name': {
            'type': 'string'
        },
        'size': {
            'type': 'string',
            'regex': '^([\d]+(.[\d]+)?[bKMGT])$'
        },
    }

    def __init__(self, *args, **kwargs):
        self.validator = cerberus.Validator(self.schema,allow_unknown=True)
        # Validate kwargs, then assign as members of instance
        if not self.validator.validate(kwargs):
            print kwargs
            raise self.ValidationError('Arguments do not match schema.')
        for k in kwargs.keys():
            setattr(self, k, kwargs.pop(k))

    def to_dict(self):
        d = vars(self)
        del d['validator']
        return d

    def to_json_string(self):
        d = vars(self)
        del d['validator']
        return tornado.escape.json_encode(d)

class VolumeObject(BaseObject):
    """
    This object standardizes the representation of filesystem volumes handled by
    the filesystem REST API.
    """

    schema = extend_schema({
        'type': {
            'type': 'string',
            'allowed': ['volume']
        },
        'available_groups': {
            'type': 'list'
        },
        'fs_type': {
            'type': 'string'
        },
        'used': {
            'type': 'string',
            'regex': '^([\d]+(.[\d]+)?[bKMGT])$'
        },
        'available': {
            'type': 'string',
            'regex': '^([\d]+(.[\d]+)?[bKMGT])$'
        },
        'used_pct': {
            'type': 'number',
            'min': 0,
            'max': 100
        }
    })

class FilesystemObject(BaseObject):
    """
    This object standardizes the representation of filesystem objects handled by
    the filesystem REST API.
    """

    schema = extend_schema({
        'type': {
            'type': 'string',
            'allowed': ['file','directory']
        },
        'dirpath': {
            'type': 'string'
        },
        'filepath': {
            'type': 'string'
        },
        'volume': {
            'type': 'string'
        },
        'owner': {
            'type': 'string'
        },
        'group': {
            'type': 'string'
        },
        'permissions': {
            'type': 'string',
            'regex': '^([r-][w-][x-]){3}$'
        }
    })

    def to_dict(self):
        if (self.type == 'directory') and hasattr(self, 'contents'):
            cnts = []
            for f in self.contents:
                cnts.append(f.to_dict())
            d = vars(self)
            del d['validator']
            d['contents'] = cnts
            return d
        d = vars(self)
        del d['validator']
        return d

    def to_json_string(self):
        d = self.to_dict()
        return tornado.escape.json_encode(d)
