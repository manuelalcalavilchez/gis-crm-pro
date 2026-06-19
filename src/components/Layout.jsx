import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Map, BarChart3, Upload, PlusSquare, LogOut, Users, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Layout() {
  const { logout, user } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="nav-sidebar">
        <div className="nav-brand">
          <div className="brand-logo">TA</div>
          <div>
            <h2>Tecnología Alcalá</h2>
            <span>GIS CRM Pro</span>
          </div>
        </div>

        <nav className="nav-menu">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
            <Map size={20} />
            <span>Mapa GIS</span>
          </NavLink>

          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/importar" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Upload size={20} />
            <span>Importar</span>
          </NavLink>

          <NavLink to="/nueva-ficha" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <PlusSquare size={20} />
            <span>Nueva Ficha</span>
          </NavLink>

          <NavLink to="/usuarios" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Users size={20} />
            <span>Usuarios</span>
          </NavLink>
        </nav>

        <div className="nav-footer">
          {user && (
            <div className="nav-user-info">
              <div className="nav-user-avatar">
                {(user.nombre || user.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="nav-user-details">
                <span className="nav-user-name">{user.nombre || user.email}</span>
                <span className="nav-user-role">
                  <Shield size={10} /> {user.role || 'usuario'}
                </span>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
