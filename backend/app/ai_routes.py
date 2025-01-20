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

@notification_bp.route('/create-post', methods=['POST'])
def create_post():
    try:
        # Get data from request
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Extract parameters
        user_name = data.get('name')
        focus_time = data.get('focus_time', 0)  # Default to 0 if not provided
        achievement = data.get('achievement')
        user_id = data.get('user_id')

        # Validate required fields
        if not all([user_name, achievement, user_id]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Validate focus_time
        if not isinstance(focus_time, (int, float)) or focus_time <= 0:
            return jsonify({'error': 'Invalid focus_time value'}), 400

        # Generate post using AI
        post = ai_instance.genLinkedInPost(
            name=user_name,
            current_focus=focus_time,
            achievement=achievement
        )

        # Store post in Firebase
        db = firestore.client()
        posts_ref = db.collection('posts')
        post_data = {
            'user_id': user_id,
            'name': user_name,
            'post_title': post["title"],
            'focus_time': focus_time,
            'achievement': achievement,
            'post_text': post["body"],
            'created_at': datetime.utcnow()
        }
        post_doc = posts_ref.add(post_data)

        # Return the post and ID
        return jsonify({
            'post_id': post_doc[1].id,
            'post_title': post["title"],
            'post_text': post["body"]
        }), 201

    except ValueError as e:
        return jsonify({'error': f'Invalid parameter value: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@notification_bp.route('/top-posts', methods=['GET'])
def get_top_posts():
    """Retrieve the top 5 most recent posts."""
    db = firestore.client()
    posts_ref = db.collection('posts')
    try:
        # Query for the most recent 5 posts, ordered by timestamp (descending)
        posts_query = posts_ref.order_by('created_at', direction=firestore.Query.DESCENDING).limit(5)
        posts = posts_query.stream()
        
        # Convert Firestore documents to a list of dictionaries
        posts_list = [{'post_id': doc.id, **doc.to_dict()} for doc in posts]
        
        return jsonify(posts_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500