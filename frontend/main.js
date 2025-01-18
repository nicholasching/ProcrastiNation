import { app, BrowserWindow, ipcMain } from "electron";
import { playAudioFile } from 'audic';
import SessionTracker from "./tracker.js";
let sessionTracker = new SessionTracker();

let mainWindow;
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

ipcMain.on("nick-button", async () => {
  await playAudioFile('audio/test.mp3');
  console.log("Run")
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

  