document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Check if user is already logged in
    const existingUserId = localStorage.getItem("user_id");
    const existingName = localStorage.getItem("name");

    if (existingUserId && existingName) {
      console.log("User already logged in:", {
        userId: existingUserId,
        name: existingName,
      });
      // Handle logged in state
      return;
    }

    // If no existing user, attempt login
    const userData = await window.electronAPI.login();

    // Store user data in localStorage
    localStorage.setItem("user_id", userData.userId);
    localStorage.setItem("name", userData.name);

    console.log("Successfully logged in:", userData);
    // Update your UI or handle successful login
  } catch (error) {
    console.error("Authentication error:", error);
    // Handle errors
  }
});
