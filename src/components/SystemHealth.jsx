import React from 'react'

export default function SystemHealth({ metrics }) {
  return (
    <div className="grid">
      <div className="card">
        <h3>CPU</h3>
        <div className="num">{metrics.cpu?.toFixed ? metrics.cpu.toFixed(1) : metrics.cpu || 0}%</div>
      </div>
      <div className="card">
        <h3>RAM</h3>
        <div className="num">{metrics.mem?.toFixed ? metrics.mem.toFixed(1) : metrics.mem || 0}%</div>
        <div className="sub">{metrics.freeMemMB} MB free of {metrics.totalMemMB} MB</div>
      </div>
      <div className="card">
        <h3>GPU</h3>
        <div className="sub">GPU telemetry placeholder (add vendor-specific CLI if desired)</div>
      </div>
      <div className="card">
        <h3>Advisories</h3>
        <ul>
          <li>RAM health checks: keep free mem &gt; 15% for stability.</li>
          <li>Watch for CPU spikes &gt; 90% sustained.</li>
        </ul>
      </div>
    </div>
  )
}
