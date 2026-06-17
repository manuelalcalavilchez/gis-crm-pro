import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Shield } from 'lucide-react';
import { loginUser } from '../api/postgrest';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useStore(state => state.login);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginUser(email, password);
      if (data && data.length > 0) {
        login(data[0]);
        navigate('/');
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (err) {
      console.error(err);
      setError('Error conectando con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-wrapper">
            <Shield className="login-icon" size={32} />
          </div>
          <h2>Tecnología Alcalá</h2>
          <p>GIS CRM Pro</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
              autoComplete="username"
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required 
            />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Iniciando...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
