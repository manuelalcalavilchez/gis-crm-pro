import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Map, BarChart3, Upload, PlusSquare, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Layout() {
  const logout = useStore(state => state.logout);
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
          <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} end>
            <Map size={20} />
            <span>Mapa GIS</span>
          </NavLink>
          
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/importar" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <Upload size={20} />
            <span>Importar JSON</span>
          </NavLink>

          <NavLink to="/nueva-ficha" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
            <PlusSquare size={20} />
            <span>Nueva Ficha</span>
          </NavLink>
        </nav>

        <div className="nav-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
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
