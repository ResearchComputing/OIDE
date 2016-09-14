from watchdog.observers import Observer
import watchdog

class FilesystemEventHandler(watchdog.events.FileSystemEventHandler):
    def on_created(self, event):
        """
        Event Handler when a file is created
        """
        print 'File created in %s' % (event.src_path)

    def on_deleted(self, event):
        """
        Event Handler when a file is deleted
        """
        print 'File deleted in %s' % (event.src_path)

    def on_moved(self, event):
        """
        Event Handler when a file is moved
        """
        print 'File moved from %s to %s' % (event.src_path, event.dest_path)

class Filewatcher(object):
    """
    Starts a watchdog instance to watch over the filesystem
    Handles events - CREATE, REMOVE,MOVE
    """
    _watches = {}
    _observer = Observer()
    _event_handler = FilesystemEventHandler()

    def __init__(self):
        print 'Watchdog instance started'
        self._observer.start()

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
            cls._watched_directories.remove(directory)
