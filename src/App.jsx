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
import FichaDetalle from "./pages/FichaDetalle";

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

        {/* Rutas protegidas con Layout principal */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Mapa />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="importar" element={<ImportarJSON />} />
          <Route path="nueva-ficha" element={<NuevaFicha />} />
          <Route path="ficha/:id" element={<FichaDetalle />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
