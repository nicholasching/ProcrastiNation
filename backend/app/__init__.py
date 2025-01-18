from flask import Flask
from flask_socketio import SocketIO
# from app.auth import oauth_init
from app.firebase import firebase_init
from app.ai import ai_init

socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config.from_object("config.Config")
    
    # Initialize OAuth
    # oauth_init(app)
    
    # Initialize Firebase
    # firebase_init(app)
    
    # Initialize AI (placeholders for generative AI and custom AI)
    # ai_init(app)
    
    # Initialize SocketIO for real-time updates
    # socketio.init_app(app)

    return app