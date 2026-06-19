import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Shield, Eye, EyeOff, Lock, Mail, AlertTriangle } from 'lucide-react';
import { loginUser } from '../api/postgrest';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginAttempts, lockedUntil, incrementLoginAttempts, resetLoginAttempts } = useStore();
  const navigate = useNavigate();

  const [lockCountdown, setLockCountdown] = useState(0);

  // Cuenta regresiva si está bloqueado
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setLockCountdown(remaining);
      if (remaining === 0) {
        resetLoginAttempts();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil, resetLoginAttempts]);

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isLocked) {
      setError(`Cuenta bloqueada. Espera ${lockCountdown}s antes de intentarlo de nuevo.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await loginUser(email, password);
      if (data && data.length > 0) {
        resetLoginAttempts();
        login(data[0]);
        navigate('/');
      } else {
        incrementLoginAttempts();
        const remaining = 5 - (loginAttempts + 1);
        if (remaining > 0) {
          setError(`Credenciales incorrectas. ${remaining} intentos restantes.`);
        } else {
          setError('Demasiados intentos fallidos. Cuenta bloqueada temporalmente.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error conectando con el servidor. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background decorativo */}
      <div className="login-bg-decoration">
        <div className="login-bg-circle login-bg-circle-1"></div>
        <div className="login-bg-circle login-bg-circle-2"></div>
        <div className="login-bg-circle login-bg-circle-3"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-wrapper">
            <Shield className="login-icon" size={32} />
          </div>
          <h2>Tecnología Alcalá</h2>
          <p>GIS CRM Pro</p>
          <span className="login-subtitle">Sistema de Gestión de Tasaciones</span>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="login-error">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isLocked && (
            <div className="login-locked">
              <Lock size={16} />
              <span>Bloqueado: {lockCountdown}s restantes</span>
            </div>
          )}

          <div className="form-group">
            <label><Mail size={14} /> Correo Electrónico</label>
            <div className="input-with-icon">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                autoComplete="username"
                required
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="form-group">
            <label><Lock size={14} /> Contraseña</label>
            <div className="input-with-icon">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isLocked}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading || isLocked}>
            {loading ? (
              <><div className="spinner-sm"></div> Verificando...</>
            ) : isLocked ? (
              <><Lock size={16} /> Bloqueado</>
            ) : (
              'Entrar al Sistema'
            )}
          </button>

          {loginAttempts > 0 && !isLocked && (
            <div className="login-attempts-info">
              <small>{5 - loginAttempts} intentos restantes antes del bloqueo</small>
              <div className="attempts-bar">
                <div className="attempts-bar-fill" style={{ width: `${(loginAttempts / 5) * 100}%` }}></div>
              </div>
            </div>
          )}
        </form>

        <div className="login-footer">
          <small>Acceso restringido a personal autorizado</small>
        </div>
      </div>
    </div>
  );
}
