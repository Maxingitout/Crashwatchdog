import React from 'react'

export default function GameGrid({ games, onStart }) {
  if (!games.length) {
    return <div className="card">No Steam games detected yet. Click "Rescan Steam" at the top.</div>
  }
  return (
    <div className="grid">
      {games.map(g => (
        <div key={g.name} className="card hoverable" onClick={() => g.exePath && onStart(g)}>
          <div className="icon">{g.icon ? <img src={'file:///'+g.icon.replace(/\\/g,'/')} alt="" /> : '🎮'}</div>
          <div className="name">{g.name || g.installdir}</div>
          <div className="path">{g.exePath || 'No exe detected'}</div>
        </div>
      ))}
    </div>
  )
}
