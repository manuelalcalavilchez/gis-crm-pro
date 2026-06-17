import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Filter } from 'lucide-react';
import { searchItems } from '../api/postgrest';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de estado
  const [filtroProvincia, setFiltroProvincia] = useState('');
  const [filtroUso, setFiltroUso] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await searchItems('');
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Extraer opciones únicas para los selects de filtro
  const opcionesProvincias = useMemo(() => [...new Set(data.map(d => d.provincia).filter(Boolean))], [data]);
  const opcionesUsos = useMemo(() => [...new Set(data.map(d => d.uso_predominante).filter(Boolean))], [data]);
  const opcionesEstados = useMemo(() => [...new Set(data.map(d => d.estado_actual).filter(Boolean))], [data]);

  // Aplicar filtros a los datos
  const datosFiltrados = useMemo(() => {
    return data.filter(item => {
      if (filtroProvincia && item.provincia !== filtroProvincia) return false;
      if (filtroUso && item.uso_predominante !== filtroUso) return false;
      if (filtroEstado && item.estado_actual !== filtroEstado) return false;
      return true;
    });
  }, [data, filtroProvincia, filtroUso, filtroEstado]);

  if (loading) {
    return <div className="loading-state">Cargando métricas...</div>;
  }

  const totalTasaciones = datosFiltrados.length;
  const totalValor = datosFiltrados.reduce((acc, curr) => acc + (Number(curr.valor_mercado_adoptado) || 0), 0);
  const avgValor = totalTasaciones ? (totalValor / totalTasaciones) : 0;

  // Preparar datos para gráfico de usos
  const usosCount = datosFiltrados.reduce((acc, curr) => {
    const uso = curr.uso_predominante || 'Desconocido';
    acc[uso] = (acc[uso] || 0) + 1;
    return acc;
  }, {});
  const dataUsos = Object.keys(usosCount).map(key => ({ name: key, value: usosCount[key] }));

  // Preparar datos para gráfico de municipios
  const municipiosCount = datosFiltrados.reduce((acc, curr) => {
    const mun = curr.municipio || 'Desconocido';
    acc[mun] = (acc[mun] || 0) + 1;
    return acc;
  }, {});
  const dataMunicipios = Object.keys(municipiosCount)
    .map(key => ({ name: key, cantidad: municipiosCount[key] }))
    .sort((a,b) => b.cantidad - a.cantidad)
    .slice(0, 7); // Top 7

  return (
    <div className="page-container dashboard-page">
      <header className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div>
          <h2>Dashboard Analítico</h2>
          <p className="text-muted">Resumen interactivo de tasaciones</p>
        </div>
      </header>

      {/* Panel de Filtros */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent)' }}>
          <Filter size={18} />
          <h3 style={{ margin: 0 }}>Filtros Avanzados</h3>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Provincia</label>
            <select value={filtroProvincia} onChange={e => setFiltroProvincia(e.target.value)}>
              <option value="">Todas las provincias</option>
              {opcionesProvincias.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Uso Predominante</label>
            <select value={filtroUso} onChange={e => setFiltroUso(e.target.value)}>
              <option value="">Todos los usos</option>
              {opcionesUsos.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Estado Actual</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {opcionesEstados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Tasaciones (Filtradas)</h3>
          <div className="kpi-value">{totalTasaciones}</div>
        </div>
        <div className="kpi-card">
          <h3>Valor Promedio</h3>
          <div className="kpi-value">{avgValor.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
        </div>
        <div className="kpi-card">
          <h3>Valor Total</h3>
          <div className="kpi-value">{totalValor.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Top Municipios</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataMunicipios} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fontSize: 12}} />
                <YAxis stroke="var(--text-muted)" tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)' }} />
                <Bar dataKey="cantidad" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Distribución por Uso</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dataUsos}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataUsos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
