import React, { useEffect, useRef, useState } from 'react';

const CDN_URL = 'https://cdn.socket.io/4.8.1/socket.io.min.js';

const AmbulanceWidget = () => {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [bookingId, setBookingId] = useState('');
  const [status, setStatus] = useState('idle');
  const [pickupLabel, setPickupLabel] = useState('');
  const [pickupLatLng, setPickupLatLng] = useState({ lat: 0, lng: 0 });
  const zoneRef = useRef('general');
  const genId = () => `user-${Math.random().toString(36).slice(2, 8)}`;
  const userRef = useRef(genId());
  const addressRef = useRef('Connaught Place, New Delhi');
  const notesRef = useRef('Emergency');
  const socketRef = useRef(null);

  const backendBase = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');
  const nsUrl = `${backendBase}/prescripto.ambulance`;

  const pushLog = (line) => setLogs((l) => [...l, line].slice(-200));

  useEffect(() => {
    if (window.io) return; // already loaded elsewhere
    const s = document.createElement('script');
    s.src = CDN_URL;
    s.async = true;
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch {} };
  }, []);

  const [isRequesting, setIsRequesting] = useState(false);

  const ensureSocket = () => {
    if (socketRef.current || !window.io) return;
    const sock = window.io(nsUrl, { transports: ['websocket'] });
    socketRef.current = sock;
    sock.on('connect', () => { setConnected(true); pushLog(`Connected ${sock.id}`); });
    sock.on('disconnect', () => { setConnected(false); pushLog('Disconnected'); });
    sock.on('joined-zone', (d) => pushLog(`Joined zone: ${d.zone}`));
    sock.on('ambulance:request', (p) => pushLog(`EMERGENCY ${JSON.stringify(p)}`));
    sock.on('joined-booking', (d) => pushLog(`Subscribed booking: ${d.bookingId}`));
    sock.on('ambulance:assigned', (rec) => { setStatus(rec?.status || 'assigned'); pushLog(`Assigned: ${JSON.stringify(rec.ambulance)}`); });
    sock.on('ambulance:status', (s) => { setStatus(s?.status || ''); if (s?.etaMinutes !== undefined) pushLog(`Status: ${s.status}, ETA: ${s.etaMinutes}m`); else pushLog(`Status: ${s.status}`); });
    sock.on('ambulance:cancelled', () => { setStatus('cancelled'); pushLog('Booking cancelled'); });
  };

  const joinZone = () => {
    ensureSocket();
    const sock = socketRef.current;
    if (!sock) { pushLog('Socket not ready'); return; }
    const zone = (zoneRef.current?.value || 'general');
    sock.emit('join-zone', zone);
  };

  const trigger = async () => {
    ensureSocket();
    const zone = (zoneRef.current?.value || 'general');
    const userId = (userRef.current?.value || 'web-user');
    const notes = (notesRef.current?.value || '');
    const address = (addressRef.current?.value || '').trim();

    if (!address) { pushLog('Please enter an address.'); return; }

    setIsRequesting(true);
    let lat = 0, lng = 0;
    try {
      // Geocode via OpenStreetMap Nominatim (no API key)
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
        headers: { 'Accept-Language': 'en' }
      });
      const results = await resp.json();
      if (Array.isArray(results) && results.length > 0) {
        lat = parseFloat(results[0].lat);
        lng = parseFloat(results[0].lon);
        const label = results[0].display_name;
        setPickupLabel(label);
        setPickupLatLng({ lat, lng });
        pushLog(`Location: ${label}`);
      } else {
        pushLog('Could not locate the address. Please try a more specific one.');
        setIsRequesting(false);
        return;
      }
    } catch (e) {
      pushLog(`Geocode error: ${e.message}`);
      setIsRequesting(false);
      return;
    }
    try {
      const res = await fetch(`${backendBase}/api/ambulance/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lat, lng, zone, notes })
      });
      const data = await res.json();
      if (data?.success && data?.booking?.bookingId) {
        setBookingId(data.booking.bookingId);
        setStatus(data.booking.status || 'requested');
        pushLog(`Booking created: ${data.booking.bookingId}`);
        const sock = socketRef.current; if (sock) { sock.emit('join-booking', data.booking.bookingId); }
      } else {
        pushLog(`Failed: ${JSON.stringify(data)}`);
      }
    } catch (e) {
      pushLog(`Error: ${e.message}`);
    } finally { setIsRequesting(false); }
  };

  const cancel = async () => {
    if (!bookingId) { pushLog('No active booking'); return; }
    try {
      const res = await fetch(`${backendBase}/api/ambulance/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      const data = await res.json();
      if (data?.success) { setStatus('cancelled'); pushLog('Booking cancelled'); }
    } catch (e) { pushLog(`Error: ${e.message}`); }
  };

  return (
    <>
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 2147483647 }}>
        <button onClick={() => { setOpen(!open); ensureSocket(); }} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 24, padding: '10px 14px', fontWeight: 600, boxShadow: '0 2px 10px rgba(0,0,0,.2)', cursor: 'pointer' }}>
          🚑 Ambulance {connected ? '●' : '○'}
        </button>
      </div>
      {open && (
        <div style={{ position: 'fixed', right: 16, bottom: 64, width: 320, maxWidth: '90vw', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.15)', padding: 12, zIndex: 2147483647 }}>
          <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16 }}>Ambulance Emergency</h3>
          <input ref={zoneRef} placeholder="Zone (e.g. general)" defaultValue="general" style={{ width: '100%', padding: 8, margin: '6px 0', border: '1px solid #d1d5db', borderRadius: 8 }} />
          <input ref={userRef} placeholder="User ID" defaultValue={userRef.current} style={{ width: '100%', padding: 8, margin: '6px 0', border: '1px solid #d1d5db', borderRadius: 8 }} />
          <input ref={addressRef} placeholder="Address (e.g. Connaught Place, New Delhi)" defaultValue="Connaught Place, New Delhi" style={{ width: '100%', padding: 8, margin: '6px 0', border: '1px solid #d1d5db', borderRadius: 8 }} />
          <input ref={notesRef} placeholder="Notes" defaultValue="Emergency" style={{ width: '100%', padding: 8, margin: '6px 0', border: '1px solid #d1d5db', borderRadius: 8 }} />
          <button onClick={joinZone} style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 10px', marginTop: 6, cursor: 'pointer' }}>Join Zone</button>
          <button onClick={trigger} disabled={isRequesting} style={{ background: isRequesting ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 10px', marginTop: 6, marginLeft: 8, cursor: isRequesting ? 'not-allowed' : 'pointer' }}>{isRequesting ? 'Requesting…' : 'Request Ambulance'}</button>
          {bookingId && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#374151' }}>Booking: {bookingId}</div>
              <div style={{ fontSize: 12, color: '#374151' }}>Status: <span style={{ padding: '2px 6px', borderRadius: 6, background: '#eef2ff', color: '#3730a3' }}>{status}</span></div>
              {pickupLabel && <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>Pickup: {pickupLabel}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupLatLng.lat + ',' + pickupLatLng.lng)}`} target="_blank" rel="noreferrer" style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 8px', textDecoration: 'none' }}>Track on Map</a>
                <button onClick={() => { navigator.clipboard?.writeText(bookingId) }} style={{ background: '#6b7280', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>Copy ID</button>
                <a href="tel:102" style={{ background: '#f59e0b', color: '#111827', border: 'none', borderRadius: 8, padding: '6px 8px', textDecoration: 'none' }}>Call 102</a>
              </div>
              <button onClick={cancel} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 8px', marginTop: 6, cursor: 'pointer' }}>Cancel</button>
            </div>
          )}
          <pre style={{ fontFamily: 'ui-monospace,Consolas,monospace', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, height: 120, overflow: 'auto', marginTop: 8 }}>{logs.join('\n')}</pre>
        </div>
      )}
    </>
  );
};

export default AmbulanceWidget;


