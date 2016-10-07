import unittest
import mock
from sandstone.lib.filewatcher import Filewatcher
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

    def test_remove_directory_to_watch(self):
        Filewatcher.add_directory_to_watch(self.test_dir)
        Filewatcher.remove_directory_to_watch(self.test_dir)
        self.assertEqual(len(Filewatcher._watches), 0)

    @mock.patch('sandstone.filewatcher.BroadcastManager.broadcast')
    def test_file_created_event(self, mock_broadcast):
        Filewatcher.add_directory_to_watch(self.test_dir)
        # create temp file
        filepath = os.path.join(self.test_dir, 'tmp.txt')
        fd = open(filepath, 'w')
        fd.close()
        # introduce a small delay for Filewatcher events to trigger
        time.sleep(1)

        key = 'filetree:created_file'
        data = {
            'filepath': filepath,
            'type': 'file'
        }
        self.assertTrue(mock_broadcast.called)
        broadcast_call_msg = mock_broadcast.call_args[0][0]
        self.assertEqual(key, broadcast_call_msg.key)
        self.assertEqual(data, broadcast_call_msg.data)

    @mock.patch('sandstone.filewatcher.BroadcastManager.broadcast')
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

        key = 'filetree:deleted_file'
        data = {
            'filepath': filepath,
            'type': 'file'
        }
        self.assertTrue(mock_broadcast.called)
        broadcast_call_msg = mock_broadcast.call_args[0][0]
        self.assertEqual(key, broadcast_call_msg.key)
        self.assertEqual(data, broadcast_call_msg.data)

    @mock.patch('sandstone.filewatcher.BroadcastManager.broadcast')
    def test_file_moved_event(self, mock_broadcast):
        # create a temporary file
        filepath = os.path.join(self.test_dir, 'tmp.txt')
        fd = open(filepath, 'w')
        fd.close()
        # watch the directory
        Filewatcher.add_directory_to_watch(self.test_dir)
        new_path = os.path.join(self.test_dir, 'new_temp.txt');
        # move the file
        shutil.move(filepath, new_path)
        time.sleep(1)

        key = 'filetree:moved_file'
        data = {
            'src_filepath': filepath,
            'dest_filepath': new_path,
            'type': 'file'
        }
        self.assertTrue(mock_broadcast.called)
        broadcast_call_msg = mock_broadcast.call_args[0][0]
        self.assertEqual(key, broadcast_call_msg.key)
        self.assertEqual(data, broadcast_call_msg.data)
