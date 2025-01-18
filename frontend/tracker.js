import Store from "electron-store";
import { activeWindow } from "get-windows";
const store = new Store();

// Mock function to check if the app is productive
function isProductive(appName) {
  const productiveApps = ["Code", "Terminal", "Google Chrome"];
  return productiveApps.includes(appName);
}

class SessionTracker {
  constructor() {
    // auto loads the activity log and checkpoints from the store
    this.activityLog = store.get("activityLog", {});
    this.checkpoints = store.get("checkpoints", []);

    // Initialize session variables
    this.intervalId = null;
    this.previousApp = null;
    this.sessionStartTime = null;
    this.activeTime = 0;
    this.maxDowntime = 0;
    this.unproductiveDurations = 0;
    this.currentDowntime = 0;
  }

  // Function to start tracking
  startSession() {
    if (this.intervalId !== null) {
      console.log("Session is already running!");
      return;
    }

    console.log("Session started...");

    this.sessionStartTime = Date.now();
    this.intervalId = setInterval(async () => {
      const result = await activeWindow();
      if (!result) return;

      const currentApp = result.owner.name;

      // Update activity log
      if (this.previousApp && this.previousApp !== currentApp) {
        // Tab switch detected
        console.log(`Switched from ${this.previousApp} to ${currentApp}`);
        this.generateCheckpoint();
        this.currentDowntime = 0; // Reset downtime on switch
      }

      if (isProductive(currentApp)) {
        this.activeTime++; // Increment productive time
      } else {
        this.currentDowntime++;
        if (this.currentDowntime > this.maxDowntime) {
          this.maxDowntime = this.currentDowntime;
        }
        this.unproductiveDurations++;
      }

      this.activityLog[currentApp] = (this.activityLog[currentApp] || 0) + 1;
      this.previousApp = currentApp;
    }, 1000);
  }

  // Function to generate a checkpoint
  generateCheckpoint() {
    const checkpoint = {
      timestamp: new Date(),
      activeTime: this.activeTime,
      maxDowntime: this.maxDowntime,
      unproductiveDurations: this.unproductiveDurations,
    };

    this.checkpoints.push(checkpoint);
    console.log("Checkpoint created:", checkpoint);

    // Reset session metrics
    // this.activeTime = 0;
    // this.maxDowntime = 0;
    // this.unproductiveDurations = 0;

    // Save data
    this.saveData();
  }

  // Function to end the session
  endSession() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Session ended.");
      console.log("Final Activity Log:", this.activityLog);
      console.log("Final Checkpoints:", this.checkpoints);

      // Save data
      this.saveData();
    } else {
      console.log("No active session to stop!");
    }
  }

  // Function to save data
  saveData() {
    store.set("activityLog", this.activityLog);
    store.set("checkpoints", this.checkpoints);
  }

  // Function to load data
  loadData() {
    return {
      activityLog: this.activityLog,
      checkpoints: this.checkpoints,
    };
  }
}

export default SessionTracker;
