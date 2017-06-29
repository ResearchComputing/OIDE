# -*- coding: utf-8 -*-
from distutils.core import setup
from setuptools import find_packages

setup(
    name='sandstone',
    version='1.1.1',
    author=u'Zebula Sampedro',
    author_email='sampedro@colorado.edu',
    packages=find_packages(),
    include_package_data=True,
    url='https://github.com/SandstoneHPC/sandstone-ide',
    license='MIT, see LICENSE',
    description="Sandstone IDE",
    long_description=open('DESCRIPTION.rst').read(),
    zip_safe=False,
    install_requires=[
        'peewee',
        'simplepam',
        'tornado==4.3',
        'terminado',
        'watchdog',
        'cerberus',
        'PyDispatcher',
        'python-magic',
    ],
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'Natural Language :: English',
        'Operating System :: Unix',
        'Topic :: Software Development :: User Interfaces',
        'Topic :: Software Development :: Build Tools',
        'Topic :: Text Editors :: Integrated Development Environments (IDE)',
        'Topic :: Terminals :: Terminal Emulators/X Terminals',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: JavaScript',
    ],
    entry_points={
        'console_scripts': [
            'sandstone=sandstone:run_server',
        ],
    },
)
