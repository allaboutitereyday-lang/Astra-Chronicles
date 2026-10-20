const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");

const isDev = !app.isPackaged && process.env.NODE_ENV !== "production";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    title: "Astra Chronicles",
    backgroundColor: "#09090b",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Open external links in default OS browser rather than inside Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (isDev) {
    // Development mode: Connect to local Next.js dev server
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    // Production mode: Load the exported static Next.js build
    const indexPath = path.join(__dirname, "../out/index.html");
    mainWindow.loadFile(indexPath).catch((err) => {
      console.error("Failed to load local HTML entry:", err);
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

