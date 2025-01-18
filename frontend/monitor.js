import { activeWindow } from "get-windows";

let intervalId = null; // To keep track of the interval

// Function to start the session
function startSession() {
  if (intervalId !== null) {
    console.log("Session is already running!");
    return; // Prevent multiple intervals
  }

  monitorActiveWindow(); // Start monitoring the active window
}

// Function to stop the session
function endSession() {
  if (intervalId !== null) {
    clearInterval(intervalId); // Stop the interval
    intervalId = null; // Reset the reference
    console.log("Session ended.");
  } else {
    console.log("No active session to stop!");
  }
}

function monitorActiveWindow() {
  console.log("Session started. Monitoring active windows...");
  intervalId = setInterval(async () => {
    const result = await activeWindow();

    if (!result) {
      console.log("No active window found.");
      return;
    }

    if (result.platform === "macos") {
      // Among other fields, `result.owner.bundleId` is available on macOS.
      console.log(
        `Process title is ${result.title} with bundle id ${result.owner.bundleId}.`
      );
    } else if (result.platform === "windows") {
      console.log(
        `Process title is ${result.title} with path ${result.owner.path}.`
      );
    } else {
      console.log(
        `Process title is ${result.title} with path ${result.owner.path}.`
      );
    }
  }, 1000); // Logs every second
}

export { startSession, endSession };