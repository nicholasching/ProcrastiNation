from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from datetime import datetime
from .ai import Ai

notification_bp = Blueprint('notification', __name__)
ai_instance = Ai()

@notification_bp.route('/generate-notification', methods=['POST'])
def generate_notification():
    try:
        # Get data from request
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Extract parameters
        user_id = data.get('user_id')
        friend_name = data.get('friend_name')
        current_app = data.get('app')
        notification_type = data.get('type', 0)  
        profile = data.get('profile', 0)  

        # Validate required fields
        if not all([user_id, friend_name, current_app]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Get user activity from Firebase
        db = firestore.client()
        activity_ref = db.collection('activity')
        activity = activity_ref.document(user_id).get()

        if not activity.exists:
            return jsonify({'error': 'No activity data found'}), 404

        # Get productive time from activity data
        activity_data = activity.to_dict()
        time_worked = activity_data.get('productive_time', 0)

        # Generate notification using AI
        notification = ai_instance.genIns(
            type=int(notification_type),  # Ensure integer
            name=friend_name,
            time=time_worked,
            app=current_app,
            profile=int(profile)  # Ensure integer
        )

        return jsonify(notification), 200

    except ValueError as e:
        return jsonify({'error': f'Invalid parameter value: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500