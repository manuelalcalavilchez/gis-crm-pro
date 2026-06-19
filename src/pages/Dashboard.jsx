import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Filter, TrendingUp, MapPin, Euro, FileText, RefreshCw } from 'lucide-react';
import { searchTasaciones } from '../api/postgrest';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroLocalidad, setFiltroLocalidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPropietario, setFiltroPropietario] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroValorMin, setFiltroValorMin] = useState('');
  const [filtroValorMax, setFiltroValorMax] = useState('');

  const fetchData = async () => {
    try {
      const res = await searchTasaciones('');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Opciones únicas para filtros
  const opcionesTipos = useMemo(() => [...new Set(data.map(d => d.tipo).filter(Boolean))].sort(), [data]);
  const opcionesLocalidades = useMemo(() => [...new Set(data.map(d => d.localidad).filter(Boolean))].sort(), [data]);
  const opcionesEstados = useMemo(() => [...new Set(data.map(d => d.estado).filter(Boolean))].sort(), [data]);
  const opcionesPropietarios = useMemo(() => [...new Set(data.map(d => d.propietario).filter(Boolean))].sort(), [data]);
  const opcionesAnios = useMemo(() => {
    const years = data.map(d => d.fecha ? String(new Date(d.fecha).getFullYear()) : null).filter(Boolean);
    return [...new Set(years)].sort().reverse();
  }, [data]);

  // Aplicar filtros
  const datosFiltrados = useMemo(() => {
    return data.filter(item => {
      if (filtroTipo && item.tipo !== filtroTipo) return false;
      if (filtroLocalidad && item.localidad !== filtroLocalidad) return false;
      if (filtroEstado && item.estado !== filtroEstado) return false;
      if (filtroPropietario && item.propietario !== filtroPropietario) return false;
      if (filtroAnio) {
        const itemAnio = item.fecha ? String(new Date(item.fecha).getFullYear()) : '';
        if (itemAnio !== filtroAnio) return false;
      }
      if (filtroValorMin && Number(item.valor) < Number(filtroValorMin)) return false;
      if (filtroValorMax && Number(item.valor) > Number(filtroValorMax)) return false;
      return true;
    });
  }, [data, filtroTipo, filtroLocalidad, filtroEstado, filtroPropietario, filtroAnio, filtroValorMin, filtroValorMax]);

  const limpiarFiltros = () => {
    setFiltroTipo('');
    setFiltroLocalidad('');
    setFiltroEstado('');
    setFiltroPropietario('');
    setFiltroAnio('');
    setFiltroValorMin('');
    setFiltroValorMax('');
  };

  const hayFiltros = filtroTipo || filtroLocalidad || filtroEstado || filtroPropietario || filtroAnio || filtroValorMin || filtroValorMax;

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Cargando métricas...</p>
      </div>
    );
  }

  // KPIs
  const totalTasaciones = datosFiltrados.length;
  const totalValor = datosFiltrados.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
  const avgValor = totalTasaciones ? (totalValor / totalTasaciones) : 0;
  const totalSuperficie = datosFiltrados.reduce((acc, curr) => acc + (Number(curr.superficie) || 0), 0);
  const avgSuperficie = totalTasaciones ? (totalSuperficie / totalTasaciones) : 0;

  // Gráfico por Tipo
  const tiposCount = datosFiltrados.reduce((acc, curr) => {
    const k = curr.tipo || 'Sin tipo';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const dataTipos = Object.entries(tiposCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Gráfico por Localidad (Top 10)
  const localidadesCount = datosFiltrados.reduce((acc, curr) => {
    const k = curr.localidad || 'Sin localidad';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const dataLocalidades = Object.entries(localidadesCount)
    .map(([name, cantidad]) => ({ name, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  // Gráfico por Estado
  const estadosCount = datosFiltrados.reduce((acc, curr) => {
    const k = curr.estado || 'Sin estado';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const dataEstados = Object.entries(estadosCount).map(([name, value]) => ({ name, value }));

  // Evolución temporal (por mes)
  const evolucionMensual = datosFiltrados.reduce((acc, curr) => {
    if (!curr.fecha) return acc;
    const d = new Date(curr.fecha);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = { mes: key, cantidad: 0, valorTotal: 0 };
    acc[key].cantidad += 1;
    acc[key].valorTotal += Number(curr.valor) || 0;
    return acc;
  }, {});
  const dataEvolucion = Object.values(evolucionMensual).sort((a, b) => a.mes.localeCompare(b.mes));

  // Valor por propietario (Top 8)
  const propietariosValor = datosFiltrados.reduce((acc, curr) => {
    const k = curr.propietario || 'Sin tasador';
    if (!acc[k]) acc[k] = { nombre: k, valor: 0, count: 0 };
    acc[k].valor += Number(curr.valor) || 0;
    acc[k].count += 1;
    return acc;
  }, {});
  const dataPropietarios = Object.values(propietariosValor)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8)
    .map(p => ({ name: p.nombre, valor: Math.round(p.valor), fichas: p.count }));

  return (
    <div className="page-container dashboard-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Dashboard Analítico</h2>
          <p className="text-muted">
            Resumen interactivo de tasaciones
            {hayFiltros && <span className="filter-badge">{datosFiltrados.length} de {data.length} registros</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn-icon" onClick={handleRefresh} disabled={refreshing} title="Actualizar datos">
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>
      </header>

      {/* Panel de Filtros */}
      <div className="card filter-panel">
        <div className="filter-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} />
            <h3>Filtros</h3>
          </div>
          {hayFiltros && (
            <button className="btn-link" onClick={limpiarFiltros}>Limpiar filtros</button>
          )}
        </div>
        <div className="form-grid form-grid-4">
          <div className="form-group">
            <label>Tipo</label>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todos</option>
              {opcionesTipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Localidad</label>
            <select value={filtroLocalidad} onChange={e => setFiltroLocalidad(e.target.value)}>
              <option value="">Todas</option>
              {opcionesLocalidades.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Estado</label>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              {opcionesEstados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Tasador</label>
            <select value={filtroPropietario} onChange={e => setFiltroPropietario(e.target.value)}>
              <option value="">Todos</option>
              {opcionesPropietarios.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Año</label>
            <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
              <option value="">Todos</option>
              {opcionesAnios.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Valor mín. (€)</label>
            <input type="number" min="0" value={filtroValorMin} onChange={e => setFiltroValorMin(e.target.value)} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Valor máx. (€)</label>
            <input type="number" min="0" value={filtroValorMax} onChange={e => setFiltroValorMax(e.target.value)} placeholder="Sin límite" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><FileText size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Tasaciones</span>
            <span className="kpi-value">{totalTasaciones.toLocaleString('es-ES')}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-green"><Euro size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Valor Total</span>
            <span className="kpi-value">{totalValor.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-purple"><TrendingUp size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Valor Promedio</span>
            <span className="kpi-value">{avgValor.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-orange"><MapPin size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Sup. Media</span>
            <span className="kpi-value">{avgSuperficie.toLocaleString('es-ES', { maximumFractionDigits: 0 })} m²</span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        {/* Evolución temporal */}
        <div className="chart-card chart-card-wide">
          <h3>Evolución Temporal</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dataEvolucion} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="mes" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="cantidad" name="Fichas" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="valorTotal" name="Valor (€)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Localidades */}
        <div className="chart-card">
          <h3>Top Localidades</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataLocalidades} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="cantidad" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por Tipo */}
        <div className="chart-card">
          <h3>Distribución por Tipo</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={dataTipos}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {dataTipos.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estado */}
        <div className="chart-card">
          <h3>Por Estado</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={dataEstados}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {dataEstados.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Valor por Propietario */}
        <div className="chart-card chart-card-wide">
          <h3>Top Tasadores por Valor</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataPropietarios} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  formatter={(value) => `${Number(value).toLocaleString('es-ES')} €`}
                />
                <Bar dataKey="valor" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
