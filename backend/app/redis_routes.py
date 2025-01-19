from flask import Blueprint, request, jsonify, session
import redis
import json
import uuid
from datetime import datetime
from firebase_admin import firestore 

# Initialize Redis connection
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0, decode_responses=True)

# Initialize Blueprint
redis_routes = Blueprint('redis_routes', __name__)

# Prefix for session keys
SESSION_PREFIX = "session:"

# Helper function to save data to Firebase (placeholder)
def save_to_firebase(data):
    db = firestore.client()
    activity_ref = db.collection('activity')
    if isinstance(data, dict):
        for user_id, user_data in data.items():
            doc_ref = activity_ref.document(user_id)
            
            save_data = {
                'user_id': user_id,
                'last_updated': datetime.utcnow(),
                'session_data': user_data
            }
            
            doc_ref.set(save_data, merge=True)

@redis_routes.route('/start_session', methods=['POST'])
def start_session():
    data = request.json
    session_id = data['session_id']  # Using session_id as host_id

    # Store session metadata in Redis
    session_key = f"{SESSION_PREFIX}{session_id}"
    session_data = {
        'session_id': session_id,
        'start_time': datetime.utcnow().isoformat()
    }
    redis_client.hmset(session_key, session_data)
    redis_client.expire(session_key, 3600)  # Optional: Session expires in 1 hour

    # Create a Redis set to track participants
    participants_key = f"{session_key}:participants"
    redis_client.sadd(participants_key, session_id)  # Add the session as a participant

    return jsonify({'message': 'Session started successfully!', 'session_id': session_id})

@redis_routes.route('/join_session', methods=['POST'])
def join_session():
    data = request.json
    user_id = data['user_id']
    session_id = data['session_id']  # Using session_id as host_id

    # Construct the session key
    session_key = f"{SESSION_PREFIX}{session_id}"
    participants_key = f"{session_key}:participants"

    # Verify that the session exists
    if not redis_client.exists(session_key):
        return jsonify({'error': 'Session does not exist.'}), 404

    # Add user to the session's participants list
    redis_client.sadd(participants_key, user_id)

    # Store session data for the user (initialize if not existing)
    user_session_key = f"{SESSION_PREFIX}{user_id}"
    if not redis_client.exists(user_session_key):
        redis_client.hmset(user_session_key, {'checkpoint': 'start'})  # Default value

    return jsonify({'message': 'User successfully joined the session!'})

@redis_routes.route('/update_session', methods=['POST'])
def update_session():
    data = request.json
    user_id = data['user_id']
    session_id = data['session_id']  # Using session_id as host_id
    checkpoint = data['checkpoint']

    # Ensure session exists
    session_key = f"{SESSION_PREFIX}{session_id}"
    if not redis_client.exists(session_key):
        return jsonify({'error': 'Session does not exist.'}), 404

    # Create or update the user session in Redis
    user_session_key = f"{SESSION_PREFIX}{user_id}"
    redis_client.hmset(user_session_key, checkpoint)
    redis_client.expire(user_session_key, 3600)  # Optional: Set session expiry for user data

    # Add user to the session's participants
    participants_key = f"{session_key}:participants"
    redis_client.sadd(participants_key, user_id)

    return jsonify({'message': 'User session data set successfully!'})

@redis_routes.route('/logout_user', methods=['POST'])
def logout_user():
    data = request.json
    user_id = data['user_id']
    session_id = data['session_id']  # Using session_id as host_id

    # Construct the keys
    user_session_key = f"{SESSION_PREFIX}{user_id}"
    participants_key = f"{SESSION_PREFIX}{session_id}:participants"

    # Verify the session and user participation
    if not redis_client.sismember(participants_key, user_id):
        return jsonify({'error': 'User is not part of the session.'}), 404

    # Save and remove the user's session data
    if redis_client.exists(user_session_key):
        user_data = redis_client.hgetall(user_session_key)
        save_to_firebase({user_id: user_data})  # Placeholder for Firebase save
        redis_client.delete(user_session_key)
    else:
        return jsonify({'error': 'No active session for the user.'}), 404

    # Remove the user from participants
    redis_client.srem(participants_key, user_id)

    return jsonify({'message': f'User {user_id} data saved and session cleared.'})

@redis_routes.route('/end_session', methods=['POST'])
def end_session():
    data = request.json
    session_id = data['session_id']  # Using session_id as host_id

    # Construct the keys
    session_key = f"{SESSION_PREFIX}{session_id}"
    participants_key = f"{session_key}:participants"

    # Verify session existence
    if not redis_client.exists(session_key):
        return jsonify({'error': 'No active session for the host.'}), 404

    # Retrieve and save all participants' data
    participants = redis_client.smembers(participants_key)
    if not participants:
        return jsonify({'error': 'No participants found in the session.'}), 404

    all_session_data = {}
    for user_id in participants:
        user_session_key = f"{SESSION_PREFIX}{user_id}"
        if redis_client.exists(user_session_key):
            user_data = redis_client.hgetall(user_session_key)
            all_session_data[user_id] = user_data
            redis_client.delete(user_session_key)

    save_to_firebase(all_session_data)  # Placeholder for Firebase save

    # Delete session data and participants list
    redis_client.delete(participants_key)
    redis_client.delete(session_key)

    return jsonify({'message': 'Session data saved and cleared for all users.'})

@redis_routes.route('/get_session', methods=['GET'])
def get_session():
    user_id = request.args.get('user_id')
    session_id = request.args.get('session_id')  # Using session_id as host_id

    # Ensure user is part of the session
    participants_key = f"{SESSION_PREFIX}{session_id}:participants"
    if not redis_client.sismember(participants_key, user_id):
        return jsonify({'error': 'User is not part of the session.'}), 404

    # Retrieve session data
    user_session_key = f"{SESSION_PREFIX}{user_id}"
    if redis_client.exists(user_session_key):
        user_data = redis_client.hgetall(user_session_key)
        return jsonify({'user_data': user_data})
    else:
        return jsonify({'error': 'No active session for the user.'}), 404

@redis_routes.route('/get_active_sessions', methods=['GET'])
def get_active_sessions():
    session_keys = redis_client.keys("session:*")  # Fetch all keys matching the pattern
    session_ids = {
        key.split(":")[1]  # Extract the session ID
        for key in session_keys
        if key.startswith("session:")  # Ensure valid session keys
    }
    return jsonify({"sessions": list(session_ids)})