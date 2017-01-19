DB_URL = 'sqlite:///db.sqlite'
DEBUG = True

try:
    from local_config import *  # NOQA
except:
    print("No local config")
    pass
