const BASE_URL = "127.0.0.1:5000";
// Uses Auth0 to authenticate users, return something
export const authenticateUser = async () => {
  const response = await fetch(`http://${BASE_URL}/auth/login`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  console.log(data.message);
  return {
    name: data.user_info.name,
    userId: data.user_info.sub,
  };
};

// Retreives data from firebase
export const getUserActivity = async () => {
  const response = await fetch(
    `http://${BASE_URL}/firebase/activity/${userId}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  console.log(data);
  return activityData;
};

export const getAIRoast = async (userId, friend, app) => {
  const response = await fetch(
    `http://${BASE_URL}/notification/generate-notification`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        friend_name: friend,
        app: app,
      }),
    }
  );

  const data = await response.json();
  console.log(data);
  return data;
};
