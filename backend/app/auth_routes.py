from flask import Blueprint, request, redirect, session, url_for, jsonify
from authlib.integrations.flask_client import OAuth
import os

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login")
def login():
    redirect_uri = url_for("auth.callback", _external=True)
    return auth_bp.auth0.authorize_redirect(redirect_uri=redirect_uri)

@auth_bp.route("/callback")
def callback():
    token = auth_bp.auth0.authorize_access_token()
    session["user"] = token.get("userinfo")
    return redirect("/auth/dashboard")

@auth_bp.route("/dashboard")
def dashboard():
    user_info = session.get("user")
    if not user_info:
        return redirect(url_for("auth.login"))
    return jsonify(user_info)

@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect(f'https://{os.getenv("AUTH0_DOMAIN")}/v2/logout?returnTo={url_for("auth.login", _external=True)}')