from flask import Blueprint, request, redirect, session, url_for, jsonify
from firebase_admin import auth as firebase_auth
from firebase_admin import firestore
from datetime import datetime
<<<<<<< HEAD
import re
import os
=======
import re, os
>>>>>>> b691e1a (setup html embed js module import)

auth_bp = Blueprint("auth", __name__)
auth0 = None 

@auth_bp.route("/signup")
def signup():
    return auth_bp.auth0.authorize_redirect(
        redirect_uri=url_for("auth.callback", _external=True),
        screen_hint="signup"
    )

@auth_bp.route("/login")
def login():
    return auth_bp.auth0.authorize_redirect(
        redirect_uri=url_for("auth.callback", _external=True)
    )

@auth_bp.route("/callback")
def callback():
    try:
        token = auth_bp.auth0.authorize_access_token()
        user_info = token.get("userinfo")
        session["user"] = user_info

        firebase_token = firebase_auth.create_custom_token(user_info['sub'])

        user_data = {
            'name': user_info.get('name'),
            'email': user_info.get('email'),
            'auth0_id': re.sub(r'(auth0|github|google-oauth-2)\|', '', user_info['sub']).strip(),
            'created_at': datetime.now(),
            'last_login': datetime.now()
        }

        db = firestore.client()
        db.collection('users').document(user_info['sub']).set(user_data, merge=True)
        
        return jsonify({
            'message': 'Login successful',
            'firebase_token': firebase_token.decode('utf-8'),
            'user_info': user_info
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route("/dashboard")
def dashboard():
    user_info = session.get("user")
    if not user_info:
        return redirect(url_for("auth.login"))
    return jsonify(user_info)

@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect(
        f'https://{os.getenv("AUTH0_DOMAIN")}/v2/logout?'
        f'returnTo={url_for("auth.login", _external=True)}'
    )
