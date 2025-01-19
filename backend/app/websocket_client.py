from flask import Flask
from flask_socketio import SocketIO, emit, join_room, leave_room
from redis_routes import SESSION_PREFIX, redis_client
from datetime import datetime
import json


socketio = SocketIO()

def init_socketio(app):
    socketio.init_app(app, cors_allowed_origins="*")
    
@socketio.on('broadcast_message')
def handle_broadcast_message(data):
    session_id = data.get('session_id')
    user_id = data.get('user_id')
    message = data.get('message')
    
    if not all([session_id, user_id, message]):
        return {'status': 'error', 'message': 'Missing required fields'}
        
    # Construct the session key
    session_key = f"{SESSION_PREFIX}{session_id}"
    
    # Check if session exists
    if not redis_client.exists(session_key):
        return {'status': 'error', 'message': 'Session does not exist'}
        
    # Create message data
    message_data = {
        'user_id': user_id,
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Store message in Redis
    messages_key = f"{session_key}:messages"
    redis_client.rpush(messages_key, json.dumps(message_data))
    
    # Set expiry on messages (optional - same as session expiry)
    redis_client.expire(messages_key, 3600)
    
    # Broadcast the message to all users in the session
    emit('session_message', message_data, room=session_id)
    
    return {'status': 'sent'}