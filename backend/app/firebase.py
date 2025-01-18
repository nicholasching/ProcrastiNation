import firebase_admin
from firebase_admin import credentials, firestore, storage

def firebase_init(app):
    cred = credentials.Certificate(app.config['FIREBASE_ADMIN_CREDENTIALS'])
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'YOUR_PROJECT_ID.appspot.com',
    })
    app.firestore = firestore.client()
    app.storage = storage.bucket()
    
    # Create collections for activity and posts
    activity_ref = app.firestore.collection('activity')
    post_ref = app.firestore.collection('posts')