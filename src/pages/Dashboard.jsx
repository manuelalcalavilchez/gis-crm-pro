import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Filter, TrendingUp, MapPin, Euro, FileText, RefreshCw, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchInformes } from '../api/postgrest';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'];

function distanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const [filtroClase, setFiltroClase] = useState('');
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [filtroProvincia, setFiltroProvincia] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroValorMin, setFiltroValorMin] = useState('');
  const [filtroValorMax, setFiltroValorMax] = useState('');
  const [localidadBase, setLocalidadBase] = useState('');
  const [radioKm, setRadioKm] = useState('');

  const fetchData = async () => {
    try {
      const res = await searchInformes('');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const opcionesClases = useMemo(() => [...new Set(data.map(d => d.clase_general).filter(Boolean))].sort(), [data]);
  const opcionesMunicipios = useMemo(() => [...new Set(data.map(d => d.municipio).filter(Boolean))].sort(), [data]);
  const opcionesProvincias = useMemo(() => [...new Set(data.map(d => d.provincia).filter(Boolean))].sort(), [data]);
  const opcionesAnios = useMemo(() => {
    const years = data.map(d => d.fecha_emision ? String(new Date(d.fecha_emision).getFullYear()) : null).filter(Boolean);
    return [...new Set(years)].sort().reverse();
  }, [data]);

  const coordsPorMunicipio = useMemo(() => {
    const map = {};
    data.forEach(item => {
      if (!item.municipio || !item.latitud || !item.longitud) return;
      if (!map[item.municipio]) map[item.municipio] = { lat: 0, lng: 0, count: 0 };
      map[item.municipio].lat += Number(item.latitud);
      map[item.municipio].lng += Number(item.longitud);
      map[item.municipio].count += 1;
    });
    Object.keys(map).forEach(k => {
      map[k].lat /= map[k].count;
      map[k].lng /= map[k].count;
    });
    return map;
  }, [data]);

  const datosFiltrados = useMemo(() => {
    let filtered = data.filter(item => {
      if (filtroClase && item.clase_general !== filtroClase) return false;
      if (filtroMunicipio && item.municipio !== filtroMunicipio) return false;
      if (filtroProvincia && item.provincia !== filtroProvincia) return false;
      if (filtroAnio) {
        const itemAnio = item.fecha_emision ? String(new Date(item.fecha_emision).getFullYear()) : '';
        if (itemAnio !== filtroAnio) return false;
      }
      if (filtroValorMin && Number(item.valor_mercado_adoptado || 0) < Number(filtroValorMin)) return false;
      if (filtroValorMax && Number(item.valor_mercado_adoptado || 0) > Number(filtroValorMax)) return false;
      return true;
    });

    if (localidadBase && coordsPorMunicipio[localidadBase]) {
      const base = coordsPorMunicipio[localidadBase];
      filtered = filtered.filter(item => {
        if (!item.latitud || !item.longitud) return false;
        if (radioKm) {
          const dist = distanciaKm(base.lat, base.lng, Number(item.latitud), Number(item.longitud));
          return dist <= Number(radioKm);
        }
        return true;
      }).map(item => {
        const dist = distanciaKm(base.lat, base.lng, Number(item.latitud), Number(item.longitud));
        return { ...item, _distancia: dist };
      }).sort((a, b) => (a._distancia || 0) - (b._distancia || 0));
    }

    return filtered;
  }, [data, filtroClase, filtroMunicipio, filtroProvincia, filtroAnio, filtroValorMin, filtroValorMax, localidadBase, radioKm, coordsPorMunicipio]);

  const limpiarFiltros = () => {
    setFiltroClase(''); setFiltroMunicipio(''); setFiltroProvincia('');
    setFiltroAnio(''); setFiltroValorMin(''); setFiltroValorMax('');
    setLocalidadBase(''); setRadioKm('');
  };

  const hayFiltros = filtroClase || filtroMunicipio || filtroProvincia || filtroAnio || filtroValorMin || filtroValorMax || localidadBase;

  if (loading) {
    return <div className="loading-state"><div className="spinner"></div><p>Cargando métricas...</p></div>;
  }

  const totalInformes = datosFiltrados.length;
  const totalValor = datosFiltrados.reduce((acc, curr) => acc + (Number(curr.valor_mercado_adoptado) || 0), 0);
  const avgValor = totalInformes ? (totalValor / totalInformes) : 0;
  const conCoordenadas = datosFiltrados.filter(d => d.latitud && d.longitud).length;

  // Datos para gráficos
  const clasesCount = datosFiltrados.reduce((acc, curr) => { const k = curr.clase_general || 'Sin clase'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const dataClases = Object.entries(clasesCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const municipiosCount = datosFiltrados.reduce((acc, curr) => { const k = curr.municipio || 'Sin municipio'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const dataMunicipios = Object.entries(municipiosCount).map(([name, cantidad]) => ({ name, cantidad })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);

  const evolucionMensual = datosFiltrados.reduce((acc, curr) => {
    if (!curr.fecha_emision && !curr.fecha_creacion_registro) return acc;
    const d = new Date(curr.fecha_emision || curr.fecha_creacion_registro);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = { mes: key, cantidad: 0, valorTotal: 0 };
    acc[key].cantidad += 1;
    acc[key].valorTotal += Number(curr.valor_mercado_adoptado) || 0;
    return acc;
  }, {});
  const dataEvolucion = Object.values(evolucionMensual).sort((a, b) => a.mes.localeCompare(b.mes));

  return (
    <div className="page-container dashboard-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Dashboard Analítico</h2>
          <p className="text-muted">
            Resumen interactivo de informes de tasación
            {hayFiltros && <span className="filter-badge">{datosFiltrados.length} de {data.length} informes</span>}
          </p>
        </div>
        <button className="btn-icon" onClick={handleRefresh} disabled={refreshing} title="Actualizar datos">
          <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
        </button>
      </header>

      {/* Filtros */}
      <div className="card filter-panel">
        <div className="filter-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} />
            <h3>Filtros</h3>
            {hayFiltros && <span className="filter-badge">{datosFiltrados.length} resultados</span>}
          </div>
          {hayFiltros && <button className="btn-link" onClick={limpiarFiltros}>Limpiar filtros</button>}
        </div>
        <div className="form-grid form-grid-4">
          <div className="form-group">
            <label>Clase Inmueble</label>
            <select value={filtroClase} onChange={e => setFiltroClase(e.target.value)}>
              <option value="">Todas</option>
              {opcionesClases.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Municipio</label>
            <select value={filtroMunicipio} onChange={e => setFiltroMunicipio(e.target.value)}>
              <option value="">Todos</option>
              {opcionesMunicipios.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Provincia</label>
            <select value={filtroProvincia} onChange={e => setFiltroProvincia(e.target.value)}>
              <option value="">Todas</option>
              {opcionesProvincias.map(p => <option key={p} value={p}>{p}</option>)}
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
        <div className="distance-filter-section">
          <div className="distance-filter-label"><Navigation size={14} /><span>Ordenar por distancia</span></div>
          <div className="form-grid form-grid-4" style={{ marginTop: '0.75rem' }}>
            <div className="form-group">
              <label>Municipio base</label>
              <select value={localidadBase} onChange={e => setLocalidadBase(e.target.value)}>
                <option value="">Sin ordenar</option>
                {opcionesMunicipios.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Radio máx. (km)</label>
              <input type="number" min="0" value={radioKm} onChange={e => setRadioKm(e.target.value)} placeholder="Sin límite" disabled={!localidadBase} />
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><FileText size={24} /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Informes</span>
            <span className="kpi-value">{totalInformes.toLocaleString('es-ES')}</span>
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
            <span className="kpi-label">Con coordenadas</span>
            <span className="kpi-value">{conCoordenadas}</span>
          </div>
        </div>
      </div>

      {/* Tabla resultados por distancia */}
      {localidadBase && (
        <div className="card" style={{ marginBottom: '2rem', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>
              <Navigation size={14} style={{ marginRight: '0.4rem', display: 'inline' }} />
              Informes por distancia a {localidadBase} ({datosFiltrados.length})
            </h3>
          </div>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Dist.</th><th>Nº Informe</th><th>Municipio</th><th>Solicitante</th><th style={{ textAlign: 'right' }}>Valor</th></tr></thead>
              <tbody>
                {datosFiltrados.slice(0, 50).map(item => (
                  <tr key={item.id} onClick={() => navigate(`/ficha/${item.id}`)} style={{ cursor: 'pointer' }}>
                    <td><span className="badge badge-accent">{item._distancia !== undefined ? `${item._distancia.toFixed(1)} km` : '—'}</span></td>
                    <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{item.numero_informe || `INF-${item.id}`}</td>
                    <td style={{ fontSize: '0.82rem' }}>{item.municipio}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.solicitante_nombre || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--green)', fontSize: '0.82rem' }}>
                      {Number(item.valor_mercado_adoptado || 0).toLocaleString('es-ES')} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="charts-grid">
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
                <Line yAxisId="left" type="monotone" dataKey="cantidad" name="Informes" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="valorTotal" name="Valor (€)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Top Municipios</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataMunicipios} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="cantidad" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Distribución por Clase</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={dataClases} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                  {dataClases.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
