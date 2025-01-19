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
  console.log("This join metho is invoked");
  // send a request to the backend to join the session
  return sendRequest("join_session", {
    user_id: userId,
    session_id: sessionId,
  }).then(() => {
    // when a user joins a session, start tracking their activity
    const tracker = new SessionTracker(sessionId, userId);
    tracker.startSession();

    // periodically generate checkpoints and update the session
    setInterval(() => {
      tracker.generateCheckpoint();
      const { activityLog, checkpoints } = tracker.loadData();
      console.log("Activity Log:", activityLog);
      console.log("Checkpoints:", checkpoints);
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

setInterval(fetchActiveSessions, 1000);
