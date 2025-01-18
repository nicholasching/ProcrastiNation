import { app, BrowserWindow, ipcMain, screen } from "electron";
import SessionTracker from "./tracker.js";
import WebSocketService from './websocket.js';

let sessionTracker = new SessionTracker();
let mainWindow;
let intervalId = null;
let booWindow = null;
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

  booWindow.once('ready-to-show', () => {
      booWindow.show();
  });

  booWindow.on('closed', () => {
      booWindow = null; // Clear reference to boo window when it's closed
  })
}

function checkMinimize() {
  if (mainWindow && mainWindow.isMinimized()) {
    if (!minimizedTime) {
      minimizedTime = Date.now();
    }
      //Check if minimized for 3 seconds, if so make the boo window
    if (Date.now() - minimizedTime >= 3000 && !booWindow) {
      createBooWindow();

    }
  } else {
      minimizedTime = null;
      if (booTimeout) clearTimeout(booTimeout)
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

// Listen for "start-session" from renderer process
ipcMain.on("start-session", () => {
  sessionTracker.startSession();
  // Generate checkpoints every 10 seconds
  // intervalId = setInterval(() => {
  //   sessionTracker.generateCheckpoint();
  // }, 10000);
});

// Listen for "end-session" from renderer process
ipcMain.on("end-session", () => {
  sessionTracker.endSession();
  const { activityLog, checkpoints } = sessionTracker.loadData();
  console.log("Final Activity Log:", activityLog);
  console.log("Final Checkpoints:", checkpoints);
  clearInterval(intervalId);
});

// Listen for "clear-session" from renderer process
ipcMain.on("clear-session", () => {
  sessionTracker.clearData();
  console.log("Data cleared!");
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
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    mainWindow.loadFile("index.html");
  }
});