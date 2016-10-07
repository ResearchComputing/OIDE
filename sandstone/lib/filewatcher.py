from watchdog.observers import Observer
from sandstone.lib.broadcast.manager import BroadcastManager
from sandstone.lib.broadcast.message import BroadcastMessage
import watchdog
import os

class FilesystemEventHandler(watchdog.events.FileSystemEventHandler):
    """
    Subclass of `watchdog.events.FilesystemEventHandler`
    Manages on_created, on_deleted, on_moved events
    """
    def on_created(self, event):
        """
        Event Handler when a file is created
        """
        key = 'filetree:created_file'
        if os.path.isdir(event.src_path):
            file_type = 'dir'
        else:
            file_type = 'file'
        data = {
            'filepath': event.src_path,
            'type': file_type
        }
        bmsg = BroadcastMessage(key=key, data=data)
        BroadcastManager.broadcast(bmsg)

    def on_deleted(self, event):
        """
        Event Handler when a file is deleted
        """
        key = 'filetree:deleted_file'
        if os.path.isdir(event.src_path):
            file_type = 'dir'
        else:
            file_type = 'file'
        data = {
            'filepath': event.src_path,
            'type': file_type
        }
        bmsg = BroadcastMessage(key=key, data=data)
        BroadcastManager.broadcast(bmsg)

    def on_moved(self, event):
        """
        Event Handler when a file is moved
        """
        key = 'filetree:moved_file'
        if os.path.isdir(event.src_path):
            file_type = 'dir'
        else:
            file_type = 'file'        
        data = {
            'src_filepath': event.src_path,
            'dest_filepath': event.dest_path,
            'type': file_type
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
            # add observer to list of observers
            cls._watches[directory] = watch

    @classmethod
    def remove_directory_to_watch(cls, directory):
        if directory in cls._watches:
            # get the watch from the _watches dict and remove it
            watch = cls._watches.pop(directory, None)
            if watch:
                # unschedule the watch
                cls._observer.unschedule(watch)
