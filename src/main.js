import { app, BrowserWindow, ipcMain, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupIpcHandlers } from './ipcHandlers.js';
import electronSquirrelStartup from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (electronSquirrelStartup) {
  app.quit();
}

// This correctly defines __dirname in an ES Module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWindow = () => {
  // --- NEW ICON LOGIC ---
  // Create a path to the icon.png file in the project's root directory
  const iconPath = path.join(__dirname, '..', 'icon.png');
  let appIcon = null;
  try {
    // Create a native image object from the file
    appIcon = nativeImage.createFromPath(iconPath);
  } catch (e) {
    console.error("Failed to load application icon from path:", iconPath, e);
  }
  // --------------------

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    // Set the icon for the window and taskbar
    ...(appIcon && { icon: appIcon }),
  });

  // Load the app's URL from the Vite development server
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // Or load the production build file
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools automatically.
  mainWindow.webContents.openDevTools();

  // Set up all our backend event listeners
  setupIpcHandlers(ipcMain, mainWindow);
};

// This method will be called when Electron has finished initialization.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X, re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});