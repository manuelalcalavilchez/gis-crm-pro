import { useState, useEffect } from "react";
import MapView from "../components/MapView";
import SearchBar from "../components/SearchBar";
import { searchItems } from "../api/postgrest";
import { useStore } from "../store/useStore";

export default function Mapa() {
  const { items, setItems, selected, setSelected } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleSearch('');
  }, []);

  const handleSearch = async (q) => {
    setLoading(true);
    try {
      const res = await searchItems(q);
      setItems(res);
      if (res.length > 0 && !selected) {
         setSelected(res[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mapa-page">
      <header className="page-header">
        <h2>Visor Cartográfico</h2>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </header>

      <main className="mapa-content">
        <section className="map-container">
          <MapView
            items={items}
            selected={selected}
            onSelect={setSelected}
          />
          {loading && <div className="loading-overlay"><div className="spinner"></div></div>}
        </section>

        <aside className="mapa-sidebar">
          {selected ? (
            <div className="card">
              <h2>{selected.solicitante_nombre || "Sin Solicitante"}</h2>
              <p className="subtitle">{selected.numero_informe}</p>
              
              <div className="details">
                <div className="detail-item">
                  <span className="label">Municipio</span>
                  <span className="value">{selected.municipio} ({selected.provincia})</span>
                </div>
                <div className="detail-item">
                  <span className="label">Uso Predominante</span>
                  <span className="value">{selected.uso_predominante}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Estado</span>
                  <span className="value">{selected.estado_actual}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Coordenadas</span>
                  <span className="value">{Number(selected.latitud).toFixed(4)}, {Number(selected.longitud).toFixed(4)}</span>
                </div>
                <div className="detail-item highlight">
                  <span className="label">Valor Mercado</span>
                  <span className="value">{selected.valor_mercado_adoptado ? `${selected.valor_mercado_adoptado.toLocaleString()} €` : 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📍</div>
              <p>Selecciona una tasación en el mapa para ver sus detalles</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
