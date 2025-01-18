from flask import Blueprint, session, jsonify, request
import redis

# Define the Blueprint
redis_routes = Blueprint('redis', __name__)

# Redis configuration
redis_client = redis.StrictRedis(host='localhost', port=6379, db=0)

@redis_routes.route('/set_session', methods=['POST'])
def set_session():
    """Set session data from the frontend."""
    data = request.json
    if not data or 'user_id' not in data:
        return jsonify({'error': 'user_id is required'}), 400

    session['user_id'] = data['user_id']
    session['checkpoint'] = data.get('checkpoint', {})
    return jsonify({'message': 'Session data set successfully!'})

@redis_routes.route('/get_session', methods=['GET'])
def get_session():
    """Retrieve session data."""
    if 'user_id' not in session:
        return jsonify({'error': 'No active session'}), 400

    return jsonify({
        'user_id': session.get('user_id'),
        'checkpoint': session.get('checkpoint', {})
    })

@redis_routes.route('/end_session', methods=['POST'])
def end_session():
    """End session and save checkpoint to Firebase."""
    if 'user_id' not in session:
        return jsonify({'error': 'No active session to end'}), 400

    checkpoint_data = {
        'user_id': session.get('user_id'),
        'checkpoint': session.get('checkpoint', {})
    }

    # Simulate saving to Firebase
    print(f"Saving to Firebase: {checkpoint_data}")  # Replace with actual Firebase code

    # Clear session
    session.clear()

    return jsonify({'message': 'Session ended and data saved to Firebase!'})