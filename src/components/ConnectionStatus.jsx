import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, RefreshCw } from 'lucide-react';
import { checkConnection } from '../api/postgrest';

export default function ConnectionStatus({ compact = false }) {
  const [status, setStatus] = useState('checking');
  const [recordCount, setRecordCount] = useState(null);

  const check = async () => {
    const result = await checkConnection();
    setStatus(result.online ? 'online' : 'offline');
    setRecordCount(result.count);
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div className={`connection-dot ${status}`} title={status === 'online' ? `Conectado - ${recordCount || 0} informes` : 'Sin conexi\u00f3n'}>
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
          {status === 'online' && 'BD Conectada'}
          {status === 'offline' && 'Sin conexi\u00f3n'}
          {status === 'checking' && 'Verificando...'}
        </span>
        {status === 'online' && recordCount !== null && (
          <span className="connection-status-count">{recordCount} informes</span>
        )}
      </div>
      <span className={`connection-status-dot ${status}`}></span>
    </div>
  );
}
