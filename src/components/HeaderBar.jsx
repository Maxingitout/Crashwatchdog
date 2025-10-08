import React from 'react'

export default function HeaderBar({ tab, setTab, session, metrics, onScan }) {
  const secs = session.start ? Math.floor((Date.now()-session.start)/1000) : 0
  return (
    <div className="header">
      <div className="title">CrashWatchdog</div>
      <div className="spacer" />
      <div className="meta">
        <div>CPU: {metrics.cpu?.toFixed ? metrics.cpu.toFixed(0) : metrics.cpu || 0}%</div>
        <div>RAM: {metrics.mem?.toFixed ? metrics.mem.toFixed(0) : metrics.mem || 0}%</div>
      </div>
      <div className="session">
        <div>{session.running ? 'Running' : 'Idle'}</div>
        <div>{session.gameName || '—'}</div>
        <div>{session.running ? `${secs}s` : ''}</div>
      </div>
      <button onClick={onScan}>Rescan Steam</button>
    </div>
  )
}
