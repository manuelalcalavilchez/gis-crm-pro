import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit3, Shield, ShieldCheck, Eye, Save, X, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fetchUsuarios as apiFetchUsuarios, createUsuario, updateUsuario, deleteUsuario } from '../api/postgrest';

const ROLES = [
  { value: 'administrador', label: 'Administrador', color: '#ef4444', icon: ShieldCheck },
  { value: 'tasador', label: 'Tasador', color: '#3b82f6', icon: Eye },
  { value: 'invitado', label: 'Invitado', color: '#f59e0b', icon: Eye },
];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [search, setSearch] = useState('');
  const [editingEmail, setEditingEmail] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'tasador' });
  const [creating, setCreating] = useState(false);

  const currentUser = useStore(state => state.user);

  const loadUsuarios = async () => {
    try { const data = await apiFetchUsuarios(); setUsuarios(data); }
    catch (err) { setError('No se pudieron cargar los usuarios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsuarios(); }, []);

  const clearMessages = () => { setTimeout(() => { setError(''); setMensaje(''); }, 4000); };

  const handleCreateUser = async (e) => {
    e.preventDefault(); setMensaje(''); setError(''); setCreating(true);
    if (!formData.email || !formData.password) { setError('Email y contrase\u00f1a son obligatorios'); setCreating(false); return; }
    try {
      await createUsuario(formData);
      setMensaje('Usuario creado correctamente');
      setIsFormOpen(false); setFormData({ email: '', password: '', role: 'tasador' });
      loadUsuarios(); clearMessages();
    } catch (err) { setError(err.message); clearMessages(); }
    finally { setCreating(false); }
  };

  const handleSaveEdit = async (email) => {
    setError('');
    try { await updateUsuario(email, editForm); setEditingEmail(null); setMensaje('Usuario actualizado'); loadUsuarios(); clearMessages(); }
    catch (err) { setError(err.message); clearMessages(); }
  };

  const handleDeleteUser = async (user) => {
    if (user.email === currentUser?.email) { setError('No puedes eliminar tu propio usuario'); clearMessages(); return; }
    if (!confirm(`\u00bfEliminar a ${user.email}?`)) return;
    try { await deleteUsuario(user.email); setMensaje('Usuario eliminado'); loadUsuarios(); clearMessages(); }
    catch (err) { setError(err.message); clearMessages(); }
  };

  const filteredUsuarios = usuarios.filter(u => !search || u.email?.toLowerCase().includes(search.toLowerCase()));
  const getRoleInfo = (role) => ROLES.find(r => r.value === role) || { value: role || 'tasador', label: role || 'Tasador', color: '#3b82f6', icon: Eye };

  return (
    <div className="page-container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Gesti\u00f3n de Usuarios</h2>
          <p className="text-muted">{usuarios.length} usuarios registrados. Solo administradores pueden gestionar esta secci\u00f3n.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          <UserPlus size={18} /><span>{isFormOpen ? 'Cancelar' : 'Nuevo Usuario'}</span>
        </button>
      </header>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {mensaje && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{mensaje}</div>}

      {isFormOpen && (
        <form onSubmit={handleCreateUser} className="form-card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Crear Nuevo Usuario</h3>
          <div className="form-grid">
            <div className="form-group"><label>Email *</label><input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="usuario@ejemplo.com" /></div>
            <div className="form-group"><label>Contrase\u00f1a *</label><input type="password" required minLength={4} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="M\u00ednimo 4 caracteres" /></div>
            <div className="form-group"><label>Rol</label><select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>{ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          </div>
          <div className="form-actions" style={{ marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creando...' : 'Crear Usuario'}</button>
          </div>
        </form>
      )}

      <div className="search-bar-container" style={{ marginBottom: '1.5rem' }}>
        <div className="search-input-wrapper"><Search size={16} /><input type="text" placeholder="Buscar por email..." value={search} onChange={e => setSearch(e.target.value)} className="search-input-inline" /></div>
      </div>

      <div className="card usuarios-table-card">
        {loading ? <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
        : filteredUsuarios.length === 0 ? <div className="empty-state" style={{ padding: '3rem' }}><Users size={48} /><p>No se encontraron usuarios</p></div>
        : (
          <table className="data-table">
            <thead><tr><th>Email</th><th>Rol</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>
            <tbody>
              {filteredUsuarios.map(user => {
                const roleInfo = getRoleInfo(user.role);
                const isEditing = editingEmail === user.email;
                const isCurrentUser = user.email === currentUser?.email;
                return (
                  <tr key={user.email}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar" style={{ background: `${roleInfo.color}20`, color: roleInfo.color }}>{user.email.charAt(0).toUpperCase()}</div>
                        <span className="user-name">{user.email}</span>
                        {isCurrentUser && <span className="badge badge-accent" style={{ marginLeft: '0.5rem' }}>T\u00fa</span>}
                      </div>
                    </td>
                    <td>
                      {isEditing ? <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="inline-select">{ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select>
                        : <span className="role-badge" style={{ background: `${roleInfo.color}15`, color: roleInfo.color, borderColor: `${roleInfo.color}40` }}><roleInfo.icon size={12} />{roleInfo.label}</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        {isEditing ? (
                          <><button className="btn-icon-sm" onClick={() => handleSaveEdit(user.email)}><Save size={14} /></button><button className="btn-icon-sm" onClick={() => setEditingEmail(null)}><X size={14} /></button></>
                        ) : (
                          <><button className="btn-icon-sm" onClick={() => { setEditingEmail(user.email); setEditForm({ role: user.role }); }} disabled={isCurrentUser}><Edit3 size={14} /></button><button className="btn-icon-sm btn-danger" onClick={() => handleDeleteUser(user)} disabled={isCurrentUser}><Trash2 size={14} /></button></>
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
