import { app, BrowserWindow, ipcMain, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupIpcHandlers } from './ipcHandlers.js';
// This correctly imports the package for an ES Module project
import electronSquirrelStartup from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (electronSquirrelStartup) {
  app.quit();
}

// This correctly defines __dirname in an ES Module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWindow = () => {
  // --- ICON LOGIC ---
  // The path needs to go up one level from `src` to the project root
  const iconPath = path.join(__dirname, '..', 'icon.png');
  let appIcon = null;
  try {
    appIcon = nativeImage.createFromPath(iconPath);
  } catch (e) {
    console.error("Failed to load application icon:", e);
  }
  // ------------------

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

  // --- CORRECT URL LOADING LOGIC ---
  // MAIN_WINDOW_VITE_DEV_SERVER_URL is an environment variable that Electron Forge
  // provides automatically during development. It will be undefined in production.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // This is the correct path for the production build
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
  // ------------------------------------

  // Open the DevTools automatically for easy debugging.
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
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});