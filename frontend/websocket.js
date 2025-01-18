// websocket-service.js
import io from 'socket.io-client';

class WebSocketService {
    constructor() {
        this.socket = io('http://localhost:5000');
        
        // Set up checkpoint update listener
        this.socket.on('checkpoint_updated', (data) => {
            console.log('Checkpoint update received:', data.checkpoint);
        });
    }

    // Method to broadcast checkpoint updates
    updateCheckpoint(checkpoint) {
        this.socket.emit('checkpoint_update', { checkpoint });
    }
}

export default WebSocketService;