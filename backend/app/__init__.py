from flask import Flask
from dotenv import load_dotenv
import os
from authlib.integrations.flask_client import OAuth
import firebase_admin
from firebase_admin import credentials, firestore
from .firebase_routes import firebase_bp
from flask_socketio import SocketIO, emit
import redis
from flask_session import Session

# Load environment variables from .env
load_dotenv()

# Initialize SocketIO at module level
socketio = SocketIO()

def init_socketio(app):
    socketio.init_app(app, cors_allowed_origins="*")
    return socketio

@socketio.on('checkpoint_update')
def handle_checkpoint_update(data):
    emit('checkpoint_updated', {
        'checkpoint': data['checkpoint']
    }, broadcast=True)

def session_init(app):
    app.config['SESSION_TYPE'] = 'redis'
    app.config['SESSION_PERMANENT'] = False
    app.config['SESSION_USE_SIGNER'] = True
    app.config['SESSION_KEY_PREFIX'] = 'session:'
    app.config['SESSION_REDIS'] = redis.StrictRedis(host='localhost', port=6379, db=0)
    Session(app)

def auth0_init(app):
    oauth = OAuth()
    app.config["AUTH0_CLIENT_ID"] = os.getenv("AUTH0_CLIENT_ID")
    app.config["AUTH0_CLIENT_SECRET"] = os.getenv("AUTH0_CLIENT_SECRET")
    app.config["AUTH0_DOMAIN"] = os.getenv("AUTH0_DOMAIN")
    app.config["AUTH0_CALLBACK_URL"] = os.getenv("AUTH0_CALLBACK_URL")
    
    oauth.init_app(app)
    auth0 = oauth.register(
        "auth0",
        client_id=os.getenv("AUTH0_CLIENT_ID"),
        client_secret=os.getenv("AUTH0_CLIENT_SECRET"),
        client_kwargs={"scope": "openid profile email"},
        server_metadata_url=f'https://{os.getenv("AUTH0_DOMAIN")}/.well-known/openid-configuration'
    )
    return auth0

def firebase_init():
    cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS_PATH"))
    firebase_admin.initialize_app(cred)

def create_app():
    # Initialize Firebase first
    firebase_init()
    
    # Create Flask app
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("APP_SECRET_KEY")
    
    # Initialize all services
    auth0 = auth0_init(app)
    session_init(app)
    init_socketio(app)
    
    # Register blueprints
    app.register_blueprint(firebase_bp, url_prefix='/api')
    
    from app.auth_routes import auth_bp
    auth_bp.auth0 = auth0
    app.register_blueprint(auth_bp, url_prefix="/auth")
    
    from app.redis_routes import redis_routes
    app.register_blueprint(redis_routes, url_prefix='/redis')
    
    return app