import unittest
import mock
from sandstone.lib.test_utils import TestHandlerBase

from sandstone.lib.filesystem.interfaces import PosixFS
from sandstone.lib.filesystem.mixins import FSMixin



ROOTS = (
    '/tmp/test/',
    '/testdir/',
)


class FSMixinTestCase(TestHandlerBase):
    def test_initialize(self):
        request = mock.Mock()
        handler = FSMixin(self.get_app(),request)
        self.assertTrue(isinstance(handler.fs,PosixFS))
