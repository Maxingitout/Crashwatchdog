import { ipcMain } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
// NOTE: Assuming your original steam-detect etc. were ES Modules.
// If they were .js files using require, they might need updating too.
import { detectSteamGames as findSteam } from '../scripts/steam-detect.js';
import { startMetrics as getSystemMetrics } from '../scripts/system-metrics.js';
import pUsage from 'pidusage';
import find from 'find-process';

let monitoringInterval;

export function setupIpcHandlers(mainWindow, logFilePath) {
    // Handler to scan for Steam games (keep your original implementation)
    ipcMain.handle('scan-steam-games', async () => {
        try {
            const steamPath = await findSteam();
            if (!steamPath) {
                console.log('Steam installation not found.');
                return [];
            }
            // ... (Your existing steam game scanning logic should be here)
            console.log('Your Steam scanning logic should be preserved here.');
            return []; // Placeholder return
        } catch (error) {
            console.error('Error scanning for Steam games:', error);
            return [];
        }
    });

    // Handler to start monitoring a process
    ipcMain.on('start-monitoring', async (event, { game }) => {
        try {
            const processName = path.basename(game.executable);
            const list = await find('name', processName, true);

            if (list.length === 0) {
                const errorMsg = `[ERROR] Could not find running process for ${game.name} (${processName}).\n`;
                fs.appendFileSync(logFilePath, errorMsg);
                mainWindow.webContents.send('log-update', errorMsg);
                mainWindow.webContents.send('monitoring-stopped');
                return;
            }

            const gamePid = list[0].pid;
            const logMessage = `[INFO] Found process for ${game.name}. Starting to monitor PID: ${gamePid}\n`;
            fs.appendFileSync(logFilePath, logMessage);
            mainWindow.webContents.send('log-update', logMessage);

            monitoringInterval = setInterval(async () => {
                try {
                    await pUsage(gamePid);
                } catch (error) {
                    const crashMessage = `[CRASH] Process ${gamePid} for ${game.name} is no longer running.\n`;
                    fs.appendFileSync(logFilePath, crashMessage);
                    mainWindow.webContents.send('log-update', crashMessage);
                    
                    clearInterval(monitoringInterval);
                    mainWindow.webContents.send('monitoring-stopped');
                }
            }, 2000);

        } catch (err) {
            console.error('Error starting monitoring:', err);
            const errorMsg = `[ERROR] An unexpected error occurred while starting monitoring.\n`;
            fs.appendFileSync(logFilePath, errorMsg);
            mainWindow.webContents.send('log-update', errorMsg);
            mainWindow.webContents.send('monitoring-stopped');
        }
    });

    // Handler to stop monitoring
    ipcMain.on('stop-monitoring', () => {
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
            const logMessage = '[INFO] Monitoring stopped by user.\n';
            fs.appendFileSync(logFilePath, logMessage);
            mainWindow.webContents.send('log-update', logMessage);
            mainWindow.webContents.send('monitoring-stopped');
        }
    });

    // Handler to get system metrics
    ipcMain.handle('get-system-metrics', async () => {
        return getSystemMetrics();
    });
}