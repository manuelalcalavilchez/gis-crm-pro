import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit3, Shield, ShieldCheck, Eye, Save, X, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fetchUsuarios as apiFetchUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../api/postgrest';

const ROLES = [
  { value: 'admin', label: 'Administrador', color: '#ef4444', icon: ShieldCheck },
  { value: 'editor', label: 'Editor', color: '#f59e0b', icon: Shield },
  { value: 'viewer', label: 'Lector', color: '#3b82f6', icon: Eye },
];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const currentUser = useStore(state => state.user);

  // Estado para formulario de creación
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'viewer', nombre: '' });
  const [creating, setCreating] = useState(false);

  const loadUsuarios = async () => {
    try {
      const data = await apiFetchUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsuarios(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    setCreating(true);

    try {
      await createUsuario(formData);
      setMensaje('Usuario creado correctamente');
      setIsFormOpen(false);
      setFormData({ email: '', password: '', role: 'viewer', nombre: '' });
      loadUsuarios();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingId(user.id);
    setEditForm({ role: user.role, nombre: user.nombre || '' });
  };

  const handleSaveEdit = async (userId) => {
    setError('');
    try {
      await updateUsuario(userId, editForm);
      setEditingId(null);
      setMensaje('Usuario actualizado');
      loadUsuarios();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id || user.email === currentUser?.email) {
      setError('No puedes eliminar tu propio usuario');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar a ${user.email}?`)) return;

    try {
      await deleteUsuario(user.id);
      setMensaje('Usuario eliminado');
      loadUsuarios();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredUsuarios = usuarios.filter(u =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleInfo = (role) => ROLES.find(r => r.value === role) || ROLES[2];

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Gestión de Usuarios</h2>
          <p className="text-muted">{usuarios.length} usuarios registrados</p>
        </div>
        <button className="btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          <UserPlus size={18} />
          <span>{isFormOpen ? 'Cancelar' : 'Nuevo Usuario'}</span>
        </button>
      </header>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {mensaje && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{mensaje}</div>}

      {/* Formulario de creación */}
      {isFormOpen && (
        <form onSubmit={handleCreateUser} className="form-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Crear Nuevo Usuario</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan García"
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div className="form-group">
              <label>Contraseña *</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      )}

      {/* Barra de búsqueda */}
      <div className="search-bar-container" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrapper">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input-inline"
          />
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="card usuarios-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p className="text-muted" style={{ marginTop: '1rem' }}>Cargando usuarios...</p>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <Users size={48} />
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map(user => {
                const roleInfo = getRoleInfo(user.role);
                const isEditing = editingId === user.id;
                const isCurrentUser = user.id === currentUser?.id || user.email === currentUser?.email;

                return (
                  <tr key={user.id || user.email}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar" style={{ background: `${roleInfo.color}20`, color: roleInfo.color }}>
                          {(user.nombre || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="user-name">{user.nombre || 'Sin nombre'}</span>
                          <span className="user-email">{user.email}</span>
                        </div>
                        {isCurrentUser && <span className="badge badge-accent" style={{ marginLeft: '0.5rem' }}>Tú</span>}
                      </div>
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editForm.role}
                          onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                          className="inline-select"
                        >
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span className="role-badge" style={{ background: `${roleInfo.color}15`, color: roleInfo.color, borderColor: `${roleInfo.color}40` }}>
                          <roleInfo.icon size={12} />
                          {roleInfo.label}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        {isEditing ? (
                          <>
                            <button className="btn-icon-sm" onClick={() => handleSaveEdit(user.id)} title="Guardar">
                              <Save size={14} />
                            </button>
                            <button className="btn-icon-sm" onClick={() => setEditingId(null)} title="Cancelar">
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn-icon-sm" onClick={() => handleEditUser(user)} title="Editar rol" disabled={isCurrentUser}>
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn-icon-sm btn-danger"
                              onClick={() => handleDeleteUser(user)}
                              disabled={isCurrentUser}
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
