from flask_socketio import SocketIO, emit

socketio = SocketIO()

def send_real_time_updates():
    emit('new_activity', {'data': 'New activity posted!'}, broadcast=True)

def setup_socketio_events(app):
    @app.route('/send_activity', methods=['POST'])
    def send_activity():
        socketio.emit('new_activity', {'message': 'A new activity update!'})
        return 'Activity sent!', 200