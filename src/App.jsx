import React, { useEffect, useState } from 'react'
import HeaderBar from './components/HeaderBar.jsx'
import GameGrid from './components/GameGrid.jsx'
import LogViewer from './components/LogViewer.jsx'
import SystemHealth from './components/SystemHealth.jsx'

const TABS = ['Games','Logs','System']

export default function App() {
  const [tab, setTab] = useState('Games')
  const [logs, setLogs] = useState([])
  const [metrics, setMetrics] = useState({})
  const [games, setGames] = useState([])
  const [session, setSession] = useState({ running: false, start: null, gameName: null })

  useEffect(() => {
    window.cw?.on('monitor:log', (_evt, line) => {
      setLogs(prev => [...prev, line].slice(-1000))
    })
    window.cw?.on('monitor:exit', (_evt, code) => {
      setLogs(prev => [...prev, `Monitor exited (${code})`])
      setSession(s => ({ ...s, running: false }))
    })
    window.cw?.on('metrics:update', (_evt, data) => setMetrics(data))
    window.cw?.invoke('metrics:start')
    scanGames()
    return () => {
      window.cw?.invoke('metrics:stop')
    }
  }, [])

  const scanGames = async () => {
    const list = await window.cw?.invoke('steam:scan')
    setGames(list || [])
  }

  const startMonitor = async (g) => {
    await window.cw?.invoke('monitor:start', { gameExe: g.exePath, gameName: g.name })
    setSession({ running: true, start: Date.now(), gameName: g.name })
    setTab('Logs')
  }

  const stopMonitor = async () => {
    await window.cw?.invoke('monitor:stop')
    setSession(s => ({ ...s, running: false }))
  }

  return (
    <div className="app">
      <HeaderBar tab={tab} setTab={setTab} session={session} metrics={metrics} onScan={scanGames} />
      <div className="tabbar">
        {TABS.map(t => (
          <button key={t} className={tab===t?'active':''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="content">
        {tab==='Games' && <GameGrid games={games} onStart={startMonitor} />}
        {tab==='Logs' && <LogViewer logs={logs} onStop={stopMonitor} running={session.running} />}
        {tab==='System' && <SystemHealth metrics={metrics} />}
      </div>
    </div>
  )
}
