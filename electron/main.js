import { app, BrowserWindow, protocol, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),

      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL('safe-file-protocol://index.html');


  mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["script-src 'self' 'unsafe-eval';"]
      }
    });
  });

  protocol.registerFileProtocol('safe-file-protocol', (request, callback) => {
    const url = request.url.replace('safe-file-protocol://', '');
    const filePath = path.join(__dirname, '../dist', url);
    callback({ path: filePath });
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});