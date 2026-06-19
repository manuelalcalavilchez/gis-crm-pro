import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, RefreshCw } from 'lucide-react';
import { BASE_URL } from '../api/postgrest';

/**
 * Connection status indicator.
 * Pings the PostgREST API every 10s and shows connected/disconnected state.
 * Also shows a count of records if connected (optional).
 */
export default function ConnectionStatus({ compact = false }) {
  const [status, setStatus] = useState('checking'); // checking, online, offline
  const [recordCount, setRecordCount] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const check = async () => {
    try {
      const resp = await fetch(`${BASE_URL}/importacion_tasaciones?select=id`, {
        method: 'HEAD',
        headers: { 'Prefer': 'count=exact' }
      });
      if (resp.ok) {
        setStatus('online');
        // Extraer conteo del header Content-Range
        const range = resp.headers.get('content-range');
        if (range) {
          const total = range.split('/')[1];
          if (total && total !== '*') setRecordCount(Number(total));
        }
      } else {
        setStatus('offline');
      }
      setLastCheck(new Date());
    } catch (e) {
      setStatus('offline');
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 15000); // cada 15s
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    // Versión compacta para header del mapa
    return (
      <div className={`connection-dot ${status}`} title={status === 'online' ? `Conectado - ${recordCount || '?'} registros` : 'Sin conexión'}>
        <span className="connection-dot-indicator"></span>
      </div>
    );
  }

  return (
    <div className={`connection-status ${status}`}>
      <div className="connection-status-icon">
        {status === 'online' && <Database size={14} />}
        {status === 'offline' && <WifiOff size={14} />}
        {status === 'checking' && <RefreshCw size={14} className="spinning" />}
      </div>
      <div className="connection-status-info">
        <span className="connection-status-label">
          {status === 'online' && 'Conectado'}
          {status === 'offline' && 'Sin conexión'}
          {status === 'checking' && 'Verificando...'}
        </span>
        {status === 'online' && recordCount !== null && (
          <span className="connection-status-count">{recordCount} fichas</span>
        )}
      </div>
      <span className={`connection-status-dot ${status}`}></span>
    </div>
  );
}
