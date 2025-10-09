import React, { useState, useEffect, useRef } from 'react';
import MatrixRain from './components/MatrixRain.jsx'; // The background animation
import './index.css'; // Imports the main CSS for styling

// --- Main Application Component ---
function App() {
  const [activeView, setActiveView] = useState('games'); // 'games', 'logs', or 'system'
  const [games, setGames] = useState([]);
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);

  // --- Effect to handle backend communication ---
  useEffect(() => {
    // Initial scan for Steam games when the app loads
    const scanGames = async () => {
      if (window.electronAPI) {
        const foundGames = await window.electronAPI.scanSteamGames();
        setGames(foundGames || []);
      }
    };
    scanGames();

    // Listen for log updates from the main process
    if (window.electronAPI) {
      const removeLogListener = window.electronAPI.onLogUpdate((logLine) => {
        setLogs((prevLogs) => [...prevLogs, logLine]);
      });

      // Clean up the listener when the component unmounts
      return () => {
        removeLogListener();
      };
    }
  }, []);

  // Effect to auto-scroll the log view
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // --- Helper function to handle button clicks ---
  const handleRescan = async () => {
    if (window.electronAPI) {
      setLogs((prev) => [...prev, '[INFO] Rescanning for Steam games...']);
      const foundGames = await window.electronAPI.scanSteamGames();
      setGames(foundGames || []);
      setLogs((prev) => [...prev, `[INFO] Scan complete. Found ${foundGames.length} games.`]);
    }
  };

  // --- UI Components for each view ---
  const GamesView = () => (
    <div>
      <h2>Detected Games</h2>
      <div style={styles.grid}>
        {games.length > 0 ? (
          games.map((game) => (
            <div key={game.appId || game.name} style={styles.card}>
              <p>{game.name}</p>
              {/* You would add a button here to start monitoring */}
            </div>
          ))
        ) : (
          <p>No Steam games found. Try rescanning or ensure Steam is running.</p>
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
    // Placeholder for system health metrics
    <div>
      <h2>System Health</h2>
      <p>CPU and RAM usage would be displayed here.</p>
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
            <button onClick={handleRescan}>Rescan Steam</button>
            <button onClick={() => setActiveView('games')}>Games</button>
            <button onClick={() => setActiveView('logs')}>Logs</button>
            <button onClick={() => setActiveView('system')}>System</button>
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
    backgroundColor: 'rgba(10, 25, 10, 0.8)',
    border: '1px solid #00ff00',
    margin: '2rem',
    borderRadius: '8px',
    boxShadow: '0 0 15px rgba(0, 255, 0, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #00ff00',
    paddingBottom: '1rem',
    marginBottom: '1rem',
  },
  viewContainer: {
    minHeight: '60vh',
  },
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
};

export default App;