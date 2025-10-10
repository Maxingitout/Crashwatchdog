import React, { useState, useEffect, useRef } from 'react';
import MatrixRain from './components/MatrixRain.jsx';
import './index.css';
import logo from './assets/logo.png';

function App() {
  const [activeView, setActiveView] = useState('games');
  const [games, setGames] = useState([]);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [monitoringStatus, setMonitoringStatus] = useState({ active: false, game: null, hang: false });
  const logContainerRef = useRef(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    const scanGames = async () => {
      const foundGames = await api.scanSteamGames();
      setGames(foundGames || []);
    };
    scanGames();

    const listeners = [
      api.onLogUpdate((logLine) => setLogs((prev) => [...prev, logLine])),
      api.onSystemMetricsUpdate((newMetrics) => setMetrics(newMetrics)),
      api.onMonitoringStopped(() => setMonitoringStatus({ active: false, game: null, hang: false })),
      api.onMonitoringHanged(() => setMonitoringStatus((prev) => ({ ...prev, hang: true }))),
    ];

    return () => {
      listeners.forEach(removeListener => removeListener());
    };
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleRescan = async () => {
    if (window.electronAPI) {
      setLogs((prev) => [...prev, '[INFO] Rescanning for Steam games...']);
      const foundGames = await window.electronAPI.scanSteamGames();
      setGames(foundGames || []);
      setLogs((prev) => [...prev, `[INFO] Scan complete. Found ${foundGames.length} games.`]);
    }
  };

  const handleStartMonitoring = (game) => {
    if (window.electronAPI) {
      setMonitoringStatus({ active: true, game: game.name, hang: false });
      window.electronAPI.startMonitoring(game);
    }
  };
  
  const handleStopMonitoring = () => {
    if (window.electronAPI) {
      window.electronAPI.stopMonitoring();
    }
  };

  // --- FULLY IMPLEMENTED VIEW COMPONENTS ---
  const GamesView = () => (
    <div>
      <h2>Detected Games</h2>
      <div style={styles.grid}>
        {games.length > 0 ? (
          games.map((game) => (
            <div key={game.appId || game.name} style={styles.card}>
              <p>{game.name}</p>
              <button
                style={styles.button}
                onClick={() => handleStartMonitoring(game)}
                disabled={monitoringStatus.active}
              >
                Monitor
              </button>
            </div>
          ))
        ) : (
          <p>No Steam games found. Try rescanning.</p>
        )}
      </div>
    </div>
  );

  const LogsView = () => (
    <div>
      <h2>Session Logs</h2>
      <div ref={logContainerRef} style={styles.logContainer}>
        {logs.map((line, index) => (
          <pre key={index} style={styles.logLine}>{line}</pre>
        ))}
      </div>
    </div>
  );

  const SystemView = () => (
    <div>
      <h2>System Health</h2>
      {metrics ? (
        <div>
          <h3>CPU Usage: {metrics.cpu}%</h3>
          <h3>RAM Usage: {metrics.ram.used} GB / {metrics.ram.total} GB</h3>
        </div>
      ) : (
        <p>Loading system metrics...</p>
      )}
      <p style={{ fontSize: '0.8em', opacity: 0.7 }}>Note: GPU monitoring is not implemented.</p>
    </div>
  );
  // ------------------------------------

  return (
    <>
      <MatrixRain />
      <div style={styles.mainContent}>
        <header style={styles.header}>
          <div style={styles.titleContainer}>
            <img src={logo} alt="CrashWatchdog Logo" style={styles.logo} />
            <h1>CrashWatchdog</h1>
          </div>
          <div>
            <button style={styles.button} onClick={handleRescan}>Rescan Steam</button>
            <button style={styles.button} onClick={() => setActiveView('games')}>Games</button>
            <button style={styles.button} onClick={() => setActiveView('logs')}>Logs</button>
            <button style={styles.button} onClick={() => setActiveView('system')}>System</button>
          </div>
        </header>

        {monitoringStatus.active && (
          <div style={styles.statusBanner}>
            Monitoring: {monitoringStatus.game}
            {monitoringStatus.hang && <span style={styles.hangText}> - HANG DETECTED</span>}
            <button style={{...styles.button, marginLeft: '20px'}} onClick={handleStopMonitoring}>Stop</button>
          </div>
        )}

        <main style={styles.viewContainer}>
          {activeView === 'games' && <GamesView />}
          {activeView === 'logs' && <LogsView />}
          {activeView === 'system' && <SystemView />}
        </main>
      </div>
    </>
  );
}

const styles = {
  logo: {
    width: '128px',
    height: '128px',
    marginRight: '1rem',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  mainContent: {
    position: 'relative',
    zIndex: 1,
    padding: '1rem 2rem',
    backgroundColor: 'rgba(0, 20, 0, 0.75)',
    border: '1px solid #00ff00',
    margin: '2rem',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)',
  },
  button: {
    background: 'transparent',
    border: '1px solid #00ff00',
    padding: '8px 16px',
    margin: '0 5px',
    cursor: 'pointer',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '1em',
    color: '#00ff00',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #00ff00',
    paddingBottom: '1rem',
    marginBottom: '1rem',
  },
  viewContainer: { minHeight: '60vh' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '1rem',
  },
  card: {
    border: '1px solid #00ff00',
    padding: '1rem',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  logContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    border: '1px solid #00ff00',
    height: '60vh',
    overflowY: 'auto',
    padding: '0.5rem',
    fontFamily: 'monospace',
  },
  logLine: {
    margin: 0,
    padding: '2px 0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  statusBanner: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    border: '1px solid orange',
    padding: '1rem',
    marginBottom: '1rem',
    borderRadius: '4px',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hangText: {
    color: '#ff4d4d',
    fontWeight: 'bold',
    textShadow: '0 0 5px red',
  },
};

export default App;