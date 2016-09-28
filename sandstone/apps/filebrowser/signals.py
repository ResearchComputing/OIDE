from pydispatch import dispatcher
from websocket import create_connection
import json
import tornado.escape
from sandstone.lib.websocket_client import WebSocketClient
from sandstone.lib.broadcast.manager import BroadcastManager
from sandstone.lib.broadcast.message import BroadcastMessage
import os

# TODO This seems a little redundant
# TODO find a better way
SIGNALS_HANDLED = (
    'filetree:init',
)

# Receivers
def filetree_init(sender):
    from posixfs import PosixFS
    # get the list of root directories
    root_paths = PosixFS.list_root_paths()
    root_nodes = []
    for r in root_paths:
        root_nodes.append({
            'type': 'dir',
            'filepath': r,
            'filename': r
        })
    message = {
        'key': 'filetree:root_dirs',
        'data': {
            'root_dirs': root_nodes
        }
    }
    try:
        bmsg = BroadcastMessage.create_from_dict(message)
    except BroadcastMessage.MessageValidationError:
        return
    BroadcastManager.broadcast(bmsg)

def filetree_expanded(sender):
    from posixfs import PosixFS
    filenode = sender['node']
    filepath = filenode['filepath']
    needs_dirs = sender['dirs']
    dir_contents = PosixFS.get_dir_contents(filepath)

    contents = []
    if needs_dirs:
        for node in dir_contents:
            if node[2]:
                contents.append({
                    'type': 'dir',
                    'filepath': node[1],
                    'filename': node[0]
                })
    else:
        for node in dir_contents:
            if node[2]:
                filetype = 'dir'
            else:
                filetype = 'file'
            contents.append({
                'type': filetype,
                'filepath': node[1],
                'filename': node[0]
            })
    message = {
        'key': 'filetree:got_contents',
        'data': {
            'contents': contents,
            'node': filenode
        }
    }
    try:
        bmsg = BroadcastMessage.create_from_dict(message)
    except BroadcastMessage.MessageValidationError:
        return
    BroadcastManager.broadcast(bmsg)

def get_untitled_filename(sender):
    from posixfs import PosixFS
    filepath = sender['filepath']
    if filepath:
        index = 0
        fileExists = True
        while fileExists:
            index += 1
            filename = 'Untitled' + str(index)
            newFilePath = os.path.join(filepath,filename)
            fileExists = PosixFS.file_exists(newFilePath)
        message = {
            'key': 'filetree:next_untitled_file',
            'data': {
                'filepath': newFilePath
            }
        }
    try:
        bmsg = BroadcastMessage.create_from_dict(message)
    except BroadcastMessage.MessageValidationError:
        return
    BroadcastManager.broadcast(bmsg)

def create_new_file(sender):
    from posixfs import PosixFS
    filepath = sender['filepath']
    if filepath:
        created_filepath = PosixFS.create_file(filepath)
        message = {
            'key': 'filetree:created_file',
            'data': {
                'filepath': created_filepath
            }
        }
    try:
        bmsg = BroadcastMessage.create_from_dict(message)
    except BroadcastMessage.MessageValidationError:
        return
    BroadcastManager.broadcast(bmsg)

def get_untitled_dir(sender):
    from posixfs import PosixFS
    dirpath = sender['dirpath']
    if dirpath:
        index = 0
        dirExists = True
        while dirExists:
            index+=1
            dirname = 'UntitledFolder' + str(index)
            newDirPath = os.path.join(dirpath, dirname,'')
            dirExists = PosixFS.file_exists(newDirPath)
        message = {
            'key': 'filetree:next_untitled_dir',
            'data': {
                'dirpath': newDirPath
            }
        }
    try:
        bmsg = BroadcastMessage.create_from_dict(message)
    except BroadcastMessage.MessageValidationError:
        return
    BroadcastManager.broadcast(bmsg)

def create_new_dir(sender):
    from posixfs import PosixFS
    dirpath = sender['dirpath']
    if dirpath:
        created_dirpath = PosixFS.create_directory(dirpath)
        message = {
            'key': 'filetree:created_new_dir',
            'data': {
                'dirpath': created_dirpath
            }
        }
    try:
        bmsg = BroadcastMessage.create_from_dict(message)
    except BroadcastMessage.MessageValidationError:
        return
    BroadcastManager.broadcast(bmsg)

def delete_files(sender):
    from posixfs import PosixFS
    files_to_delete = sender['files']

    for f in files_to_delete:
        PosixFS.delete_file(f)
    message = {
        'key': 'filetree:files_deleted',
        'data': {
            'files': files_to_delete
        }
    }
    try:
        bmsg = BroadcastMessage.create_from_dict(message)
    except BroadcastMessage.MessageValidationError:
        return
    BroadcastManager.broadcast(bmsg)

def rename_file(sender):
    from posixfs import PosixFS
    filepath = sender['filepath']
    new_name = sender['newFileName']

    if os.path.isdir(filepath):
        basepath = os.path.split(os.path.dirname(filepath))[0]
        newpath = os.path.join(basepath,new_name,'')
    else:
        basepath = os.path.dirname(filepath)
        newpath = os.path.join(basepath,new_name)
    PosixFS.rename_file(filepath, newpath)
    message = {
        'key': 'filetree:file_renamed',
        'data': {
            'newpath': newpath
        }
    }
    try:
        bmsg = BroadcastMessage.create_from_dict(message)
    except BroadcastMessage.MessageValidationError:
        return
    BroadcastManager.broadcast(bmsg)

def paste_files(sender):
    from posixfs import PosixFS
    nodes = sender['nodes']
    new_dir = sender['newDirPath']

    for node in nodes:
        PosixFS.copy_file(node['filepath'], new_dir + node['filename'])
    message = {
        'key': 'filetree:files_pasted',
        'data': {}
    }
    try:
        bmsg = BroadcastMessage.create_from_dict(message)
    except BroadcastMessage.MessageValidationError:
        return
    BroadcastManager.broadcast(bmsg)

# Connect signals
dispatcher.connect(filetree_init, signal='filetree:init')
dispatcher.connect(filetree_expanded, signal='filetree:expanded')
dispatcher.connect(get_untitled_filename, signal='filetree:get_untitled_file')
dispatcher.connect(create_new_file, signal='filetree:create_new_file')
dispatcher.connect(get_untitled_dir, signal='filetree:get_untitled_dir')
dispatcher.connect(create_new_dir, signal='filetree:create_new_dir')
dispatcher.connect(delete_files, signal='filetree:delete_files')
dispatcher.connect(rename_file, signal='filetree:rename')
dispatcher.connect(paste_files, signal='filetree:paste_files')
