// import { io } from 'socket.io-client';

function isProductive(result) {
  // Mock function to check if the app is productive
  const productiveApps = [
    "Code",
    "Terminal",
    "Firefox",
    "Notion",
    "Slack",
    "Trello",
    "Asana",
    "Microsoft Teams",
    "Zoom",
    "Discord",
    "Stack Overflow",
    "Medium",
    "Wikipedia",
    "Microsoft Word",
    "Microsoft Excel",
    "Microsoft PowerPoint",
    "ChatGPT",
  ];

  // List of productive URLs (could be expanded)
  const productiveDomains = [
    /docs\.google\.com/,
    /github\.com/,
    /notion\.so/,
    /trello\.com/,
    /slack\.com/,
    /asana\.com/,
    /microsoft\.com/,
    /stackoverflow\.com/,
    /medium\.com/,
    /wikipedia\.org/,
  ];

  // Extract the app name and URL from the result
  const appName = result.owner.name; // Example: "Code", "Safari"
  const url = result.platform == "macos" ? result.url : result.title; // Example: "Personal - Instagram" (for web browsers)

  // Check if the app is in the productive apps list
  if (productiveApps.includes(appName)) {
    return true; // App or URL is considered productive
  }

  if (url && productiveApps.some((app) => url.includes(app))) {
    return true;
  }

  // Check if the URL belongs to a productive domain
  if (productiveDomains.some((pattern) => pattern.test(url))) {
    return true; // Website is considered productive
  }

  // Default assumption: Apps not matched in the lists are unproductive
  return false;
}

class SessionTracker {
  constructor(sessionId, userId) {
    // auto loads the activity log and checkpoints from the store
    this.activityLog = store.get("activityLog", {});
    this.checkpoints = store.get("checkpoints", []);

    // Initialize session variables
    this.intervalId = null;
    this.previousApp = null;
    this.previousUrl = null;
    this.sessionStartTime = null;
    this.activeTime = 0;
    this.maxDowntime = 0;
    this.unproductiveDurations = 0;
    this.currentDowntime = 0;
    this.currentProductive = false;
    this.prevProductive = false;

    // Add socket and session tracking
    // this.socket = io('http://localhost:5000');
    // this.sessionId = sessionId;
    // this.userId = userId;

    // // Productivity tracking
    // this.productiveStreak = 0;
    // this.productivityThreshold = 10; // 10sec
  }

  startSession() {
    if (this.intervalId !== null) {
      console.log("Session is already running!");
      return;
    }

    console.log("Session started...");
    this.sessionStartTime = Date.now();

    this.intervalId = setInterval(async () => {
      const result = window.windowAPI.getActiveWindow();
      if (!result) return;

      const currentApp = result.owner.name;
      this.currentProductive = isProductive(result);

      if (this.currentProductive) {
        this.productiveStreak++;
        this.activeTime++;

        // // Emit productivity update when threshold is reached
        // if (this.productiveStreak >= this.productivityThreshold) {
        //   this.socket.emit('productivity_update', {
        //     session_id: this.sessionId,
        //     user_id: this.userId,
        //     productive_time: this.productiveStreak,
        //     app_name: currentApp
        //   });
        //   // Reset streak after broadcasting
        //   this.productiveStreak = 0;
        // }
      } else {
        this.productiveStreak = 0;
        this.currentDowntime++;
        if (this.currentDowntime > this.maxDowntime) {
          this.maxDowntime = this.currentDowntime;
        }
      }

      this.currentProductive = isProductive(result);
      console.log(
        `Current app: ${currentApp}, URL: ${result.url}, Productive: ${this.currentProductive}`
      );

      // Update activity log
      if (this.previousApp && this.previousApp !== currentApp) {
        // App switch detected
        console.log(`Switched from ${this.previousApp} to ${currentApp}`);
        this.generateCheckpoint();
        this.currentDowntime = 0; // Reset downtime on switch
        // Check if user was distracted
        if (!this.currentProductive && this.prevProductive) {
          this.unproductiveDurations++;
        }
      } else if (this.previousApp === currentApp) {
        // Check for tab switch within the same app (e.g., browser tabs)
        const previousUrl = this.previousUrl || "";
        const currentUrl = result.title;

        if (previousUrl !== currentUrl) {
          console.log(
            `Switched from ${previousUrl} to ${currentUrl} within ${currentApp}`
          );
          this.generateCheckpoint();
          this.currentDowntime = 0; // Reset downtime on switch
          // Check if user was distracted
          if (!this.currentProductive && this.prevProductive) {
            this.unproductiveDurations++;
          }
        }

        this.previousUrl = currentUrl; // Update previous URL
      }

      if (this.currentProductive) {
        this.activeTime++; // Increment productive time
      } else {
        this.currentDowntime++;
        if (this.currentDowntime > this.maxDowntime) {
          this.maxDowntime = this.currentDowntime;
        }
      }

      this.activityLog[currentApp] = (this.activityLog[currentApp] || 0) + 1;
      this.previousApp = currentApp;
      this.prevProductive = this.currentProductive;
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

  // Function to reset data
  clearData() {
    this.activityLog = {};
    this.checkpoints = [];
    this.saveData();
  }
}

export default SessionTracker;
