const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  scanSteamGames: () => ipcRenderer.invoke('scan-steam-games'),
  startMonitoring: (game) => ipcRenderer.send('start-monitoring', game),
  stopMonitoring: () => ipcRenderer.send('stop-monitoring'),

  onLogUpdate: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('log-update', subscription);
    return () => ipcRenderer.removeListener('log-update', subscription);
  },
  onSystemMetricsUpdate: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('system-metrics-update', subscription);
    return () => ipcRenderer.removeListener('system-metrics-update', subscription);
  },
  onMonitoringStopped: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('monitoring-stopped', subscription);
    return () => ipcRenderer.removeListener('monitoring-stopped', subscription);
  },
  onMonitoringHanged: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('monitoring-hanged', subscription);
    return () => ipcRenderer.removeListener('monitoring-hanged', subscription);
  },
});