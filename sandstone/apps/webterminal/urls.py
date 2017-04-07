import terminado
from sandstone.apps.webterminal.handlers import AuthTermSocket
from sandstone import settings


shell_command = settings.WEB_TERMINAL_SHELL_CMD
extra_env = settings.WEB_TERMINAL_EXTRA_ENV

term_manager = terminado.UniqueTermManager(
    max_terminals=3,
    shell_command=shell_command,
    extra_env=extra_env)

URL_SCHEMA = [
            (r"/terminal/a/term", AuthTermSocket,
                    {'term_manager': term_manager})
        ]
