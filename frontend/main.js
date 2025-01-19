import { app, BrowserWindow, ipcMain, screen } from "electron";
import { getAIRoast, authenticateUser, getUserActivity } from "./api.js";
import { playAudioFile } from "audic";
import Store from "electron-store";
const store = new Store();
import WebSocketService from "./websocket.js";

let mainWindow;
let booWindow = null;
let notifWindow;
let minimizedTime = null; // Track when the main window was minimized
let booTimeout = null; // Store the timeout ID

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
      nodeIntegration: true,
      contextIsolation: false,
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
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  notifWindow.setIgnoreMouseEvents(false);
  await notifWindow.loadFile("notif.html");

  // Wait for AI data to be fetched
  const data = await getAIRoast(store.get("user_id"), "chi", "instagram");

  // Show the notification window after it's ready
  notifWindow.once("ready-to-show", () => {
    notifWindow.webContents.send("notification-data", data);
    notifWindow.show();
  });

  // Play the audio file (adjust based on your data)
  await playAudioFile("audio/test.mp3");
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

function checkMinimize() {
  if (mainWindow?.isMinimized()) {
    if (!minimizedTime) {
      minimizedTime = Date.now();
    }
    //Check if minimized for 3 seconds, if so make the boo window
    if (Date.now() - minimizedTime >= 3000 && !booWindow) {
      createBooWindow();
      createNotifWindow();
    }
  } else {
    minimizedTime = null;
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
      nodeIntegration: true,
      contextIsolation: false,
    },
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

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"), // Load preload script
        contextIsolation: true, // Recommended for security
        enableRemoteModule: false, // Disable remote module
        nodeIntegration: false, // Prevent direct Node.js access in renderer
      },
    });

    // const res = authenticateUser();
    store.set("user_id", res.userId);
    store.set("name", res.name);

    const activityData = getUserActivity();
    store.get("activityData", activityData);

    mainWindow.loadFile("index.html");
  }
});
