class BroadcastManager(object):
    """
    Manages a set of Websocket clients. Adds/Removes clients, and broadcasts messages
    """
    _clients = set()

    @classmethod
    def add_client(cls, client):
        cls._clients.add(client)

    @classmethod
    def broadcast(cls, message):
        for client in cls._clients:
            try:
                client.write_message(message)
            except:
                # TODO handle custom exception
                pass

    @classmethod
    def remove_client(cls, client):
        if client:
            cls._clients.remove(client)
