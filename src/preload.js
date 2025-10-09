const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process (React UI)
// to communicate with the main process (Electron backend).
contextBridge.exposeInMainWorld('electronAPI', {
  // --- Existing Channels ---
  scanSteamGames: () => ipcRenderer.invoke('scan-steam-games'),
  onLogUpdate: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('log-update', subscription);
    return () => ipcRenderer.removeListener('log-update', subscription);
  },
  onMonitoringStopped: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('monitoring-stopped', subscription);
    return () => ipcRenderer.removeListener('monitoring-stopped', subscription);
  },

  // --- New Channel for System Metrics ---
  onSystemMetricsUpdate: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('system-metrics-update', subscription);
    return () => ipcRenderer.removeListener('system-metrics-update', subscription);
  }
});

