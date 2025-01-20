import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "path";
import { getAIRoast, authenticateUser, getUserActivity } from "./api.js";
import { playAudioFile } from "audic";
import SessionTracker from "./tracker.js";
// import Store from "electron-store";
// const store = new Store();
import WebSocketService from "./websocket.js";

let mainWindow;
let booWindow = null;
let notifWindow;
let minimizedTime = null; // Track when the main window was minimized
let booTimeout = null; // Store the timeout ID

const tracker = new SessionTracker();
tracker.startSession();

function createBooWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  booWindow = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShaodw: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  booWindow.loadFile("glow.html");
  booWindow.setIgnoreMouseEvents(true);

  booWindow.once("ready-to-show", () => {
    booWindow.show();
  });

  booWindow.on("closed", () => {
    booWindow = null; // Clear reference to boo window when it's closed
  });
}

async function createNotifWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  notifWindow = new BrowserWindow({
    width: width / 4,
    height: height / 1.75,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  notifWindow.setIgnoreMouseEvents(false);
  await notifWindow.loadFile("notif.html");

  // Wait for AI data to be fetched
  // const data = await getAIRoast(store.get("user_id"), "chi", "instagram");

  // Show the notification window after it's ready
  notifWindow.show();

  // Play the audio file (adjust based on your data)
  await playAudioFile("audio/STH_FE.mp3");
  console.log("Played audio file");

  // Clear the reference to notifWindow when closed
  notifWindow.on("closed", () => {
    notifWindow = null;
  });
}

// Listen for the close button click from notif.html
ipcMain.on("close-notif-window", () => {
  if (notifWindow) {
    notifWindow.close();
    notifWindow = null;
  }
});

let downtime = 0;
function checkMinimize() {
  if (!tracker.currentProductive) {
    downtime += 1;
    if (!booWindow) {
        createBooWindow();
        
    }
  } else {
    downtime = 0;
  }

  if (downtime >= 3) {
    if(!notifWindow){
        createNotifWindow();
    }
  } else {
    if (booTimeout) clearTimeout(booTimeout);
  }
}

app.whenReady().then(() => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // For demo, directly load your backend auth URL
  mainWindow.loadURL("http://localhost:5000/auth/login");

  // Listen for navigation to your callback URL
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.includes("callback") || url.includes("dashboard")) {
      // User has been authenticated, load your app
      mainWindow.loadFile("index.html");

      // Fake storing user data for demo
      global.isAuthenticated = true;
      global.userData = {
        name: "Jet Chiang",
        email: "jetjiang.ez@gmail.com",
      };
    }
  });

  // Handle auth login
  ipcMain.handle("auth:login", async () => {
    try {
      return await authenticateUser();
    } catch (error) {
      throw error;
    }
  });

  mainWindow.loadFile("index.html");

  // Set up interval to check for minimize status
  setInterval(checkMinimize, 1000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("store-get", (event, key) => {
  return store.get(key);
});

ipcMain.handle("store-set", (event, key, value) => {
  store.set(key, value);
});

// Handle active window request
ipcMain.handle("get-active-window", async () => {
  return await getActiveWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
    });

    // const res = authenticateUser();
    // store.set("user_id", res.userId);
    // store.set("name", res.name);

    localStorage.setItem("user_id", "1");
    localStorage.setItem("name", "John Doe");

    const activityData = getUserActivity();
    store.get("activityData", activityData);

    // Handle auth login
    ipcMain.handle("auth:login", async () => {
      try {
        return await authenticateUser();
      } catch (error) {
        throw error;
      }
    });

    mainWindow.loadFile("index.html");
  }
});
