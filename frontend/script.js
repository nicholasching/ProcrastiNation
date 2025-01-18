const { ipcRenderer } = require("electron");

document.getElementById("start-session").addEventListener("click", () => {
  console.log("Start Session button clicked!");
  ipcRenderer.send("start-session"); // Sends the "start-session" event to the main process.
});

document.getElementById("end-session").addEventListener("click", () => {
    console.log("End Session button clicked!");
    ipcRenderer.send("end-session"); // Sends the "end-session" event to the main process.
});
