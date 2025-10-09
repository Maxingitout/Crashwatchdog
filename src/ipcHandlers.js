import { ipcMain } from 'electron';
import os from 'node-os-utils';
import { detectSteamGames } from '../scripts/steam-detect.js';
import find from 'find-process';
import pUsage from 'pidusage';

// These variables hold our repeating timers
let metricsInterval;
let monitoringInterval;

function startSendingMetrics(mainWindow) {
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

function stopSendingMetrics() {
    if (metricsInterval) clearInterval(metricsInterval);
    metricsInterval = null;
}

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

    ipcMain.on('start-monitoring', async (event, game) => {
        if (monitoringInterval) clearInterval(monitoringInterval);
        
        // Extract the executable name from the full path
        const processName = game.executable.split('\\').pop().split('/').pop();
        
        try {
            const processes = await find('name', processName, true);

            if (processes.length === 0) {
                const logMsg = `[ERROR] Could not find running process for ${game.name}.`;
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('log-update', logMsg);
                }
                return;
            }

            const gamePid = processes[0].pid;
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('log-update', `[INFO] Started monitoring ${game.name} (PID: ${gamePid})`);
            }
            
            let hangCounter = 0;
            const HANG_THRESHOLD = 5; // 5 checks * 2000ms interval = 10 seconds of low CPU

            monitoringInterval = setInterval(async () => {
                try {
                    const stats = await pUsage(gamePid);

                    // --- NEW HANG DETECTION LOGIC ---
                    if (stats.cpu < 1.0) {
                        hangCounter++;
                    } else {
                        hangCounter = 0; // Reset counter if CPU shows activity
                    }

                    if (hangCounter >= HANG_THRESHOLD) {
                        const hangMsg = `[HANG] Process ${game.name} (PID: ${gamePid}) appears to be unresponsive.`;
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send('log-update', hangMsg);
                            mainWindow.webContents.send('monitoring-hanged'); // New event for the UI
                        }
                        clearInterval(monitoringInterval);
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.webContents.send('monitoring-stopped');
                        }
                        return; // Stop further checks
                    }
                    // --- END HANG DETECTION LOGIC ---

                } catch (error) {
                    // This error means the process doesn't exist anymore (crashed or closed)
                    const crashMsg = `[CRASH] Process ${game.name} (PID: ${gamePid}) is no longer running.`;
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('log-update', crashMsg);
                    }
                    clearInterval(monitoringInterval);
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('monitoring-stopped');
                    }
                }
            }, 2000);
        } catch (err) {
            console.error('Error starting monitoring:', err);
            const errorMsg = `[ERROR] An unexpected error occurred while looking for the game process.`;
             if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('log-update', errorMsg);
            }
        }
    });

    ipcMain.on('stop-monitoring', () => {
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('log-update', '[INFO] Monitoring stopped by user.');
                mainWindow.webContents.send('monitoring-stopped');
            }
        }
    });

    mainWindow.on('closed', stopSendingMetrics);
}