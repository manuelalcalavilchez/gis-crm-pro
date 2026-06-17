import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useStore } from '../store/useStore';
import { searchItems } from '../api/postgrest';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="loading-state">Cargando métricas...</div>;
  }

  const totalTasaciones = data.length;
  const totalValor = data.reduce((acc, curr) => acc + (Number(curr.valor_mercado_adoptado) || 0), 0);
  const avgValor = totalTasaciones ? (totalValor / totalTasaciones) : 0;

  // Preparar datos para gráfico de usos
  const usosCount = data.reduce((acc, curr) => {
    const uso = curr.uso_predominante || 'Desconocido';
    acc[uso] = (acc[uso] || 0) + 1;
    return acc;
  }, {});
  const dataUsos = Object.keys(usosCount).map(key => ({ name: key, value: usosCount[key] }));

  // Preparar datos para gráfico de municipios
  const municipiosCount = data.reduce((acc, curr) => {
    const mun = curr.municipio || 'Desconocido';
    acc[mun] = (acc[mun] || 0) + 1;
    return acc;
  }, {});
  const dataMunicipios = Object.keys(municipiosCount)
    .map(key => ({ name: key, cantidad: municipiosCount[key] }))
    .sort((a,b) => b.cantidad - a.cantidad)
    .slice(0, 5); // Top 5

  return (
    <div className="page-container dashboard-page">
      <header className="page-header">
        <h2>Dashboard Analítico</h2>
        <p className="text-muted">Resumen global de tasaciones</p>
      </header>

      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Tasaciones</h3>
          <div className="kpi-value">{totalTasaciones}</div>
        </div>
        <div className="kpi-card">
          <h3>Valor de Mercado Promedio</h3>
          <div className="kpi-value">{avgValor.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
        </div>
        <div className="kpi-card">
          <h3>Valor Total Tasado</h3>
          <div className="kpi-value">{totalValor.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Top 5 Municipios</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataMunicipios} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)' }} />
                <Bar dataKey="cantidad" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Distribución por Uso Predominante</h3>
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
