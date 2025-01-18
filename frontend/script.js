const { ipcRenderer } = require("electron");

document.getElementById("nicksButton").addEventListener("click", () => {
  console.log("Nick button clicked!");
  ipcRenderer.send("nick-button");
});

document.getElementById("start-session").addEventListener("click", () => {
  console.log("Start Session button clicked!");
  ipcRenderer.send("start-session"); // Sends the "start-session" event to the main process.
});

document.getElementById("end-session").addEventListener("click", () => {
    console.log("End Session button clicked!");
    ipcRenderer.send("end-session"); // Sends the "end-session" event to the main process.
});

document.getElementById("clear-session").addEventListener("click", () => {
    console.log("Clear Data button clicked!");
    ipcRenderer.send("clear-session"); // Sends the "clear-data" event to the main process.
});
