import unittest
import tempfile
import os
import shutil
import mock
from stat import *
import pwd

from sandstone.lib.filesystem.interfaces import PosixFS
from sandstone.lib.filesystem.schemas import FilesystemObject
from sandstone.lib.filesystem.schemas import VolumeObject
from sandstone.lib.filesystem.schemas import FileObject



class PosixFSTestCase(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.posix_fs = PosixFS()

    def tearDown(self):
        shutil.rmtree(self.test_dir)

    def test_get_filesystem_details(self):
        with mock.patch('sandstone.settings.VOLUMES',[self.test_dir]):
            fs_details = self.posix_fs.get_filesystem_details()
            self.assertTrue(isinstance(fs_details,FilesystemObject))
            self.assertEqual(fs_details.type,'filesystem')
            self.assertEqual(type(fs_details.groups),type([]))
            self.assertEqual(len(fs_details.volumes), 1)
            volume_details = fs_details.volumes[0]
            self.assertTrue(isinstance(volume_details,VolumeObject))
            self.assertEqual(volume_details.name,self.test_dir)
            self.assertEqual(volume_details.type,'volume')

    def test_get_groups(self):
        groups = self.posix_fs.get_groups()
        self.assertEqual(type(groups),type([]))

    def test__parse_ls_line(self):
        line = '4.0K drwxrwxr-x 5 testuser testgrp 4.0K Jun 22 12:03 apps'
        parsed = self.posix_fs._parse_ls_line(line)
        self.assertTrue('type' in parsed)
        self.assertEqual(parsed['type'],'directory')
        self.assertTrue('permissions' in parsed)
        self.assertEqual(parsed['permissions'],'rwxrwxr-x')
        self.assertTrue('owner' in parsed)
        self.assertEqual(parsed['owner'],'testuser')
        self.assertTrue('group' in parsed)
        self.assertEqual(parsed['group'],'testgrp')
        self.assertTrue('size' in parsed)
        self.assertEqual(parsed['size'],'4.0K')

        line = '4.0K -rw-rw-r-- 1 testuser testgrp 653 Aug 25 11:58 global_settings.py'
        parsed = self.posix_fs._parse_ls_line(line)
        self.assertTrue('type' in parsed)
        self.assertEqual(parsed['type'],'file')
        self.assertTrue('permissions' in parsed)
        self.assertEqual(parsed['permissions'],'rw-rw-r--')
        self.assertTrue('owner' in parsed)
        self.assertEqual(parsed['owner'],'testuser')
        self.assertTrue('group' in parsed)
        self.assertEqual(parsed['group'],'testgrp')
        self.assertTrue('size' in parsed)
        self.assertEqual(parsed['size'],'653b')

    def test_get_file_details(self):
        fp = os.path.join(self.test_dir,'testfile.txt')
        open(fp,'w').close()

        file_details = self.posix_fs.get_file_details(fp)
        self.assertTrue(isinstance(file_details,FileObject))
        self.assertTrue(file_details.type,'file')
        self.assertTrue(file_details.filepath,fp)

        self.assertRaises(OSError,self.posix_fs.get_file_details,'/fake/fp')

    def test_get_directory_details(self):
        dp = os.path.join(self.test_dir,'testDir')
        hp = os.path.join(self.test_dir,'.testDir')
        fp = os.path.join(self.test_dir,'atestfile.txt')
        fake_fp = '/does/not/exist'
        os.mkdir(dp)
        os.mkdir(hp)
        open(fp,'w').close()

        self.assertRaises(OSError,self.posix_fs.get_directory_details,fake_fp)

        dir_details = self.posix_fs.get_directory_details(self.test_dir,contents=False)
        self.assertTrue(isinstance(dir_details,FileObject))
        self.assertEqual(dir_details.filepath,self.test_dir)
        self.assertFalse(hasattr(dir_details,'contents'))

        dir_details = self.posix_fs.get_directory_details(self.test_dir)
        self.assertTrue(isinstance(dir_details,FileObject))
        self.assertEqual(dir_details.filepath,self.test_dir)
        self.assertTrue(hasattr(dir_details,'contents'))
        self.assertTrue(isinstance(dir_details.contents[0],FileObject))
        self.assertEqual(dir_details.contents[0].filepath,dp)
        self.assertEqual(dir_details.contents[1].filepath,hp)
        self.assertEqual(dir_details.contents[2].filepath,fp)

        dir_details = self.posix_fs.get_directory_details(self.test_dir,dir_sizes=True)
        self.assertTrue(isinstance(dir_details,FileObject))
        self.assertEqual(dir_details.filepath,self.test_dir)
        self.assertTrue(hasattr(dir_details,'contents'))

    def test_exists(self):
        abs_dp = os.path.join(self.test_dir,'testDir')
        rel_fp = os.path.join(self.test_dir,'..',self.test_dir,'testfile.txt')
        fake_fp = '/does/not/exist'

        os.mkdir(abs_dp)
        open(rel_fp,'w').close()

        self.assertTrue(self.posix_fs.exists(abs_dp))
        self.assertTrue(self.posix_fs.exists(rel_fp))
        self.assertFalse(self.posix_fs.exists(fake_fp))

    def test_get_type_from_path(self):
        abs_dp = os.path.join(self.test_dir,'testDir')
        rel_fp = os.path.join(self.test_dir,'..',self.test_dir,'testfile.txt')
        fake_fp = '/does/not/exist'

        os.mkdir(abs_dp)
        open(rel_fp,'w').close()

        t = self.posix_fs.get_type_from_path(abs_dp)
        self.assertEqual(t,'directory')
        t = self.posix_fs.get_type_from_path(rel_fp)
        self.assertEqual(t,'file')
        self.assertRaises(OSError,self.posix_fs.get_type_from_path,fake_fp)

    def test_get_size(self):
        abs_dp = os.path.join(self.test_dir,'testDir')
        rel_fp = os.path.join(self.test_dir,'..',self.test_dir,'testfile.txt')
        fake_fp = '/does/not/exist'
        os.mkdir(abs_dp)
        open(rel_fp,'w').close()

        self.assertRaises(OSError,self.posix_fs.get_size,fake_fp)

        size = self.posix_fs.get_size(abs_dp)
        self.assertTrue(type(size) == str)
        self.assertTrue(size[-1].isalpha())
        self.assertTrue(type(float(size[:-1])) == float)

        size = self.posix_fs.get_size(rel_fp)
        self.assertTrue(type(size) == str)
        self.assertTrue(size[-1].isalpha())
        self.assertTrue(type(float(size[:-1])) == float)

    def test_create_file(self):
        abs_fp = os.path.join(self.test_dir,'test.txt')
        rel_fp = os.path.join(self.test_dir,'..',self.test_dir,'test2.txt')
        ex_fp = os.path.join(self.test_dir,'text3.txt')

        self.posix_fs.create_file(abs_fp)
        self.assertTrue(os.path.exists(abs_fp))
        self.assertFalse(os.path.isdir(abs_fp))

        self.posix_fs.create_file(rel_fp)
        self.assertTrue(os.path.exists(rel_fp))
        self.assertFalse(os.path.isdir(rel_fp))

        open(ex_fp,'w').close()
        self.posix_fs.create_file(ex_fp)
        self.assertTrue(os.path.exists(ex_fp))
        self.assertFalse(os.path.isdir(ex_fp))

    def test_read_file(self):
        fp = os.path.join(self.test_dir,'testfile.txt')
        cnt_str = 'test\n\nstring\n'
        with open(fp,'w') as f:
            f.write(cnt_str.encode('utf8'))

        content = self.posix_fs.read_file(fp)
        self.assertEqual(
            content,
            cnt_str
        )

        self.assertRaises(IOError,self.posix_fs.read_file,'/does/not/exist')

    def test_write_file(self):
        fp1 = os.path.join(self.test_dir,'testfile1.txt')
        fp2 = os.path.join(self.test_dir,'testfile2.txt')
        fp_dne = os.path.join(self.test_dir,'dne.txt')
        cnt_str = 'test\n\nstring\n'
        for fp in [fp1,fp2]:
            with open(fp,'w') as f:
                f.write(cnt_str.encode('utf8'))

        # Test does not exist
        self.assertRaises(IOError,self.posix_fs.write_file,fp_dne,'')

        # Test string
        tfp = self.posix_fs.write_file(fp1,'test\n\nstring\n\u00E1\n\u00E1\u00E1')
        with open(fp1, 'r') as f:
            content = f.read()
            self.assertEqual(
                content,
                'test\n\nstring\n\u00E1\n\u00E1\u00E1'
            )
        # Test list
        tfp = self.posix_fs.write_file(fp2,['\u00E1\n','\u00E1\u00E1'])
        with open(fp2, 'r') as f:
            content = f.read()
            self.assertEqual(
                content,
                '\u00E1\n\u00E1\u00E1'
            )

    def test_delete(self):
        abs_dp = os.path.join(self.test_dir,'testDir')
        os.mkdir(abs_dp)
        open(os.path.join(abs_dp,'testfile.txt'),'w').close()
        rel_fp = os.path.join(self.test_dir,'..',self.test_dir,'testfile.txt')
        open(rel_fp,'w').close()

        self.assertRaises(OSError,self.posix_fs.delete,'/fake/fp')

        self.posix_fs.delete(abs_dp)
        self.assertFalse(os.path.exists(abs_dp))

        self.posix_fs.delete(rel_fp)
        self.assertFalse(os.path.exists(rel_fp))

    def test_create_directory(self):
        abs_fp = os.path.join(self.test_dir,'testDirA')
        rel_fp = os.path.join(self.test_dir,'..',self.test_dir,'testDirR')
        nest_fp = os.path.join(self.test_dir,'nested/testDir')

        for fp in [abs_fp,rel_fp,nest_fp]:
            self.posix_fs.create_directory(fp)
            self.assertTrue(os.path.exists(fp))
            self.assertTrue(os.path.isdir(fp))

    def test_move(self):
        abs_dp = os.path.join(self.test_dir,'testDir')
        os.mkdir(abs_dp)
        open(os.path.join(abs_dp,'testfile.txt'),'w').close()
        rel_fp = os.path.join(self.test_dir,'..',self.test_dir,'testfile.txt')
        open(rel_fp,'w').close()
        new_dp = os.path.join(self.test_dir,'newDir')
        new_fp = os.path.join(self.test_dir,'newFile.txt')

        self.assertRaises(IOError,self.posix_fs.move,'/fake/fp',new_dp)
        self.assertRaises(OSError,self.posix_fs.move,abs_dp,'/fake/fp')

        self.posix_fs.move(abs_dp,new_dp)
        self.assertTrue(os.path.exists(new_dp))
        self.assertTrue(os.path.exists(os.path.join(new_dp,'testfile.txt')))
        self.assertFalse(os.path.exists(abs_dp))

        self.posix_fs.move(rel_fp,new_fp)
        self.assertTrue(os.path.exists(new_fp))
        self.assertFalse(os.path.exists(rel_fp))

    def test_copy(self):
        abs_dp = os.path.join(self.test_dir,'testDir')
        os.mkdir(abs_dp)
        open(os.path.join(abs_dp,'testfile.txt'),'w').close()
        rel_fp = os.path.join(self.test_dir,'..',self.test_dir,'testfile.txt')
        open(rel_fp,'w').close()
        new_dp = os.path.join(self.test_dir,'newDir')
        new_fp = os.path.join(self.test_dir,'newFile.txt')

        self.assertRaises(IOError,self.posix_fs.copy,'/fake/fp',new_dp)
        self.assertRaises(OSError,self.posix_fs.copy,abs_dp,'/fake/fp')

        self.posix_fs.copy(abs_dp,new_dp)
        self.assertTrue(os.path.exists(new_dp))
        self.assertTrue(os.path.exists(os.path.join(new_dp,'testfile.txt')))
        self.assertTrue(os.path.exists(abs_dp))

        self.posix_fs.copy(rel_fp,new_fp)
        self.assertTrue(os.path.exists(new_fp))
        self.assertTrue(os.path.exists(rel_fp))

    def test_rename(self):
        abs_dp = os.path.join(self.test_dir,'testDir')
        os.mkdir(abs_dp)
        open(os.path.join(abs_dp,'testfile.txt'),'w').close()
        rel_fp = os.path.join(self.test_dir,'..',self.test_dir,'testfile.txt')
        open(rel_fp,'w').close()
        new_dp = os.path.join(self.test_dir,'newDir')
        new_fp = os.path.join(self.test_dir,'newFile.txt')

        self.assertRaises(OSError,self.posix_fs.rename,'/fake/fp','newDir')

        self.posix_fs.rename(abs_dp,'newDir')
        self.assertTrue(os.path.exists(new_dp))
        self.assertTrue(os.path.exists(os.path.join(new_dp,'testfile.txt')))
        self.assertFalse(os.path.exists(abs_dp))

        self.posix_fs.rename(rel_fp,'newFile.txt')
        self.assertTrue(os.path.exists(new_fp))
        self.assertFalse(os.path.exists(rel_fp))

    def test__permissions_to_octal(self):
        perm_string_1 = 'drwxrwxr-x'
        self.assertEqual(self.posix_fs._permissions_to_octal(perm_string_1), '775')

        perm_string_2 = '-rw-rw-r--'
        self.assertEqual(self.posix_fs._permissions_to_octal(perm_string_2), '664')

        perm_string_3 = '664'
        self.assertEqual(self.posix_fs._permissions_to_octal(perm_string_3), '664')

        perm_string_4 = 'rw-rw-r--'
        self.assertEqual(self.posix_fs._permissions_to_octal(perm_string_4), '664')

    def test_update_permissions(self):
        dp = os.path.join(self.test_dir,'testDir')
        os.mkdir(dp)
        sub_fp = os.path.join(dp,'testfile.txt')
        open(sub_fp,'w').close()
        fp = os.path.join(self.test_dir,'testfile.txt')
        open(fp,'w').close()

        self.posix_fs.update_permissions(dp,'rwxrwxrwx')
        self.assertEqual(os.stat(dp)[ST_MODE],040777)

        self.posix_fs.update_permissions(fp,'rwxrwxrwx')
        self.assertEqual(os.stat(fp)[ST_MODE],0100777)

        self.assertRaises(OSError,self.posix_fs.update_permissions,*['/fake/fp','rwxrwxrwx'])

    def test_update_group(self):
        fp = os.path.join(self.test_dir,'testfile.txt')
        open(fp,'w').close()

        groups = self.posix_fs.get_groups()
        current_grp = groups[0]
        newgrp = groups[1]

        file_details = self.posix_fs.get_file_details(fp)
        self.assertEqual(file_details.group,current_grp)

        self.posix_fs.update_group(fp,newgrp)
        file_details = self.posix_fs.get_file_details(fp)
        self.assertEqual(file_details.group,newgrp)

        self.assertRaises(OSError,self.posix_fs.update_group,*['/fake/fp','testgrp'])
