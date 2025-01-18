import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "mysecret")
    OAUTH_CLIENT_ID = os.getenv("OAUTH_CLIENT_ID")
    OAUTH_CLIENT_SECRET = os.getenv("OAUTH_CLIENT_SECRET")
    FIREBASE_ADMIN_CREDENTIALS = os.getenv("FIREBASE_ADMIN_CREDENTIALS")