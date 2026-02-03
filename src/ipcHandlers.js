import { app } from 'electron';
import os from 'node-os-utils';
import path from 'node:path';
import fs from 'node:fs';

import { detectSteamGames } from '../scripts/steam-detect.js';
import { extractIcon } from '../scripts/extract-icons.js';

import find from 'find-process';
import pUsage from 'pidusage';

let metricsInterval = null;
let monitoringInterval = null;

function startSendingMetrics(mainWindow) {
  if (metricsInterval) clearInterval(metricsInterval);

  metricsInterval = setInterval(async () => {
    try {
      const cpuUsage = await os.cpu.usage();
      const memInfo = await os.mem.info();
      const metrics = {
        cpu: cpuUsage,                 // number
        mem: memInfo.usedMemPercentage // number
      };

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('system-metrics-update', metrics);
      }
    } catch {
      // metrics polling must never kill the app
    }
  }, 2000);
}

function stopSendingMetrics() {
  if (metricsInterval) clearInterval(metricsInterval);
  metricsInterval = null;
}

function getIconCacheDir() {
  const dir = path.join(app.getPath('userData'), 'icons');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function fileToDataUrlPng(p) {
  try {
    const buf = fs.readFileSync(p);
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export function setupIpcHandlers(ipcMain, mainWindow) {
  startSendingMetrics(mainWindow);

  ipcMain.handle('scan-steam-games', async () => {
    try {
      return await detectSteamGames();
    } catch (error) {
      console.error('Error detecting steam games:', error);
      return [];
    }
  });

  // NEW: return icon as a data URL so renderer can display it in dev mode
  ipcMain.handle('get-game-icon-dataurl', async (_event, game) => {
    try {
      if (!game?.executable) return null;
      if (process.platform !== 'win32') return null;

      const cacheDir = getIconCacheDir();
      const safeName = (game.appId || game.installdir || path.basename(game.executable))
        .toString()
        .replace(/[^a-z0-9_\-\.]/gi, '_');

      const outPng = path.join(cacheDir, `${safeName}.png`);

      if (!fs.existsSync(outPng)) {
        const ok = await extractIcon(game.executable, outPng);
        if (!ok) return null;
      }

      return fileToDataUrlPng(outPng);
    } catch (e) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('log-update', `[ERROR] Icon extract failed: ${e.message}`);
      }
      return null;
    }
  });

  ipcMain.on('start-monitoring', async (_event, game) => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }

    const exe = game?.executable;
    if (!exe) {
      const msg = `[ERROR] No executable detected for ${game?.name || 'Unknown game'}. Cannot monitor.`;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('log-update', msg);
        mainWindow.webContents.send('monitoring-stopped');
      }
      return;
    }

    const processName = exe.split('\\').pop().split('/').pop();

    try {
      const processes = await find('name', processName, true);

      if (processes.length === 0) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('log-update', `[ERROR] Could not find running process for ${game.name}.`);
        }
        return;
      }

      const gamePid = processes[0].pid;

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('log-update', `[INFO] Monitoring started for ${game.name} (PID: ${gamePid}).`);
      }

      monitoringInterval = setInterval(async () => {
        try {
          const stats = await pUsage(gamePid);
          const cpu = stats.cpu;
          const memoryMB = stats.memory / 1024 / 1024;

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(
              'log-update',
              `[METRICS] ${game.name} CPU: ${cpu.toFixed(1)}% | RAM: ${memoryMB.toFixed(0)} MB`
            );
          }
        } catch {
          if (monitoringInterval) {
            clearInterval(monitoringInterval);
            monitoringInterval = null;
          }
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('log-update', `[INFO] Game process ended for ${game.name}. Monitoring stopped.`);
            mainWindow.webContents.send('monitoring-stopped');
          }
        }
      }, 3000);
    } catch (error) {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('log-update', `[ERROR] Monitoring failed: ${error.message}`);
      }
    }
  });

  ipcMain.on('stop-monitoring', () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('log-update', '[INFO] Monitoring stopped by user.');
      mainWindow.webContents.send('monitoring-stopped');
    }
  });

  mainWindow.on('closed', stopSendingMetrics);
}
