const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to communicate with the main process
contextBridge.exposeInMainWorld('electronAPI', {
  scanSteamGames: () => ipcRenderer.invoke('scan-steam-games'),
  startMonitoring: (options) => ipcRenderer.send('start-monitoring', options),
  stopMonitoring: () => ipcRenderer.send('stop-monitoring'),
  getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
  onLogUpdate: (callback) => ipcRenderer.on('log-update', (_event, value) => callback(value)),
  onMonitoringStopped: (callback) => ipcRenderer.on('monitoring-stopped', () => callback())
});