import os
import sys
import stat
import pwd
import shutil
import logging
from sandstone import settings
import grp
import subprocess



class PosixFS():
    @staticmethod
    def file_exists(filepath):
        filepath = os.path.abspath(filepath)
        exists = os.path.exists(filepath)
        return exists

    @staticmethod
    def create_file(filepath):
        filepath = os.path.abspath(filepath)
        if os.path.exists(filepath):
            logging.info('File {} already exists, not creating'.format(filepath))
            return filepath
        fd = open(filepath,'w')
        fd.close()
        logging.info('Created file at {}'.format(filepath))
        return filepath

    @staticmethod
    def read_file(filepath):
        filepath = os.path.abspath(filepath)
        with open(filepath, 'r') as f:
            content = f.read()
        return content

    @staticmethod
    def update_file(filepath, content):
        filepath = os.path.abspath(filepath)
        if not os.path.exists(filepath):
            raise IOError
        with open(filepath, 'w') as local_file:
            for line in content:
                local_file.write(line.encode('utf8'))
        return filepath

    @staticmethod
    def delete_file(filepath):
        filepath = os.path.abspath(filepath)
        if os.path.isdir(filepath):
            shutil.rmtree(filepath)
        else:
            os.remove(filepath)
        return filepath

    @staticmethod
    def create_directory(filepath):
        filepath = os.path.abspath(filepath)
        os.makedirs(filepath)
        return filepath

    @staticmethod
    def move_file(origpath, newpath):
        origpath = os.path.abspath(origpath)
        newpath = os.path.abspath(newpath)
        shutil.move(origpath,newpath)
        return newpath

    @staticmethod
    def copy_file(origpath, newpath):
        origpath = os.path.abspath(origpath)
        newpath = os.path.abspath(newpath)
        if os.path.isdir(origpath):
            shutil.copytree(origpath,newpath)
        else:
            shutil.copy2(origpath,newpath)
        return newpath

    @staticmethod
    def rename_file(origpath, newpath):
        origpath = os.path.abspath(origpath)
        newpath = os.path.abspath(newpath)
        os.rename(origpath,newpath)
        return newpath

    @staticmethod
    def list_root_paths(**kwargs):
        root_patterns = settings.FILESYSTEM_ROOT_DIRECTORIES
        formatted_patterns = []
        for patt in root_patterns:
            fmt = os.path.expandvars(patt)
            formatted_patterns.append(fmt)
        return formatted_patterns

    @staticmethod
    def get_dir_contents(dirpath):
        files = []
        dirs = []
        for i in os.listdir(dirpath):
            filepath = os.path.join(dirpath,i)
            is_dir = os.path.isdir(filepath)
            if is_dir:
                filepath = filepath + '/'
                dirs.append(( i,filepath,True ))
            else:
                files.append( ( i,filepath,False ) )
        dirs.sort(key=lambda tup: tup[1])
        files.sort(key=lambda tup: tup[1])
        return dirs + files

    @staticmethod
    def get_dir_folders(dirpath):
        contents = []
        for i in os.listdir(dirpath):
            filepath = os.path.join(dirpath,i)
            is_dir = os.path.isdir(filepath)
            if is_dir:
                filepath = filepath + '/'
            else:
                continue
            contents.append( ( i,filepath,is_dir ) )
        contents.sort(key=lambda tup: tup[1])
        return contents

    @staticmethod
    def change_permisions(filepath, perm_string):
        os.chmod(filepath, int(perm_string, 8))

    @staticmethod
    def get_groups():
        return subprocess.check_output(["id", "--name", "-G"]).strip().split()

    @staticmethod
    def change_group(filepath, group_name):
        # Get uid
        uid = os.stat(filepath).st_uid
        # Get GID of new group
        gid = grp.getgrnam(group_name).gr_gid
        # change group
        os.chown(filepath, uid, gid)

    @staticmethod
    def get_volume_info(filepath):
        df = subprocess.Popen(['df', filepath], stdout=subprocess.PIPE)
        output = df.communicate()[0]
        device, size, used, available, percent, mountpoint = output.split("\n")[1].split()
        size = int(size) / (1024 * 1024)
        used = int(used) / (1024 * 1024)
        return {'percent': float(percent.strip('%')), 'used': used, 'size': size}