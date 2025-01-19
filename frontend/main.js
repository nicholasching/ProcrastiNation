import { app, BrowserWindow, ipcMain, screen } from "electron";
import { shell } from 'electron';
import Store from 'electron-store';
import { auth0Config } from "./auth/config.js"
import sessionTracker from './tracker.js'

let mainWindow;
let booWindow;
let notifWindow;
let minimizedTime = null;

const store = new Store({
  name: 'auth',
  defaults: {
    userId: null,
    userName: null
  }
});

const API_URL = 'http://localhost:5000'; 

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  checkAuth();
}

function checkAuth() {
  store.clear(); 
  shell.openExternal(`${API_URL}/auth/login`);
  if (mainWindow) {
    mainWindow.hide();
  }
}

ipcMain.on('auth-callback', (event, data) => {
  const { user_info } = data;
  store.set('userId', user_info.sub);
  store.set('userName', user_info.name);
  
  if (mainWindow) {
    mainWindow.show();
    mainWindow.webContents.send('user-data', {
      id: user_info.sub,
      name: user_info.name
    });
  }
});

ipcMain.on('logout', () => {
  store.clear();
  shell.openExternal(`${API_URL}/auth/logout`);
  if (mainWindow) {
    mainWindow.hide();
  }
});

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

function createNotifWindow(){
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  notifWindow = new BrowserWindow({
    width: width/4,
    height: height/1.5,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    transparent: true,
    hasShadow: false,
    show: false,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    },
  });
  notifWindow.loadFile("notif.html");

  notifWindow.once('ready-to-show', () => {
      notifWindow.show();
  });

  notifWindow.on('closed', () => {
      notifWindow = null; // Clear reference to boo window when it's closed
  })
}

function checkMinimize() {
  if (mainWindow?.isMinimized()) {
    if (!minimizedTime) {
      minimizedTime = Date.now();
    }
    if (Date.now() - minimizedTime >= 3000 && !booWindow) {
      createBooWindow();
      createNotifWindow();
    }
  } else {
    minimizedTime = null;
  }
}

app.whenReady().then(createMainWindow);


ipcMain.on('auth-success', (event, token) => {
  if (authWindow) {
    authWindow.close();
  }
  if (mainWindow) {
    mainWindow.show();
  }
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