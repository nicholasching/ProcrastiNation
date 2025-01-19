const { contextBridge, ipcRenderer } = require("electron");
const getWindows = require("get-windows");

// Make sure this runs before anything else
contextBridge.exposeInMainWorld("windowTracker", {
  getWindows: async () => {
    try {
      return await getWindows();
    } catch (error) {
      console.error("Error getting windows:", error);
      return [];
    }
  },
});

contextBridge.exposeInMainWorld("electronAPI", {
  login: () => ipcRenderer.invoke("auth:login"),
  // Add other auth methods as needed
});

// Add localStorage access
contextBridge.exposeInMainWorld("storage", {
  setItem: (key, value) => ipcRenderer.invoke("storage:set", key, value),
  getItem: (key) => ipcRenderer.invoke("storage:get", key),
});
