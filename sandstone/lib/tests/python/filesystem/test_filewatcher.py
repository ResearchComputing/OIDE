import unittest
import mock
from sandstone.lib.filesystem.filewatcher import Filewatcher
import tempfile
import os
import shutil
import time
import copy


class FilewatcherTestCase(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()

    def tearDown(self):
        # remove all watches
        dirs = copy.deepcopy(Filewatcher._watches)
        for key, value in dirs.items():
            Filewatcher.remove_directory_to_watch(key)
        # remove temp directory
        shutil.rmtree(self.test_dir)


    def test_add_directory_to_watch(self):
        self.assertEqual(len(Filewatcher._watches), 0)
        Filewatcher.add_directory_to_watch(self.test_dir)
        self.assertEqual(len(Filewatcher._watches), 1)

        # create 2 new temporary directories
        temp_dir_1 = tempfile.mkdtemp()
        temp_dir_2 = tempfile.mkdtemp()
        # watch over the directories
        Filewatcher.add_directory_to_watch(temp_dir_1)
        Filewatcher.add_directory_to_watch(temp_dir_2)
        self.assertEqual(len(Filewatcher._watches), 3)
        # Check for handling of redundant watches
        Filewatcher.add_directory_to_watch(temp_dir_2)
        self.assertEqual(len(Filewatcher._watches), 3)
        self.assertEqual(Filewatcher._watches[temp_dir_2][0],2)

    def test_remove_directory_to_watch(self):
        Filewatcher.add_directory_to_watch(self.test_dir)
        Filewatcher.add_directory_to_watch(self.test_dir)
        Filewatcher.remove_directory_to_watch(self.test_dir)
        self.assertEqual(len(Filewatcher._watches), 1)
        Filewatcher.remove_directory_to_watch(self.test_dir)
        self.assertEqual(len(Filewatcher._watches), 0)

    @mock.patch('sandstone.lib.broadcast.manager.BroadcastManager.broadcast')
    def test_file_created_event(self, mock_broadcast):
        Filewatcher.add_directory_to_watch(self.test_dir)
        # create temp file
        filepath = os.path.join(self.test_dir, 'tmp.txt')
        fd = open(filepath, 'w')
        fd.close()
        # introduce a small delay for Filewatcher events to trigger
        time.sleep(1)

        key = 'filesystem:file_created'
        data = {
            'filepath': filepath,
            'is_directory': False,
            'dirpath': os.path.dirname(filepath)
        }
        self.assertEqual(mock_broadcast.call_count,2)
        broadcast_created = mock_broadcast.call_args_list[1]
        broadcast_created.assert_called_with(key=key,data=data)

    @mock.patch('sandstone.lib.broadcast.manager.BroadcastManager.broadcast')
    def test_file_deleted_event(self, mock_broadcast):
        # create temp file
        filepath = os.path.join(self.test_dir, 'tmp.txt')
        fd = open(filepath, 'w')
        fd.close()
        Filewatcher.add_directory_to_watch(self.test_dir)
        # delete the file
        os.remove(filepath)
        # introduce a small delay for Filewatcher events to trigger
        time.sleep(1)

        key = 'filesystem:file_deleted'
        data = {
            'filepath': filepath,
            'is_directory': False,
            'dirpath': os.path.dirname(filepath)
        }
        self.assertEqual(mock_broadcast.call_count,2)
        broadcast_deleted = mock_broadcast.call_args_list[1]
        broadcast_deleted.assert_called_with(key=key,data=data)

    @mock.patch('sandstone.lib.broadcast.manager.BroadcastManager.broadcast')
    def test_file_moved_event(self, mock_broadcast):
        # create a temporary file
        filepath = os.path.join(self.test_dir, 'tmp.txt')
        fd = open(filepath, 'w')
        fd.close()
        # watch the directory
        Filewatcher.add_directory_to_watch(self.test_dir)
        newpath = os.path.join(self.test_dir, 'new_temp.txt');
        # move the file
        shutil.move(filepath, newpath)
        time.sleep(1)

        key = 'filesystem:file_moved'
        data = {
            'src_filepath': filepath,
            'dest_filepath': newpath,
            'is_directory': False,
            'src_dirpath': os.path.dirname(filepath),
            'dest_dirpath': os.path.dirname(newpath)
        }
        self.assertEqual(mock_broadcast.call_count,2)
        broadcast_moved = mock_broadcast.call_args_list[1]
        broadcast_moved.assert_called_with(key=key,data=data)

    @mock.patch('sandstone.lib.broadcast.manager.BroadcastManager.broadcast')
    def test_file_modified_event(self, mock_broadcast):
        # create temp file
        filepath = os.path.join(self.test_dir, 'tmp.txt')
        fd = open(filepath, 'w')
        fd.close()
        Filewatcher.add_directory_to_watch(self.test_dir)
        # modify the file
        with open(filepath, 'w') as fd:
            fd.write('test')
        # introduce a small delay for Filewatcher events to trigger
        time.sleep(1)

        key = 'filesystem:file_modified'
        data = {
            'filepath': filepath,
            'is_directory': False,
            'dirpath': self.test_dir
        }
        self.assertEqual(mock_broadcast.call_count,1)
        broadcast_modified = mock_broadcast.call_args_list[0]
        broadcast_modified.assert_called_with(key=key,data=data)
