import { app, BrowserWindow, ipcMain } from "electron";
import { startSession, endSession } from "./monitor.js";

let mainWindow;

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
  startSession();
});

// Listen for "end-session" from renderer process
ipcMain.on("end-session", () => {
  endSession();
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

  