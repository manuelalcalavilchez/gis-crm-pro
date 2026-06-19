import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MapView from "../components/MapView";
import SearchBar from "../components/SearchBar";
import { searchTasaciones } from "../api/postgrest";
import { useStore } from "../store/useStore";
import { MapPin, Euro, Ruler, Tag, Calendar, ExternalLink, User } from "lucide-react";

export default function Mapa() {
  const { items, setItems, selected, setSelected } = useStore();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    handleSearch('');
  }, []);

  // Si viene con coordenadas en la URL, seleccionar ese punto
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng && items.length > 0) {
      const target = items.find(item => {
        if (!item.lote) return false;
        const [iLat, iLng] = item.lote.split(',').map(Number);
        return Math.abs(iLat - Number(lat)) < 0.001 && Math.abs(iLng - Number(lng)) < 0.001;
      });
      if (target) setSelected(target);
    }
  }, [items, searchParams]);

  const handleSearch = async (q) => {
    setLoading(true);
    try {
      const res = await searchTasaciones(q);
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

  // Parsear coordenadas del campo lote
  const getCoords = (item) => {
    if (!item?.lote) return null;
    const parts = item.lote.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return null;
  };

  const selectedCoords = getCoords(selected);

  return (
    <div className="mapa-page">
      <header className="page-header mapa-header">
        <h2><MapPin size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />Visor Cartográfico</h2>
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
            <div className="card ficha-sidebar-card">
              <div className="sidebar-card-header">
                <h2>{selected.referencia || "Sin referencia"}</h2>
                <span className={`status-badge status-${(selected.estado || '').toLowerCase().replace(/\s/g, '-')}`}>
                  {selected.estado}
                </span>
              </div>

              <div className="details">
                <div className="detail-item">
                  <span className="label"><User size={12} /> Propietario</span>
                  <span className="value">{selected.propietario || 'Sin asignar'}</span>
                </div>
                <div className="detail-item">
                  <span className="label"><MapPin size={12} /> Localidad</span>
                  <span className="value">{selected.localidad}</span>
                </div>
                <div className="detail-item">
                  <span className="label"><Tag size={12} /> Tipo</span>
                  <span className="value">{selected.tipo}</span>
                </div>
                <div className="detail-item">
                  <span className="label"><Ruler size={12} /> Superficie</span>
                  <span className="value">{Number(selected.superficie).toLocaleString('es-ES')} m²</span>
                </div>
                {selectedCoords && (
                  <div className="detail-item">
                    <span className="label">Coordenadas</span>
                    <span className="value field-mono">{selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label"><Calendar size={12} /> Fecha</span>
                  <span className="value">{selected.fecha ? new Date(selected.fecha).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
                </div>
                <div className="detail-item highlight">
                  <span className="label"><Euro size={12} /> Valor de Mercado</span>
                  <span className="value">{Number(selected.valor).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                </div>
                {selected.observaciones && (
                  <div className="detail-item">
                    <span className="label">Observaciones</span>
                    <span className="value" style={{ fontSize: '0.85rem' }}>{selected.observaciones}</span>
                  </div>
                )}
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', marginTop: '1.5rem' }}
                onClick={() => navigate(`/ficha/${selected.id}`)}
              >
                <ExternalLink size={16} /> Ver ficha completa
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <MapPin size={48} />
              </div>
              <p>Selecciona una tasación en el mapa para ver sus detalles</p>
              <small className="text-muted">{items.length} tasaciones cargadas</small>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
