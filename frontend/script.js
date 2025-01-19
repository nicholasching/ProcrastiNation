import SessionTracker from "./tracker.js";

function sendRequest(endpoint, data) {
  return fetch(`http://localhost:5000/redis/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then((res) => {
    if (res.ok) {
      console.log(`${endpoint.replace("_", " ")} successfully!`);
    } else {
      console.error(`Failed to ${endpoint.replace("_", " ")}!`);
    }
  });
}

function startSession(sessionId) {
  return sendRequest("start_session", { session_id: sessionId });
}

function joinSession(userId, sessionId) {
  return sendRequest("join_session", {
      user_id: userId,
      session_id: sessionId,
  }).then(() => {
      const tracker = new SessionTracker(sessionId, userId);
      tracker.startSession();
      
      initializeChat(userId, sessionId);
      
      setInterval(() => {
          tracker.generateCheckpoint();
          const { activityLog, checkpoints } = tracker.loadData();
          updateSession(userId, sessionId, checkpoints);
      }, 1000);
  });
}

function updateSession(userId, sessionId, checkpoint) {
  return sendRequest("update_session", {
    user_id: userId,
    session_id: sessionId,
    checkpoint: checkpoint,
  });
}

// this exits the session and stops tracking
function logoutSession(userId, sessionId) {
  tracker.endSession();
  return sendRequest("logout_user", { user_id: userId, session_id: sessionId });
}

// this ends the session (removes it from Redis backend)
function endSession(sessionId) {
  tracker.endSession();
  tracker.clearData();
  return sendRequest("end_session", { session_id: sessionId });
}

function fetchActiveSessions() {
  return fetch("http://localhost:5000/redis/get_active_sessions")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      console.log("Active Sessions:", data);

      const sessionListContainer = document.querySelector(
        ".session-list-container"
      );

      // Ensure the container exists in the DOM
      if (!sessionListContainer) {
        console.error("Session list container not found in the DOM.");
        return;
      }

      sessionListContainer.innerHTML = ""; // Clear existing sessions

      // Loop through the sessions array
      data.sessions.forEach((sessionId) => {
        const sessionDiv = document.createElement("div");
        sessionDiv.textContent = `Session ID: ${sessionId}`;
        sessionListContainer.appendChild(sessionDiv);
      });

      return data.sessions; // Return sessions for further use if needed
    })
    .catch((error) => {
      console.error("Error fetching active sessions:", error);
    });
}

document.getElementById("createText").addEventListener("click", () => {
  const sessionId = document.getElementById("input").value;
  if (sessionId) {
    startSession(sessionId).then(() => fetchActiveSessions());
  }
});

document.getElementById("joinText").addEventListener("click", () => {
  const userId = store.get("user_id");
  const sessionId = document.getElementById("input").value;
  if (userId && sessionId) {
    joinSession(userId, sessionId).then(() => fetchActiveSessions());
  }
});

document.getElementById("leaveText").addEventListener("click", () => {
  const userId = store.get("user_id");
  const sessionId = document.getElementById("input").value;
  if (userId && sessionId) {
    logoutSession(userId, sessionId).then(() => fetchActiveSessions());
  }
});

document.getElementById('sendMessageBtn')?.addEventListener('click', () => {
  const messageInput = document.getElementById('messageInput');
  broadcastMessage(messageInput.value);
  messageInput.value = ''; 
});

setInterval(fetchActiveSessions, 1000);

const socket = io('http://localhost:5000', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});
socket.on('connect', () => {
    console.log('Connected to Socket.IO server!');
});

socket.on('connect_error', (error) => {
    console.log('Socket.IO connection error:', error);
});

socket.on('session_message', (data) => {
    console.log('Received message:', data);
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML += `<p>${data.user_id}: ${data.message}</p>`;
});

function broadcastMessage(message) {
    const userId = "chi"
    const sessionId = document.getElementById("input").value;  
    
    socket.emit('broadcast_message', {
        session_id: sessionId,
        user_id: userId,
        message: message
    });
}

async function getCurrentSession(userId, sessionId) {
    return fetch(`http://localhost:5000/redis/get_session?user_id=${userId}&session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
            console.log('Got session data:', data);
            return data.user_data;
        });
}

socket.on('session_message', (data) => {
  console.log('Received message:', data);
  const messagesDiv = document.getElementById('messages');
  messagesDiv.innerHTML += `<p>${data.user_id}: ${data.message}</p>`;
  // Auto-scroll to bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  const sessionId = document.getElementById("input").value;
  const userId = store.get("user_id");

  if (!sessionId) {
      console.error('No session ID found');
      return;
  }

  if (!userId) {
      console.error('No user ID found');
      return;
  }

  if (message) {
      console.log('Sending message:', {
          session_id: sessionId,
          user_id: userId,
          message: message
      });

      socket.emit('broadcast_message', {
          session_id: sessionId,
          user_id: userId,
          message: message
      }, (response) => {
          // Handle acknowledgment
          if (response && response.status === 'sent') {
              console.log('Message sent successfully');
              messageInput.value = '';
          } else {
              console.error('Failed to send message:', response);
          }
      });
  }
}

function initializeChat(userId, sessionId) {
  socket.emit('join', { session_id: sessionId });
  
  loadExistingMessages(sessionId);
  
  // Set up message sending
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendMessageBtn');
  const messagesDiv = document.getElementById('messages');
  
  if (sendButton) {
      sendButton.addEventListener('click', () => {
          const message = messageInput.value.trim();
          if (message) {
              sendMessage(userId, sessionId, message);
              messageInput.value = '';
          }
      });
  }
  
  if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
              const message = messageInput.value.trim();
              if (message) {
                  sendMessage(userId, sessionId, message);
                  messageInput.value = '';
              }
          }
      });
  }
  
  // Update the socket.io message handler
  socket.on('session_message', (data) => {
      if (messagesDiv) {
          const messageElement = document.createElement('div');
          messageElement.className = 'message-item';
          messageElement.innerHTML = `
              <span class="message-user">${data.user_id}</span>
              <span class="message-text">${data.message}</span>
              <span class="message-time">${new Date(data.timestamp).toLocaleTimeString()}</span>
          `;
          messagesDiv.appendChild(messageElement);
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
  });
}

async function loadExistingMessages(sessionId) {
  try {
      const response = await fetch(`http://localhost:5000/redis/get_messages?session_id=${sessionId}`);
      const data = await response.json();
      console.log("Messages:" (data));
      
      if (data.messages) {
          const messagesDiv = document.getElementById('messages');
          data.messages.forEach(msg => {
              const messageElement = document.createElement('div');
              messageElement.className = 'message-item';
              messageElement.innerHTML = `
                  <span class="message-user">${msg.user_id}</span>
                  <span class="message-text">${msg.message}</span>
                  <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
              `;
              messagesDiv.appendChild(messageElement);
          });
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
  } catch (error) {
      console.error('Error loading messages:', error);
  }
}