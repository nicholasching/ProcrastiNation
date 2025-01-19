const { contextBridge } = require("electron");
const Store = require("electron-store");

const store = new Store();

// Expose `electron-store` methods to the renderer process
contextBridge.exposeInMainWorld("store", {
  get: (key) => store.get(key),
  set: (key, value) => store.set(key, value),
  delete: (key) => store.delete(key),
});
