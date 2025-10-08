import React, { useRef, useEffect } from 'react'

export default function LogViewer({ logs, onStop, running }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])
  return (
    <div className="card" style={{height:'calc(100vh - 200px)', display:'flex',flexDirection:'column'}}>
      <div style={{marginBottom:8, display:'flex', gap:8}}>
        <button onClick={onStop} disabled={!running}>Stop Monitor</button>
      </div>
      <div ref={ref} className="logbox">
        {logs.map((l,i)=>(<div key={i} className="logline">{l}</div>))}
      </div>
    </div>
  )
}
