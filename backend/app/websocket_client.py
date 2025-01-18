from flask_socketio import SocketIO, emit
from datetime import datetime

socketio = SocketIO()

def init_socketio(app):
    """Initialize SocketIO with the Flask app"""
    socketio.init_app(app, cors_allowed_origins="*")
    return socketio

@socketio.on('productivity_update')
def handle_productivity_update(data):
    """Broadcast productivity updates to all users in the same session"""
    session_id = data['session_id']
    user_id = data['user_id']
    minutes = round(data['productive_time'] / 60, 1)
    app_name = data.get('app_name', 'Unknown')

    message = f"{user_id} has been studying on {app_name} for {minutes} minutes"

    emit('productivity_milestone', message, to=f'session_{session_id}')