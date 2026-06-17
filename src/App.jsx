import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./store/useStore";

// Componentes
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Mapa from "./pages/Mapa";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import ImportarJSON from "./pages/ImportarJSON";
import NuevaFicha from "./pages/NuevaFicha";

// Wrapper para proteger rutas
function ProtectedRoute({ children }) {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas que usan el Layout principal */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Mapa />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="importar" element={<ImportarJSON />} />
          <Route path="nueva-ficha" element={<NuevaFicha />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
