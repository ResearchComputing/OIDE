import unittest
from pydispatch import dispatcher
from sandstone.lib.broadcast.manager import BroadcastManager
from sandstone.lib.broadcast.message import BroadcastMessage
import mock

MOCK_ROOT_DIRS = ['/home/saurabh', '/tmp']

MOCK_CONTENTS = [
    ('file1', '/home/saurabh/file1', False),
    ('dir1', '/home/saurabh/dir1', True)
]

class SignalTestCase(unittest.TestCase):
    """
    Tests the dispatch handlers
    """

    @mock.patch('sandstone.apps.filebrowser.posixfs.PosixFS.list_root_paths')
    def test_filetree_init(self, mock_function):
        mock_function.return_value = MOCK_ROOT_DIRS

        with mock.patch('sandstone.apps.filebrowser.signals.BroadcastManager.broadcast') as mock_broadcast:

            message = {
                'key': 'filetree:init',
                'data': {}
            }
            bmsg = BroadcastMessage.create_from_dict(message)
            dispatcher.send(bmsg.key, bmsg.data)

            message = {
                'key': 'filetree:root_dirs',
                'data': {
                    'root_dirs': [
                        {
                            'type': 'dir',
                            'filepath': '/home/saurabh',
                            'filename': '/home/saurabh'
                        },
                        {
                            'type': 'dir',
                            'filepath': '/tmp',
                            'filename': '/tmp'
                        }
                    ]
                }
            }
            try:
                bmsg = BroadcastMessage.create_from_dict(message)
            except BroadcastMessage.MessageValidationError:
                return

            mock_broadcast.assert_called()
            # get call arguments
            args = mock_broadcast.call_args
            # key and data should be equal
            self.assertEqual(bmsg.key, args[0][0].key)
            self.assertEqual(bmsg.data, args[0][0].data)

    @mock.patch('sandstone.apps.filebrowser.posixfs.PosixFS.get_dir_contents')
    def test_filetree_expanded_files(self, mock_get_dir_contents):
        mock_get_dir_contents.return_value = MOCK_CONTENTS

        with mock.patch('sandstone.apps.filebrowser.signals.BroadcastManager.broadcast') as mock_broadcast:
            # get contents including directories and files
            message = {
                'key': 'filetree:expanded',
                'data': {
                    'node': {
                        'filepath': '/home/saurabh',
                    },
                    'dirs': False
                },
            }
            bmsg = BroadcastMessage.create_from_dict(message)
            dispatcher.send(bmsg.key, bmsg.data)

            message = {
                'key': 'filetree:got_contents',
                'data': {
                    'contents': [
                        {
                            'type': 'file',
                            'filepath': '/home/saurabh/file1',
                            'filename': 'file1'
                        },
                        {
                            'type': 'dir',
                            'filepath': '/home/saurabh/dir1',
                            'filename': 'dir1'
                        }
                    ],
                    'node': {
                        'filepath': '/home/saurabh'
                    }
                }
            }

            try:
                bmsg = BroadcastMessage.create_from_dict(message)
            except BroadcastMessage.MessageValidationError:
                return

            mock_broadcast.assert_called()
            args = mock_broadcast.call_args

            self.assertEqual(bmsg.key, args[0][0].key)
            self.assertEqual(bmsg.data, args[0][0].data)

    @mock.patch('sandstone.apps.filebrowser.posixfs.PosixFS.get_dir_contents')
    def test_filetree_expanded_contents(self, mock_get_dir_contents):
        mock_get_dir_contents.return_value = MOCK_CONTENTS

        with mock.patch('sandstone.apps.filebrowser.signals.BroadcastManager.broadcast') as mock_broadcast:
            # get only the directories
            message = {
                'key': 'filetree:expanded',
                'data': {
                    'node': {
                        'filepath': '/home/saurabh',
                    },
                    'dirs': True
                },
            }
            bmsg = BroadcastMessage.create_from_dict(message)
            dispatcher.send(bmsg.key, bmsg.data)

            message = {
                'key': 'filetree:got_contents',
                'data': {
                    'contents': [
                        {
                            'type': 'dir',
                            'filepath': '/home/saurabh/dir1',
                            'filename': 'dir1'
                        }
                    ],
                    'node': {
                        'filepath': '/home/saurabh'
                    }
                }
            }

            try:
                bmsg = BroadcastMessage.create_from_dict(message)
            except BroadcastMessage.MessageValidationError:
                return

            mock_broadcast.assert_called()
            args = mock_broadcast.call_args

            # check for data and key being equal
            self.assertEqual(bmsg.key, args[0][0].key)
            self.assertEqual(bmsg.data, args[0][0].data)

    @mock.patch('sandstone.apps.filebrowser.posixfs.PosixFS.create_file')
    def test_create_new_file(self, mock_create_file):
        mock_create_file.return_value = '/home/saurabh/Untitled1'

        with mock.patch('sandstone.apps.filebrowser.signals.BroadcastManager.broadcast') as mock_broadcast:
            message = {
                'key': 'filetree:create_new_file',
                'data': {
                    'filepath': '/home/saurabh'
                },
            }
            bmsg = BroadcastMessage.create_from_dict(message)
            dispatcher.send(bmsg.key, bmsg.data)

            message = {
                'key': 'filetree:created_file',
                'data': {
                    'filepath': '/home/saurabh/Untitled1'
                }
            }

            try:
                bmsg = BroadcastMessage.create_from_dict(message)
            except BroadcastMessage.MessageValidationError:
                return

            mock_broadcast.assert_called()
            args = mock_broadcast.call_args

            # check for data and key being equal
            self.assertEqual(bmsg.key, args[0][0].key)
            self.assertEqual(bmsg.data, args[0][0].data)


    @mock.patch('sandstone.apps.filebrowser.posixfs.PosixFS.create_directory')
    def test_create_new_directory(self, mock_create_dir):
        mock_create_dir.return_value = '/home/saurabh/UntitledFolder1'

        with mock.patch('sandstone.apps.filebrowser.signals.BroadcastManager.broadcast') as mock_broadcast:
            message = {
                'key': 'filetree:create_new_dir',
                'data': {
                    'dirpath': '/home/saurabh'
                },
            }
            bmsg = BroadcastMessage.create_from_dict(message)
            dispatcher.send(bmsg.key, bmsg.data)

            message = {
                'key': 'filetree:created_new_dir',
                'data': {
                    'dirpath': '/home/saurabh/UntitledFolder1'
                }
            }

            try:
                bmsg = BroadcastMessage.create_from_dict(message)
            except BroadcastMessage.MessageValidationError:
                return

            mock_broadcast.assert_called()
            args = mock_broadcast.call_args

            # check for data and key being equal
            self.assertEqual(bmsg.key, args[0][0].key)
            self.assertEqual(bmsg.data, args[0][0].data)

    @mock.patch('sandstone.apps.filebrowser.posixfs.PosixFS.delete_file')
    def test_delete_files(self, mock_delete_file):
        with mock.patch('sandstone.apps.filebrowser.signals.BroadcastManager.broadcast') as mock_broadcast:
            files_deleted = ['/home/saurabh/file1', '/home/saurabh/file1']
            message = {
                'key': 'filetree:delete_files',
                'data': {
                    'files': files_deleted
                },
            }
            bmsg = BroadcastMessage.create_from_dict(message)
            dispatcher.send(bmsg.key, bmsg.data)

            message = {
                'key': 'filetree:files_deleted',
                'data': {
                    'files': files_deleted
                }
            }

            try:
                bmsg = BroadcastMessage.create_from_dict(message)
            except BroadcastMessage.MessageValidationError:
                return

            mock_broadcast.assert_called()
            args = mock_broadcast.call_args

            # check for data and key being equal
            self.assertEqual(bmsg.key, args[0][0].key)
            self.assertEqual(bmsg.data, args[0][0].data)

    @mock.patch('sandstone.apps.filebrowser.posixfs.PosixFS.rename_file')
    def test_rename_file(self, mock_rename_file):
        with mock.patch('sandstone.apps.filebrowser.signals.BroadcastManager.broadcast') as mock_broadcast:
            message = {
                'key': 'filetree:rename',
                'data': {
                    'filepath': '/home/saurabh/file1',
                    'newFileName': 'file2'
                },
            }
            bmsg = BroadcastMessage.create_from_dict(message)
            dispatcher.send(bmsg.key, bmsg.data)

            message = {
                'key': 'filetree:file_renamed',
                'data': {
                    'newpath': '/home/saurabh/file2'
                }
            }

            try:
                bmsg = BroadcastMessage.create_from_dict(message)
            except BroadcastMessage.MessageValidationError:
                return

            mock_broadcast.assert_called()
            args = mock_broadcast.call_args

            # check for data and key being equal
            self.assertEqual(bmsg.key, args[0][0].key)
            self.assertEqual(bmsg.data, args[0][0].data)

    @mock.patch('sandstone.apps.filebrowser.posixfs.PosixFS.copy_file')
    def test_paste_file(self, mock_rename_file):
        with mock.patch('sandstone.apps.filebrowser.signals.BroadcastManager.broadcast') as mock_broadcast:
            message = {
                'key': 'filetree:paste_files',
                'data': {
                    'nodes': [
                        {
                            'filepath': '/home/saurabh/file1',
                            'filename': 'file1'
                        },
                        {
                            'filepath': '/home/saurabh/file2',
                            'filename': 'file2'
                        }
                    ],
                    'newDirPath': '/tmp'
                },
            }
            bmsg = BroadcastMessage.create_from_dict(message)
            dispatcher.send(bmsg.key, bmsg.data)

            message = {
                'key': 'filetree:files_pasted',
                'data': {}
            }

            try:
                bmsg = BroadcastMessage.create_from_dict(message)
            except BroadcastMessage.MessageValidationError:
                return

            mock_broadcast.assert_called()
            args = mock_broadcast.call_args

            # check for data and key being equal
            self.assertEqual(bmsg.key, args[0][0].key)
            self.assertEqual(bmsg.data, args[0][0].data)
