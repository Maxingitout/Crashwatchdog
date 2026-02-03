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
      const list = (foundGames || []).map(g => ({ ...g, iconDataUrl: null }));
      setGames(list);

      // Fetch icons (updates tiles as they arrive)
      if (api.getGameIconDataUrl) {
        for (const g of list) {
          try {
            const dataUrl = await api.getGameIconDataUrl(g);
            if (dataUrl) {
              setGames(prev =>
                prev.map(x => {
                  const k1 = x.appId || x.name;
                  const k2 = g.appId || g.name;
                  return k1 === k2 ? { ...x, iconDataUrl: dataUrl } : x;
                })
              );
            }
          } catch {
            // ignore
          }
        }
      }
    };

    scanGames();

    const listeners = [
      api.onLogUpdate((logLine) => setLogs((prev) => [...prev, logLine])),
      api.onSystemMetricsUpdate((newMetrics) => setMetrics(newMetrics)),
      api.onMonitoringStopped(() => setMonitoringStatus({ active: false, game: null, hang: false })),
      api.onMonitoringHanged(() => setMonitoringStatus((prev) => ({ ...prev, hang: true }))),
    ];

    return () => listeners.forEach((off) => off && off());
  }, []);

  useEffect(() => {
    if (!logContainerRef.current) return;
    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [logs]);

  const handleStartMonitoring = (game) => {
    const api = window.electronAPI;
    if (!api) return;
    api.startMonitoring(game);
    setMonitoringStatus({ active: true, game, hang: false });
  };

  const handleStopMonitoring = () => {
    const api = window.electronAPI;
    if (!api) return;
    api.stopMonitoring();
  };

  const GamesView = () => (
    <div>
      <h2>Steam Games</h2>

      {monitoringStatus.active && (
        <div style={styles.monitorBanner}>
          <span>
            Monitoring: <b>{monitoringStatus.game?.name}</b>
            {monitoringStatus.hang ? ' (HANG DETECTED)' : ''}
          </span>
          <button style={styles.stopButton} onClick={handleStopMonitoring}>Stop</button>
        </div>
      )}

      <div style={styles.grid}>
        {games.length > 0 ? (
          games.map((game) => {
            const key = game.appId || game.name;
            const imgSrc = game.iconDataUrl || logo;

            return (
              <div key={key} style={styles.card}>
                <img
                  src={imgSrc}
                  alt={`${game.name} icon`}
                  style={styles.gameIcon}
                  onError={(e) => { e.currentTarget.src = logo; }}
                />
                <p style={styles.gameName}>{game.name}</p>
                <button
                  style={styles.button}
                  onClick={() => handleStartMonitoring(game)}
                  disabled={monitoringStatus.active}
                >
                  Monitor
                </button>
              </div>
            );
          })
        ) : (
          <p>No Steam games found.</p>
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
      <h2>System Monitoring</h2>
      {metrics ? (
        <div style={styles.metrics}>
          <p>CPU: {typeof metrics.cpu === 'number' ? metrics.cpu.toFixed(1) : metrics.cpu}%</p>
          <p>Memory: {typeof metrics.mem === 'number' ? metrics.mem.toFixed(1) : metrics.mem}%</p>
        </div>
      ) : (
        <p>Loading metrics…</p>
      )}
    </div>
  );

  return (
    <div style={styles.app}>
      <MatrixRain />
      <header style={styles.header}>
        <img src={logo} alt="CrashWatchdog" style={styles.headerLogo} />
        <h1 style={styles.title}>CrashWatchdog</h1>

        <nav style={styles.nav}>
          <button style={styles.navButton} onClick={() => setActiveView('games')}>Games</button>
          <button style={styles.navButton} onClick={() => setActiveView('logs')}>Logs</button>
          <button style={styles.navButton} onClick={() => setActiveView('system')}>System</button>
        </nav>
      </header>

      <main style={styles.main}>
        {activeView === 'games' && <GamesView />}
        {activeView === 'logs' && <LogsView />}
        {activeView === 'system' && <SystemView />}
      </main>
    </div>
  );
}

const styles = {
  app: { minHeight: '100vh', color: '#00ff00', background: 'transparent', padding: 20, position: 'relative', zIndex: 2, fontFamily: 'monospace' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerLogo: { width: 42, height: 42 },
  title: { margin: 0, fontSize: 28 },
  nav: { marginLeft: 'auto', display: 'flex', gap: 10 },
  navButton: { background: 'rgba(0,0,0,0.6)', border: '1px solid #00ff00', color: '#00ff00', padding: '8px 12px', cursor: 'pointer' },
  main: { background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(0,255,0,0.35)', padding: 16 },
  monitorBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(0,255,0,0.5)', background: 'rgba(0,0,0,0.6)', padding: '10px 12px', marginBottom: 14 },
  stopButton: { background: 'rgba(255,0,0,0.2)', border: '1px solid rgba(255,0,0,0.7)', color: '#ff6666', padding: '8px 12px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 },
  card: { border: '1px solid rgba(0,255,0,0.35)', background: 'rgba(0,0,0,0.6)', padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  gameIcon: { width: 64, height: 64, objectFit: 'contain' },
  gameName: { margin: 0, textAlign: 'center', minHeight: 36 },
  button: { background: 'rgba(0,0,0,0.6)', border: '1px solid #00ff00', color: '#00ff00', padding: '8px 12px', cursor: 'pointer', width: '100%' },
  logContainer: { maxHeight: 500, overflowY: 'auto', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,255,0,0.35)', padding: 10 },
  logLine: { margin: 0, whiteSpace: 'pre-wrap' },
  metrics: { display: 'flex', gap: 20 }
};

export default App;
