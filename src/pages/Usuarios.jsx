import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, KeyRound } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  const currentUser = useStore(state => state.user);
  
  // Estado para formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'viewer' });

  const BASE_URL = import.meta.env.VITE_API_URL || 'https://n8n-postgrest-api.n9xpuu.easypanel.host';

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(`${BASE_URL}/usuarios`);
      if (!res.ok) throw new Error('Error al cargar usuarios');
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    
    try {
      const res = await fetch(`${BASE_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Error al crear usuario (quizá el correo ya existe)');
      
      setMensaje('Usuario creado correctamente');
      setIsFormOpen(false);
      setFormData({ email: '', password: '', role: 'viewer' });
      fetchUsuarios();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (email) => {
    if (email === currentUser?.email) {
      setError('No puedes eliminar tu propio usuario');
      return;
    }
    
    if (!confirm(`¿Estás seguro de eliminar a ${email}?`)) return;

    try {
      const res = await fetch(`${BASE_URL}/usuarios?email=eq.${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar');
      
      setMensaje('Usuario eliminado');
      fetchUsuarios();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Gestión de Usuarios</h2>
          <p className="text-muted">Administra los accesos al CRM</p>
        </div>
        <button className="btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          <UserPlus size={18} />
          <span>{isFormOpen ? 'Cancelar' : 'Nuevo Usuario'}</span>
        </button>
      </header>

      {error && <div className="alert alert-error" style={{marginBottom: '1rem'}}>{error}</div>}
      {mensaje && <div className="alert alert-success" style={{marginBottom: '1rem'}}>{mensaje}</div>}

      {isFormOpen && (
        <form onSubmit={handleCreateUser} className="form-card" style={{ marginBottom: '2rem' }}>
          <h3>Crear Nuevo Usuario</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})}
                style={{ background: 'var(--bg-dark)', color: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              >
                <option value="admin">Administrador</option>
                <option value="editor">Editor</option>
                <option value="viewer">Lector</option>
              </select>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-success">Guardar Usuario</button>
          </div>
        </form>
      )}

      <div className="card">
        {loading ? (
          <div style={{padding: '2rem', textAlign: 'center'}}>Cargando usuarios...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Email</th>
                <th style={{ padding: '1rem' }}>Contraseña</th>
                <th style={{ padding: '1rem' }}>Rol</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(user => (
                <tr key={user.email} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <Users size={16} className="text-muted"/>
                      {user.email}
                      {user.email === currentUser?.email && <span className="badge" style={{marginLeft: '0.5rem'}}>Tú</span>}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {/* Solo mostramos la contraseña como información de gestión, idealmente esto debería estar hasheado en un entorno real */}
                    {user.password}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge" style={{background: user.role==='admin' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDeleteUser(user.email)}
                      disabled={user.email === currentUser?.email}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: user.email === currentUser?.email ? 0.3 : 1 }}
                      title="Eliminar usuario"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
