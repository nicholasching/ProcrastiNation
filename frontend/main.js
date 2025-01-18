import { app, BrowserWindow, ipcMain } from "electron";
import SessionTracker from "./tracker.js";
import WebSocketService from './websocket.js';

let sessionTracker = new SessionTracker();

let mainWindow;
let wsService;
let intervalId = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // For simplicity
      contextIsolation: false, // Allow direct communication with ipcRenderer
    },
  });

  mainWindow.loadFile("index.html");
});

wsService = new WebSocketService();

// Listen for "start-session" from renderer process
ipcMain.on("start-session", () => {
  sessionTracker.startSession();
  // Generate checkpoints every 10 seconds
  // intervalId = setInterval(() => {
  //   sessionTracker.generateCheckpoint();
  // }, 100000);
});

// Listen for "end-session" from renderer process
ipcMain.on("end-session", () => {
  sessionTracker.endSession();
  const {activityLog, checkpoints} = sessionTracker.loadData();
  console.log("Final Activity Log:", activityLog); 
  console.log("Final Checkpoints:", checkpoints);
  clearInterval(intervalId);
});

// Listen for "clear-session" from renderer process
ipcMain.on("clear-session", () => {
  sessionTracker.clearData();
  console.log("Data cleared!");
});

ipcMain.on("checkpoint-update", (event, checkpoint) => {
  wsService.updateCheckpoint(checkpoint);
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

  