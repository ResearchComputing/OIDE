import tornado.escape



class BroadcastMessage:
    """
    Wraps up broadcasted messages. BroadcastMessage handles validation, as well as
    serialization and deserialization.
    """
    class MessageValidationError(Exception):
        pass

    @classmethod
    def create_from_string(cls,json_str):
        msg_d = tornado.escape.json_decode(json_str)
        return cls(
            key=msg_d['key'],
            data=msg_d['data'])

    @classmethod
    def create_from_dict(cls, dict_obj):
        return cls(
            key=dict_obj['key'],
            data=dict_obj['data']
        )

    def __init__(self,**kwargs):
        msg_key = kwargs.get('key', None)
        msg_data = kwargs.get('data', None)

        if not msg_key and msg_data:
            raise self.MessageValidationError(
                "'key' and 'data' must both be defined."
            )

        if not (isinstance(msg_key,str) or isinstance(msg_key,unicode)):
            raise self.MessageValidationError(
                "'key' must be of type Str or Unicode, saw {} instead.".format(type(msg_key))
            )

        if not isinstance(msg_data,dict):
            raise self.MessageValidationError(
                "'data' must be of type Dict, saw {} instead.".format(type(msg_data))
            )

        self.key = msg_key
        self.data = msg_data

    def to_json_string(self):
        msg_d = {
            'key': self.key,
            'data': self.data
        }
        return tornado.escape.json_encode(msg_d)
