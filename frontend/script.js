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
  });
}

function updateSession(userId, sessionId, checkpoint) {
  return sendRequest("update_session", {
    user_id: userId,
    session_id: sessionId,
    checkpoint: checkpoint,
  });
}

function logoutSession(userId, sessionId) {
  return sendRequest("logout_user", { user_id: userId, session_id: sessionId });
}

function endSession(sessionId) {
  return sendRequest("end_session", { session_id: sessionId });
}

function getActiveSessions() {
  return fetch("http://localhost:5000/redis/get_active_sessions").then((res) =>
    res.json()
  );
}
