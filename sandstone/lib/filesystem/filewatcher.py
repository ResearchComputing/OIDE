from watchdog.observers import Observer
from sandstone.lib.broadcast.manager import BroadcastManager
from sandstone.lib.broadcast.message import BroadcastMessage
import os
import watchdog

class FilesystemEventHandler(watchdog.events.FileSystemEventHandler):
    """
    Subclass of `watchdog.events.FilesystemEventHandler`
    Manages on_created, on_deleted, on_moved events
    """
    def on_created(self, event):
        """
        Event Handler when a file is created
        """
        key = 'filesystem:file_created'

        data = {
            'filepath': event.src_path,
            'is_directory': event.is_directory,
            'dirpath': os.path.dirname(event.src_path)
        }

        bmsg = BroadcastMessage(key=key, data=data)
        BroadcastManager.broadcast(bmsg)

    def on_deleted(self, event):
        """
        Event Handler when a file is deleted
        """
        key = 'filesystem:file_deleted'
        data = {
            'filepath': event.src_path,
            'is_directory': event.is_directory,
            'dirpath': os.path.dirname(event.src_path)
        }

        bmsg = BroadcastMessage(key=key, data=data)
        BroadcastManager.broadcast(bmsg)

    def on_moved(self, event):
        """
        Event Handler when a file is moved
        """
        key = 'filesystem:file_moved'
        data = {
            'src_filepath': event.src_path,
            'dest_filepath': event.dest_path,
            'is_directory': event.is_directory,
            'src_dirpath': os.path.dirname(event.src_path),
            'dest_dirpath': os.path.dirname(event.dest_path)
        }

        bmsg = BroadcastMessage(key=key, data=data)
        BroadcastManager.broadcast(bmsg)

    def on_modified(self, event):
        """
        Event handler when a file is modified.
        """
        key = 'filesystem:file_modified'
        data = {
            'filepath': event.src_path,
            'is_directory': event.is_directory,
            'dirpath': os.path.dirname(event.src_path)
        }

        bmsg = BroadcastMessage(key=key, data=data)
        BroadcastManager.broadcast(bmsg)


class Filewatcher(object):
    """
    Starts a watchdog instance to watch over the filesystem
    Handles events - CREATE, REMOVE,MOVE
    """
    _watches = {}
    _observer = Observer()
    _event_handler = FilesystemEventHandler()
    _observer.start()

    @classmethod
    def add_directory_to_watch(cls, directory):
        if directory not in cls._watches:
            # Add the watcher
            watch = cls._observer.schedule(cls._event_handler, directory, recursive=False)
            count = 1
            # add client count and observer to list of observers
            cls._watches[directory] = (count,watch)
        else:
            count, watch = cls._watches[directory]
            count += 1
            cls._watches[directory] = (count,watch)

    @classmethod
    def remove_directory_to_watch(cls, directory):
        if directory in cls._watches:
            # get the watch from the _watches dict and remove it
            count, watch = cls._watches[directory]
            count -= 1
            if count < 1:
                cls._observer.unschedule(watch)
                del cls._watches[directory]
            else:
                cls._watches[directory] = (count,watch)
