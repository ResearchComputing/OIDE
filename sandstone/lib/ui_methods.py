from sandstone import settings



def get_app_descriptions(*args,**kwargs):
    desc_list = []
    for app_spec in settings.APP_SPECIFICATIONS:
        desc_list.append(app_spec['APP_DESCRIPTION'])
    return desc_list

def get_ng_module_spec(*args,**kwargs):
    mod_list = []
    for app_spec in settings.APP_SPECIFICATIONS:
        mod_list.append({
            'module_name':app_spec['NG_MODULE_NAME'],
            'stylesheets':app_spec['NG_MODULE_STYLESHEETS'],
            'scripts':app_spec['NG_MODULE_SCRIPTS']
        })
    return mod_list

def get_url_prefix(*args,**kwargs):
    url_prefix = settings.URL_PREFIX
    return url_prefix
