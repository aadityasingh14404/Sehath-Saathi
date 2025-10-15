import React, { useEffect, useRef, useState } from 'react'

const CDN_URL = 'https://cdn.socket.io/4.8.1/socket.io.min.js'

const AmbulanceMonitor = () => {
  const [logs, setLogs] = useState([])
  const [connected, setConnected] = useState(false)
  const [zone, setZone] = useState('general')
  const socketRef = useRef(null)

  const backendBase = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '')
  const nsUrl = `${backendBase}/prescripto.ambulance`

  const pushLog = (line) => setLogs((l) => [...l, line].slice(-300))

  useEffect(() => {
    if (!window.io) {
      const s = document.createElement('script')
      s.src = CDN_URL
      s.async = true
      s.onload = () => setup()
      document.head.appendChild(s)
      return () => { try { document.head.removeChild(s) } catch {} }
    } else {
      setup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setup = () => {
    if (socketRef.current) return
    const sock = window.io(nsUrl, { transports: ['websocket'] })
    socketRef.current = sock
    sock.on('connect', () => { setConnected(true); pushLog(`Connected ${sock.id}`) })
    sock.on('disconnect', () => { setConnected(false); pushLog('Disconnected') })
    sock.on('joined-zone', (d) => pushLog(`Joined zone: ${d.zone}`))
    sock.on('ambulance:request', (rec) => pushLog(`REQUEST ${rec.bookingId || ''} ${rec.userId} @ ${rec.zone} -> ${JSON.stringify(rec.location)}`))
    sock.on('ambulance:assigned', (rec) => pushLog(`ASSIGNED ${rec.bookingId} -> ${rec.ambulance?.driverName} (${rec.ambulance?.vehicleNo})`))
    sock.on('ambulance:status', (s) => pushLog(`STATUS ${s.bookingId} -> ${s.status}${s.etaMinutes !== undefined ? `, ETA ${s.etaMinutes}m` : ''}`))
    sock.on('ambulance:cancelled', (s) => pushLog(`CANCELLED ${s.bookingId}`))

    // auto-join initial zone
    sock.emit('join-zone', zone)
  }

  const joinZone = () => {
    const sock = socketRef.current
    if (!sock) return
    sock.emit('join-zone', zone)
  }

  return (
    <div className='p-4'>
      <div className='flex items-center gap-2 mb-2'>
        <div className='font-semibold'>Ambulance Monitor</div>
        <div className={`text-xs px-2 py-0.5 rounded ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{connected ? 'Live' : 'Offline'}</div>
      </div>
      <div className='flex gap-2 mb-2'>
        <input value={zone} onChange={e => setZone(e.target.value)} placeholder='Zone (e.g. general)' className='border rounded px-2 py-1 text-sm' />
        <button onClick={joinZone} className='bg-black text-white rounded px-3 py-1 text-sm'>Join Zone</button>
      </div>
      <pre className='bg-white border rounded p-3 h-72 overflow-auto text-xs'>{logs.join('\n')}</pre>
    </div>
  )
}

export default AmbulanceMonitor
