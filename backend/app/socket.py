from flask_socketio import SocketIO, emit
from datetime import datetime

socketio = SocketIO()

def init_socketio(app):
    """Initialize SocketIO with the Flask app"""
    socketio.init_app(app, cors_allowed_origins="*")
    return socketio

@socketio.on('checkpoint_update')
def handle_checkpoint_update(data):
    """Broadcast checkpoint updates to all connected clients"""
    emit('checkpoint_updated', {
        'checkpoint': data['checkpoint'],
        'timestamp': datetime.utcnow().isoformat()
    }, broadcast=True)
