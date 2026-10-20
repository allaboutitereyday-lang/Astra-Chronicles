const { contextBridge, ipcRenderer } = require("electron");

// Expose safe, isolated APIs to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  isDesktop: true,
  platform: process.platform,
  version: process.env.npm_package_version || "1.0.0",
  send: (channel, data) => {
    const validChannels = ["app-action", "to-main"];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = ["from-main", "app-status"];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});

