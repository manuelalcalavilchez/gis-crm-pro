import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Shield, Eye, EyeOff, Lock, Mail, AlertTriangle, Database } from 'lucide-react';
import { loginUser, BASE_URL } from '../api/postgrest';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState('checking');

  const { login, isAuthenticated, loginAttempts, lockedUntil, incrementLoginAttempts, resetLoginAttempts } = useStore();
  const navigate = useNavigate();
  const [lockCountdown, setLockCountdown] = useState(0);

  // Redirect si ya autenticado
  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated]);

  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await fetch(`${BASE_URL}/usuarios?limit=1`, { method: 'HEAD' });
        setDbStatus(res.ok ? 'online' : 'offline');
      } catch { setDbStatus('offline'); }
    };
    checkDb();
    const interval = setInterval(checkDb, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setLockCountdown(remaining);
      if (remaining === 0) resetLoginAttempts();
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil, resetLoginAttempts]);

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked) { setError(`Cuenta bloqueada. Espera ${lockCountdown}s.`); return; }
    setLoading(true); setError('');
    try {
      const data = await loginUser(email, password);
      if (data && data.length > 0) {
        resetLoginAttempts();
        login(data[0]);
        navigate('/');
      } else {
        incrementLoginAttempts();
        const remaining = 5 - (loginAttempts + 1);
        setError(remaining > 0 ? `Credenciales incorrectas. ${remaining} intentos restantes.` : 'Demasiados intentos. Cuenta bloqueada temporalmente.');
      }
    } catch { setError('Error conectando con el servidor.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-container">
      <div className="login-bg-decoration">
        <div className="login-bg-circle login-bg-circle-1"></div>
        <div className="login-bg-circle login-bg-circle-2"></div>
        <div className="login-bg-circle login-bg-circle-3"></div>
      </div>
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-wrapper"><Shield className="login-icon" size={32} /></div>
          <h2>Tasaciones Jorge Mart\u00ednez Sola</h2>
          <p>by Tecnolog\u00eda Alcal\u00e1</p>
          <span className="login-subtitle">Visualizador de Informes de Tasaci\u00f3n</span>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error"><AlertTriangle size={16} /><span>{error}</span></div>}
          {isLocked && <div className="login-locked"><Lock size={16} /><span>Bloqueado: {lockCountdown}s restantes</span></div>}
          <div className="form-group">
            <label><Mail size={14} /> Correo Electr\u00f3nico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@ejemplo.com" autoComplete="username" required disabled={isLocked} />
          </div>
          <div className="form-group">
            <label><Lock size={14} /> Contrase\u00f1a</label>
            <div className="input-with-icon">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" autoComplete="current-password" required disabled={isLocked} />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="login-button" disabled={loading || isLocked}>
            {loading ? <><div className="spinner-sm"></div> Verificando...</> : isLocked ? <><Lock size={16} /> Bloqueado</> : 'Entrar al Sistema'}
          </button>
          {loginAttempts > 0 && !isLocked && (
            <div className="login-attempts-info">
              <small>{5 - loginAttempts} intentos restantes</small>
              <div className="attempts-bar"><div className="attempts-bar-fill" style={{ width: `${(loginAttempts / 5) * 100}%` }}></div></div>
            </div>
          )}
        </form>
        <div className="login-db-status">
          {dbStatus === 'online' && <div className="login-db-online"><Database size={14} /><span>BD conectada</span><span className="login-db-dot online"></span></div>}
          {dbStatus === 'offline' && <div className="login-db-offline"><Database size={14} /><span>Sin conexi\u00f3n a BD</span><span className="login-db-dot offline"></span></div>}
          {dbStatus === 'checking' && <div className="login-db-checking"><Database size={14} /><span>Verificando...</span></div>}
        </div>
        <div className="login-footer"><small>Acceso restringido a personal autorizado</small></div>
      </div>
    </div>
  );
}
