import Pyro4
from lib.services.authpam import AuthPam
import settings as global_settings



auth_pam=AuthPam()

auth_daemon=Pyro4.Daemon()
ns=Pyro4.locateNS()
uri=auth_daemon.register(auth_pam)
ns.register(global_settings.PYRO_AUTHPAM_URI, uri)

print "Auth daemon running."
auth_daemon.requestLoop()