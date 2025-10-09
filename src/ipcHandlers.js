import { ipcMain } from 'electron';
import os from 'node-os-utils';
// The path below has been corrected to go up one directory level
import { detectSteamGames } from '../scripts/steam-detect.js';

// This variable will hold our repeating timer for sending metrics
let metricsInterval;

/**
 * Starts a timer that fetches CPU and RAM usage every 2 seconds
 * and sends it to the renderer process (your React UI).
 * @param {BrowserWindow} mainWindow - The main application window to send messages to.
 */
function startSendingMetrics(mainWindow) {
  // Clear any existing timer to prevent duplicates
  if (metricsInterval) clearInterval(metricsInterval);

  metricsInterval = setInterval(async () => {
    try {
      const cpuUsage = await os.cpu.usage();
      const memInfo = await os.mem.info();
      
      const metrics = {
        cpu: cpuUsage.toFixed(1),
        ram: {
          total: (memInfo.totalMemMb / 1024).toFixed(2),
          used: ((memInfo.totalMemMb - memInfo.freeMemMb) / 1024).toFixed(2),
        }
      };
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('system-metrics-update', metrics);
      }
    } catch (error) {
      console.error('Failed to get system metrics:', error);
    }
  }, 2000);
}

/**
 * Stops the timer that sends system metrics.
 */
function stopSendingMetrics() {
  if (metricsInterval) clearInterval(metricsInterval);
  metricsInterval = null;
}

/**
 * Sets up all the backend event listeners for the application.
 * @param {IpcMain} ipcMain - The ipcMain object from Electron.
 * @param {BrowserWindow} mainWindow - The main application window.
 */
export function setupIpcHandlers(ipcMain, mainWindow) {
  startSendingMetrics(mainWindow);

  ipcMain.handle('scan-steam-games', async () => {
    try {
      return await detectSteamGames();
    } catch (error) {
      console.error("Error detecting steam games:", error);
      return [];
    }
  });
  
  // Make sure to stop the metrics timer when the application window is closed
  mainWindow.on('closed', stopSendingMetrics);
}

