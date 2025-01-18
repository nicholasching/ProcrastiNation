from flask import Flask
from dotenv import load_dotenv
import os
from authlib.integrations.flask_client import OAuth
import firebase_admin
from firebase_admin import credentials, firestore
from .firebase_routes import firebase_bp

import redis
from flask_session import Session

# Load environment variables from .env
load_dotenv()

def session_init(app):
    # Session configuration
    app.config['SESSION_TYPE'] = 'redis'
    app.config['SESSION_PERMANENT'] = False
    app.config['SESSION_USE_SIGNER'] = True
    app.config['SESSION_KEY_PREFIX'] = 'session:'
    app.config['SESSION_REDIS'] = redis.StrictRedis(host='localhost', port=6379, db=0)

    # Initialize the Flask-Session extension
    Session(app)

def auth0_init(app):
    # Initialize OAuth
    oauth = OAuth()

    # Load configuration settings
    app.config["AUTH0_CLIENT_ID"] = os.getenv("AUTH0_CLIENT_ID")
    app.config["AUTH0_CLIENT_SECRET"] = os.getenv("AUTH0_CLIENT_SECRET")
    app.config["AUTH0_DOMAIN"] = os.getenv("AUTH0_DOMAIN")
    app.config["AUTH0_CALLBACK_URL"] = os.getenv("AUTH0_CALLBACK_URL")

    # Initialize OAuth with the Flask app
    oauth.init_app(app)

    auth0 = oauth.register(
        "auth0",
        client_id=os.getenv("AUTH0_CLIENT_ID"),
        client_secret=os.getenv("AUTH0_CLIENT_SECRET"),
        client_kwargs={"scope": "openid profile email"},
        server_metadata_url=f'https://{os.getenv("AUTH0_DOMAIN")}/.well-known/openid-configuration'
    )

    return auth0

def firebase_init(app):
    cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS_PATH"))  # Path to Firebase Admin SDK JSON file
    firebase_admin.initialize_app(cred)

def create_app():
    cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS_PATH"))  # Path to Firebase Admin SDK JSON file
    firebase_admin.initialize_app(cred)
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("APP_SECRET_KEY")

    auth0 = auth0_init(app)

    # Firebase setup
    app.register_blueprint(firebase_bp, url_prefix='/api')

    # Register Blueprints
    from app.auth_routes import auth_bp
    auth_bp.auth0 = auth0
    app.register_blueprint(auth_bp, url_prefix="/auth")

    from app.redis_routes import redis_routes
    app.register_blueprint(redis_routes, url_prefix='/redis')

    # from app.user.routes import user_bp
    # app.register_blueprint(user_bp, url_prefix="/user")

    # from app.post.routes import post_bp
    # app.register_blueprint(post_bp, url_prefix="/post")

    # from app.activity.routes import activity_bp
    # app.register_blueprint(activity_bp, url_prefix="/activity")

    return app