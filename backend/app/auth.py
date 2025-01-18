from flask_oauthlib.client import OAuth
from flask import session, redirect, url_for, request

oauth = OAuth()

def oauth_init(app):
    google = oauth.remote_app(
        'google',
        consumer_key=app.config['OAUTH_CLIENT_ID'],
        consumer_secret=app.config['OAUTH_CLIENT_SECRET'],
        request_token_params={
            'scope': 'email',
        },
        base_url='https://www.googleapis.com/oauth2/v1/',
        request_token_url=None,
        access_token_method='POST',
        access_token_url='https://accounts.google.com/o/oauth2/token',
        authorize_url='https://accounts.google.com/o/oauth2/auth',
    )
    
    @app.route('/login')
    def login():
        return google.authorize(callback=url_for('authorized', _external=True))

    @app.route('/logout')
    def logout():
        session.pop('google_token')
        return redirect(url_for('index'))

    @app.route('/login/authorized')
    def authorized():
        response = google.authorized_response()
        if response is None or response.get('access_token') is None:
            return 'Access denied: reason={} error={}'.format(
                request.args['error_reason'],
                request.args['error_description']
            )

        session['google_token'] = (response['access_token'], '')
        return redirect(url_for('index'))
    
    @app.route('/')
    def index():
        if 'google_token' in session:
            user_info = google.get('userinfo')
            return f'Logged in as: {user_info.data["email"]}'
        return 'You are not logged in'