import { app, BrowserWindow, ipcMain, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupIpcHandlers } from './ipcHandlers.js';
import electronSquirrelStartup from 'electron-squirrel-startup';

if (electronSquirrelStartup) {
  app.quit();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helps Windows taskbar grouping + icon behaviour
try {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.crashwatchdog.app');
  }
} catch {}

const createWindow = () => {
  // Use logo.png (exists) instead of icon.png (doesn't)
  const iconPath = path.join(__dirname, '..', 'logo.png');

  let appIcon = null;
  try {
    appIcon = nativeImage.createFromPath(iconPath);
  } catch (e) {
    console.error("Failed to load application icon from path:", iconPath, e);
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    ...(appIcon && { icon: appIcon }),
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.webContents.openDevTools();
  setupIpcHandlers(ipcMain, mainWindow);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
