import os
import sys
import json
import shutil
import importlib
import subprocess
import re
from sandstone import settings



sandstone_mod = __import__('sandstone',fromlist=[''])
core_path = os.path.join(sandstone_mod.__path__[0],'client','sandstone','')
path_map = {
    'sandstone/': '/static/core/',
}
preprocessors = {
    'sandstone/components/**/*.html': 'ng-html2js',
}
file_list = [
    'sandstone/bower_components/angular/angular.js', 'sandstone/bower_components/angular-ui-router/release/angular-ui-router.js',
    'sandstone/bower_components/angular-mocks/angular-mocks.js',
    'sandstone/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
    'sandstone/bower_components/ace-builds/src-min-noconflict/ace.js',
    'sandstone/bower_components/angular-ui-ace/ui-ace.js',
    'sandstone/bower_components/angular-tree-control/angular-tree-control.js',
    'sandstone/bower_components/angular-smart-table/dist/smart-table.js',
    'sandstone/bower_components/angular-file-upload/dist/angular-file-upload.js',
    'sandstone/bower_components/term.js/src/term.js',
    'sandstone/components/**/*.js',
    'sandstone/components/**/*.html',
    'sandstone/sandstone.mod.js',
    'sandstone/sandstone.test.js',
]

dep_list = [
    'ui.router',
    'sandstone.acemodes',
    'ui.bootstrap',
    'sandstone.websocketservice',
    'sandstone.broadcastservice',
    'sandstone.filesystemservice',
    'sandstone.filetreedirective'
]

for spec in settings.APP_SPECIFICATIONS:
    # get the module object using the module name
    mod_path = spec['PY_MODULE_PATH']
    ng_mod_name = spec['NG_MODULE_NAME']
    mod_static_path = os.path.join(mod_path,'static','')
    mod_test_path = os.path.join(mod_path,'tests','js','**','*.js')
    mod_tpl_path = os.path.join(mod_static_path,'**/*.html')

    # Define file_list for app
    file_list.append(mod_test_path)
    file_list.append(mod_tpl_path)
    for s in spec['NG_MODULE_SCRIPTS']:
        spath = os.path.join(mod_static_path,s)
        file_list.append(spath)

    # Define dep_list for app
    dep_list.append('sandstone.'+ng_mod_name)

    # Define module_mapper entry for app
    path_map[mod_static_path] = os.path.join('/static',ng_mod_name,'')

    # Define preprocessor entry for app
    preprocessors[mod_tpl_path] = 'ng-html2js'

# Format karma.conf.js
fmt_dict = {
    'dep_list': json.dumps(dep_list),
    'file_list': json.dumps(file_list),
    'preprocessors': json.dumps(preprocessors),
    'path_map': json.dumps(path_map),
}

test_path = os.path.join(sandstone_mod.__path__[0],'client')
with open(os.path.join(test_path,'karma.environment.js.tpl')) as karma_tpl_env:
    file_contents = karma_tpl_env.read()

fmt_contents = file_contents%fmt_dict
with open(os.path.join(test_path,'karma.environment.js'), 'w+') as karma_env:
    karma_env.write(fmt_contents)

# Format sandstone.test.js
with open(os.path.join(core_path,'sandstone.test.js.tpl'), 'r') as test_tpl_file:
    file_contents = test_tpl_file.read()
    fmt_contents = file_contents%fmt_dict

with open(os.path.join(core_path,'sandstone.test.js'), "w+") as test_file:
    test_file.write(fmt_contents)

os.chdir(test_path)
if (len(sys.argv) > 1) and (sys.argv[1] == '--debug'):
    subprocess.call(['npm','run','test'])
else:
    subprocess.call(['npm','run','test-single-run'])
