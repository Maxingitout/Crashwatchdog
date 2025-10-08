import { app, BrowserWindow, protocol, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module workaround for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      // These are the correct, secure settings for modern Electron apps
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Use the secure custom protocol to load your app's HTML
  mainWindow.loadURL('safe-file-protocol://index.html');

  // Open the DevTools automatically in development for easy debugging
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  // --- Fix for the Content-Security-Policy Warning ---
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["script-src 'self' 'unsafe-eval';"]
      }
    });
  });

  // --- Fix for loading local files securely ---
  protocol.registerFileProtocol('safe-file-protocol', (request, callback) => {
    const url = request.url.replace('safe-file-protocol://', '');
    const filePath = path.join(__dirname, '../dist', url);
    callback({ path: filePath });
  });

  // Create the main application window
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});