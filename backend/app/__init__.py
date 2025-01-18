from flask import Flask
from dotenv import load_dotenv
import os
from authlib.integrations.flask_client import OAuth

# Load environment variables from .env
load_dotenv()

def auth0_init():
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

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("APP_SECRET_KEY")

    auth0 = auth0_init()

    # Firebase setup
    cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS_PATH"))  # Path to Firebase Admin SDK JSON file
    firebase_admin.initialize_app(cred)

    # Initialize Firestore DB
    db = firestore.client()

    # Register Blueprints
    from app.auth_routes import auth_bp
    auth_bp.auth0 = auth0
    app.register_blueprint(auth_bp, url_prefix="/auth")

    # from app.user.routes import user_bp
    # app.register_blueprint(user_bp, url_prefix="/user")

    # from app.post.routes import post_bp
    # app.register_blueprint(post_bp, url_prefix="/post")

    # from app.activity.routes import activity_bp
    # app.register_blueprint(activity_bp, url_prefix="/activity")

    return app