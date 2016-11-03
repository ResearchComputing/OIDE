import os
import sys
import stat
import pwd
import shutil
import logging
from sandstone import settings
import grp
import subprocess
from sandstone.lib.filesystem.schemas import FilesystemObject
from sandstone.lib.filesystem.schemas import VolumeObject
from sandstone.lib.filesystem.schemas import FileObject



class PosixFS:
    """
    Interface for a Posix filesystem.
    """

    def _format_volume_paths(self):
        volume_patterns = settings.VOLUMES
        formatted_patterns = []
        for patt in volume_patterns:
            fmt = os.path.expandvars(patt)
            formatted_patterns.append(fmt)
        return formatted_patterns

    def get_filesystem_details(self):
        details = {
            'type': 'filesystem'
        }
        # get volume details
        volumes = []
        for volume_path in self._format_volume_paths():
            vd = {
                'type': 'volume',
                'name': volume_path
            }
            p = subprocess.Popen(['df', '-h', volume_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            out, err = p.communicate()
            size, used, avail, used_pct = out.split()[-5:-1]
            vd.update({
                'used': used,
                'available': avail,
                'used_pct': float(used_pct.strip('%')),
                'size': size
            })
            vol = VolumeObject(**vd)
            volumes.append(vol)
        details.update({
            'volumes': volumes
        })
        # get groups
        groups = self.get_groups()
        details.update({
            'groups': groups
        })
        fs = FilesystemObject(**details)
        return fs

    def get_groups(self):
        groups = subprocess.check_output(["id", "--name", "-G"]).strip().split()
        return groups

    def _parse_ls_line(self, out):
        contents = out.split()
        perms = contents[1]
        t = 'file'
        if perms[0] == 'd':
            t = 'directory'
        perms = perms[1:]
        owner = contents[3]
        group = contents[4]
        size = contents[5]
        if not size[-1].isalpha():
            size += 'b'
        details = {
            'type': t,
            'permissions': perms,
            'owner': owner,
            'group': group,
            'size': size
        }
        return details

    def get_file_details(self, filepath):
        filepath = os.path.abspath(filepath)
        if not self.exists(filepath):
            raise OSError('File not found')
        details = {
            'filepath': filepath
        }
        p = subprocess.Popen(['ls', '-lsahd', filepath], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, err = p.communicate()
        lines = out.split('\n')
        if lines[0] == '':
            out = lines[1]
        ls_det = self._parse_ls_line(out)
        details.update(ls_det)
        file_details = FileObject(**details)
        return file_details

    def get_directory_details(self, filepath, contents=True, dir_sizes=False):
        filepath = os.path.abspath(filepath)
        if not self.exists(filepath):
            raise OSError('File not found')
        details = {
            'filepath': filepath
        }
        if not contents:
            p = subprocess.Popen(['ls', '-lsahd', filepath], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            out, err = p.communicate()
            ls_det = self._parse_ls_line(out)
            details.update(ls_det)
            dir_details = FileObject(**details)
            return dir_details
        else:
            # Otherwise, get dir contents
            p = subprocess.Popen(['ls','--group-directories-first','-lsah', filepath], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            out, err = p.communicate()
            lines = out.split('\n')[1:]
            # the directory details
            ls_det = self._parse_ls_line(lines[0])
            details.update(ls_det)
            # directory contents
            contents = []
            for line in lines[2:-1]:
                line_details = self._parse_ls_line(line)
                name = line.split()[-1]
                fp = os.path.join(filepath,name)
                line_details.update({
                    'filepath': fp
                })
                if dir_sizes and line_details['type'] == 'directory':
                    line_details['size'] = self.get_size(fp)
                file_details = FileObject(**line_details)
                contents.append(file_details)

            details['contents'] = contents

        dir_details = FileObject(**details)
        return dir_details

    def exists(self, filepath):
        filepath = os.path.abspath(filepath)
        exists = os.path.exists(filepath)
        return exists

    def get_type_from_path(self, filepath):
        filepath = os.path.abspath(filepath)
        if not self.exists(filepath):
            raise OSError('File not found')
        if os.path.isdir(filepath):
            return 'directory'
        return 'file'

    def get_size(self, filepath):
        filepath = os.path.abspath(filepath)
        if not self.exists(filepath):
            raise OSError('File not found')
        p = subprocess.Popen(['du','-hs',filepath],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        out, err = p.communicate()
        out = out.strip()
        size, fp = out.split('\t')
        if not size[-1].isalpha():
            size += 'b'
        return size

    def create_file(self, filepath):
        filepath = os.path.abspath(filepath)
        if os.path.exists(filepath):
            logging.info('File {} already exists, not creating'.format(filepath))
            return filepath
        fd = open(filepath,'w')
        fd.close()

    def read_file(self, filepath):
        filepath = os.path.abspath(filepath)
        with open(filepath, 'r') as f:
            content = f.read()
        return content

    def write_file(self, filepath, content):
        filepath = os.path.abspath(filepath)
        if not os.path.exists(filepath):
            raise IOError
        with open(filepath, 'w') as local_file:
            for line in content:
                local_file.write(line.encode('utf8'))

    def delete(self, filepath):
        filepath = os.path.abspath(filepath)
        if os.path.isdir(filepath):
            shutil.rmtree(filepath)
        else:
            os.remove(filepath)

    def create_directory(self, filepath):
        filepath = os.path.abspath(filepath)
        os.makedirs(filepath)

    def move(self, origpath, newpath):
        origpath = os.path.abspath(origpath)
        newpath = os.path.abspath(newpath)
        shutil.move(origpath,newpath)

    def copy(self, origpath, newpath):
        origpath = os.path.abspath(origpath)
        newpath = os.path.abspath(newpath)
        if os.path.isdir(origpath):
            shutil.copytree(origpath,newpath)
        else:
            shutil.copy2(origpath,newpath)

    def rename(self, origpath, newname):
        origpath = os.path.abspath(origpath)
        dirname, name = os.path.split(origpath)
        newpath = os.path.join(dirname,newname)
        os.rename(origpath,newpath)
        return newpath

    def _permissions_to_octal(self, perm_string):
        try:
            perm_octal = int(perm_string, 8)
            # Already an octal string
            return perm_string
        except ValueError:
            pass
        perms = []
        count = 0
        p = 0
        if len(perm_string) == 10:
            perm_string = perm_string[1:]

        for i in perm_string:
            if i == 'r':
                p += 4
            elif i == 'w':
                p += 2
            elif i == 'x':
                p += 1
            if count == 2:
                perms.append('%d' % p)
                count = 0
                p = 0
            else:
                count += 1
        return ''.join(perms)

    def update_permissions(self, filepath, perm_string):
        filepath = os.path.abspath(filepath)
        if not self.exists(filepath):
            raise OSError('File not found')
        perm_octal = self._permissions_to_octal(perm_string)
        os.chmod(filepath, int(perm_octal, 8))

    def update_group(self, filepath, group_name):
        filepath = os.path.abspath(filepath)
        if not self.exists(filepath):
            raise OSError('File not found')
        # Get uid
        uid = os.stat(filepath).st_uid
        # Get GID of new group
        gid = grp.getgrnam(group_name).gr_gid
        # change group
        os.chown(filepath, uid, gid)
