import React, { useState, useEffect, useRef } from 'react';
// Re-importing the MatrixRain component
import MatrixRain from './components/MatrixRain.jsx'; 
import './index.css';

// --- Main Application Component ---
function App() {
  const [activeView, setActiveView] = useState('games');
  const [games, setGames] = useState([]);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const logContainerRef = useRef(null);

  // --- Effect for backend communication ---
  useEffect(() => {
    const scanGames = async () => {
      if (window.electronAPI) {
        const foundGames = await window.electronAPI.scanSteamGames();
        setGames(foundGames || []);
      }
    };
    scanGames();

    let removeLogListener;
    if (window.electronAPI) {
      removeLogListener = window.electronAPI.onLogUpdate((logLine) => {
        setLogs((prevLogs) => [...prevLogs, logLine]);
      });
    }

    return () => {
      if (removeLogListener) removeLogListener();
    };
  }, []);

  // Effect for system metrics
  useEffect(() => {
    let removeMetricsListener;
    if (window.electronAPI) {
      removeMetricsListener = window.electronAPI.onSystemMetricsUpdate((newMetrics) => {
        setMetrics(newMetrics);
      });
    }
    return () => {
      if(removeMetricsListener) removeMetricsListener();
    };
  }, []);

  // Effect to auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // --- Handlers ---
  const handleRescan = async () => {
    if (window.electronAPI) {
      setLogs((prev) => [...prev, '[INFO] Rescanning...']);
      const foundGames = await window.electronAPI.scanSteamGames();
      setGames(foundGames || []);
      setLogs((prev) => [...prev, `[INFO] Scan complete. Found ${foundGames.length} games.`]);
    }
  };

  // --- View Components ---
  const GamesView = () => (
    <div>
      <h2>Detected Games</h2>
      <div style={styles.grid}>
        {games.length > 0 ? games.map((game) => (
          <div key={game.appId || game.name} style={styles.card}><p>{game.name}</p></div>
        )) : <p>No Steam games found. Try rescanning.</p>}
      </div>
    </div>
  );

  const LogsView = () => (
    <div>
      <h2>Session Logs</h2>
      <div ref={logContainerRef} style={styles.logContainer}>
        {logs.map((line, index) => <pre key={index} style={styles.logLine}>{line}</pre>)}
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
      ) : <p>Loading system metrics...</p>}
      <p style={{ fontSize: '0.8em', opacity: 0.7 }}>Note: GPU monitoring is not implemented.</p>
    </div>
  );

  // --- Main Render ---
  return (
    <>
      <MatrixRain />
      <div style={styles.mainContent}>
        <header style={styles.header}>
          <h1>CrashWatchdog</h1>
          <div>
            <button style={styles.button} onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor} onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.background} onClick={handleRescan}>Rescan Steam</button>
            <button style={styles.button} onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor} onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.background} onClick={() => setActiveView('games')}>Games</button>
            <button style={styles.button} onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor} onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.background} onClick={() => setActiveView('logs')}>Logs</button>
            <button style={styles.button} onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor} onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.background} onClick={() => setActiveView('system')}>System</button>
          </div>
        </header>
        <main style={styles.viewContainer}>
          {activeView === 'games' && <GamesView />}
          {activeView === 'logs' && <LogsView />}
          {activeView === 'system' && <SystemView />}
        </main>
      </div>
    </>
  );
}

// --- Styles Object ---
const styles = {
  mainContent: { 
    position: 'relative', 
    zIndex: 1, 
    padding: '1rem 2rem', 
    backgroundColor: 'rgba(0, 20, 0, 0.75)', // Darker, more transparent background
    border: '1px solid #00ff00', 
    margin: '2rem', 
    borderRadius: '8px', 
    boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)' 
  },
  button: { 
    background: 'transparent', 
    border: '1px solid #00ff00', 
    padding: '8px 16px', 
    margin: '0 5px', 
    cursor: 'pointer', 
    fontFamily: "'Share Tech Mono', monospace", 
    fontSize: '1em', 
    transition: 'background-color 0.2s ease-in-out' 
  },
  buttonHover: { 
    backgroundColor: 'rgba(0, 255, 0, 0.1)' 
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderBottom: '1px solid #00ff00', 
    paddingBottom: '1rem', 
    marginBottom: '1rem' 
  },
  viewContainer: { 
    minHeight: '60vh' 
  },
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
    gap: '1rem' 
  },
  card: { 
    border: '1px solid #00ff00', 
    padding: '1rem', 
    textAlign: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  logContainer: { 
    backgroundColor: 'rgba(0, 0, 0, 0.7)', 
    border: '1px solid #00ff00', 
    height: '60vh', 
    overflowY: 'auto', 
    padding: '0.5rem', 
    fontFamily: 'monospace' 
  },
  logLine: { 
    margin: 0, 
    padding: '2px 0', 
    whiteSpace: 'pre-wrap', 
    wordBreak: 'break-all' 
  }
};

export default App;

