import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Filter } from 'lucide-react';
import ConnectionStatus from '../components/ConnectionStatus.jsx';
import { searchItems } from '../api/postgrest';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de estado
  const [filtroProvincia, setFiltroProvincia] = useState('');
  const [filtroUso, setFiltroUso] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  // Nuevos filtros
  const [filtroCultivo, setFiltroCultivo] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroTasador, setFiltroTasador] = useState('');
  const [baseMunicipio, setBaseMunicipio] = useState('');
  const [radioKm, setRadioKm] = useState('');


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
   const opcionesCultivos = useMemo(() => [...new Set(data.map(d => d.clase_general).filter(Boolean))], [data]);
   const opcionesAnios = useMemo(() => {
     const years = data.map(d => {
       const f = d.fecha_emision || d.fecha_creacion_registro;
       return f ? String(new Date(f).getFullYear()) : null;
     }).filter(Boolean);
     return [...new Set(years)].sort();
   }, [data]);
   const opcionesTasadores = useMemo(() => [...new Set(data.map(d => d.sociedad_nombre).filter(Boolean))], [data]);
   const opcionesMunicipios = useMemo(() => [...new Set(data.map(d => d.municipio).filter(Boolean))], [data]);


  // Aplicar filtros a los datos
  const datosFiltrados = useMemo(() => {
     return data.filter(item => {
       if (filtroProvincia && item.provincia !== filtroProvincia) return false;
       if (filtroUso && item.uso_predominante !== filtroUso) return false;
       if (filtroEstado && item.estado_actual !== filtroEstado) return false;
       if (filtroCultivo && item.clase_general !== filtroCultivo) return false;
       if (filtroAnio) {
         const f = item.fecha_emision || item.fecha_creacion_registro;
         const itemAnio = f ? String(new Date(f).getFullYear()) : '';
         if (itemAnio !== filtroAnio) return false;
       }
       if (filtroTasador && item.sociedad_nombre !== filtroTasador) return false;
       // Filtro por distancia
       if (baseMunicipio && radioKm) {
         const base = data.find(d => d.municipio === baseMunicipio);
         if (base && base.latitud && base.longitud) {
           const distance = getDistanceFromLatLonInKm(base.latitud, base.longitud, item.latitud, item.longitud);
           if (distance > Number(radioKm)) return false;
         }
       }
       return true;
     });

  }, [data, filtroProvincia, filtroUso, filtroEstado, filtroCultivo, filtroAnio, filtroTasador, baseMunicipio, radioKm]);

  if (loading) {
    return <div className="loading-state">Cargando métricas...</div>;
  }

  const totalTasaciones = datosFiltrados.length;
  const totalValor = datosFiltrados.reduce((acc, curr) => acc + (Number(curr.valor_mercado_adoptado) || 0), 0);
  const avgValor = totalTasaciones ? (totalValor / totalTasaciones) : 0;

   // Función de distancia (haversine)
   function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
     const R = 6371; // Radio de la Tierra en km
     const dLat = deg2rad(lat2 - lat1);
     const dLon = deg2rad(lon2 - lon1);
     const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
               Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
               Math.sin(dLon/2) * Math.sin(dLon/2);
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
     return R * c;
   }
   function deg2rad(deg) {
     return deg * (Math.PI/180);
   }

  // Preparar datos para gráfico de usos
  const usosCount = datosFiltrados.reduce((acc, curr) => {
    const uso = curr.uso_predominante || 'Desconocido';
    acc[uso] = (acc[uso] || 0) + 1;
    return acc;
  }, {});
  const dataUsos = Object.keys(usosCount).map(key => ({ name: key, value: usosCount[key] }));

  // Preparar datos para gráficos superiores
  const cultivosCount = datosFiltrados.reduce((acc, curr) => { const k = curr.clase_general || 'Desconocido'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const dataCultivos = Object.keys(cultivosCount).map(k => ({ name: k, value: cultivosCount[k] }));

  const aniosCount = datosFiltrados.reduce((acc, curr) => { const f = curr.fecha_emision || curr.fecha_creacion_registro; const k = f ? new Date(f).getFullYear() : 'Desconocido'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const dataAnios = Object.keys(aniosCount).map(k => ({ name: k, value: aniosCount[k] }));

  const tasadoresCount = datosFiltrados.reduce((acc, curr) => { const k = curr.sociedad_nombre || 'Desconocido'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const dataTasadores = Object.keys(tasadoresCount).map(k => ({ name: k, value: tasadoresCount[k] }));

  const provinciasCount = datosFiltrados.reduce((acc, curr) => { const k = curr.provincia || 'Desconocido'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const dataProvincias = Object.keys(provinciasCount).map(k => ({ name: k, value: provinciasCount[k] }));

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
        <ConnectionStatus />
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
          {/* Nuevos filtros */}
          <div className="form-group">
            <label>Clase General</label>
            <select value={filtroCultivo} onChange={e => setFiltroCultivo(e.target.value)}>
              <option value="">Todas las clases</option>
              {opcionesCultivos.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Año</label>
            <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
              <option value="">Todos los años</option>
              {opcionesAnios.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Sociedad Tasadora</label>
            <select value={filtroTasador} onChange={e => setFiltroTasador(e.target.value)}>
              <option value="">Todas las sociedades</option>
              {opcionesTasadores.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Base Municipio (para distancia)</label>
            <select value={baseMunicipio} onChange={e => setBaseMunicipio(e.target.value)}>
              <option value="">Selecciona municipio</option>
              {opcionesMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Radio (km)</label>
            <input type="number" min="0" value={radioKm} onChange={e => setRadioKm(e.target.value)} placeholder="Ej: 10" />
          </div>
        </div>
      </div>

       {/* Visualizaciones superiores */}
       <div className="charts-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
         <div style={{ flex: '1 1 300px', minWidth: '300px', height: '300px' }}>
           <ResponsiveContainer>
             <BarChart data={dataCultivos}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip />
               <Bar dataKey="value" fill="var(--accent)" />
             </BarChart>
           </ResponsiveContainer>
         </div>
         <div style={{ flex: '1 1 300px', minWidth: '300px', height: '300px' }}>
           <ResponsiveContainer>
             <BarChart data={dataAnios}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip />
               <Bar dataKey="value" fill="var(--accent)" />
             </BarChart>
           </ResponsiveContainer>
         </div>
         <div style={{ flex: '1 1 300px', minWidth: '300px', height: '300px' }}>
           <ResponsiveContainer>
             <BarChart data={dataTasadores}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip />
               <Bar dataKey="value" fill="var(--accent)" />
             </BarChart>
           </ResponsiveContainer>
         </div>
         <div style={{ flex: '1 1 300px', minWidth: '300px', height: '300px' }}>
           <ResponsiveContainer>
             <BarChart data={dataProvincias}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip />
               <Bar dataKey="value" fill="var(--accent)" />
             </BarChart>
           </ResponsiveContainer>
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
