import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MapView from "../components/MapView";
import SearchBar from "../components/SearchBar";
import ConnectionStatus from "../components/ConnectionStatus";
import { searchTasaciones, deleteTasacion } from "../api/postgrest";
import { useStore } from "../store/useStore";
import { MapPin, Euro, Ruler, Tag, Calendar, ExternalLink, User, List, X, Edit3, Trash2 } from "lucide-react";

export default function Mapa() {
  const { items, setItems, selected, setSelected } = useStore();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showList, setShowList] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    handleSearch('');
    // Limpiar selección previa para que se vean todos sin filtro
    setSelected(null);
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item) => {
    setSelected(item);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(selected.id);
    try {
      await deleteTasacion(selected.id);
      // Quitar de la lista local
      const updated = items.filter(i => i.id !== selected.id);
      setItems(updated);
      setSelected(updated.length > 0 ? updated[0] : null);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar la ficha');
    } finally {
      setDeleting(null);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2><MapPin size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />Visor Cartográfico</h2>
          <ConnectionStatus compact />
          <span className="badge badge-accent">{items.length} fichas</span>
        </div>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </header>

      <main className="mapa-content">
        {/* Lista de fichas (panel izquierdo) */}
        <aside className={`fichas-list-panel ${showList ? 'open' : 'closed'}`}>
          <div className="fichas-list-header">
            <h3><List size={16} /> Resultados ({items.length})</h3>
            <button className="btn-icon-sm" onClick={() => setShowList(false)} title="Ocultar lista">
              <X size={14} />
            </button>
          </div>
          <div className="fichas-list-scroll">
            {items.map(item => (
              <div
                key={item.id}
                className={`ficha-list-item ${selected?.id === item.id ? 'active' : ''}`}
                onClick={() => handleSelectItem(item)}
              >
                <div className="ficha-list-item-top">
                  <span className="ficha-list-ref">{item.referencia}</span>
                  <span className={`status-dot status-dot-${(item.estado || '').toLowerCase().replace(/\s/g, '-')}`}></span>
                </div>
                <div className="ficha-list-item-info">
                  <span className="ficha-list-loc">{item.localidad}</span>
                  <span className="ficha-list-valor">{Number(item.valor).toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</span>
                </div>
                <div className="ficha-list-item-meta">
                  <span>{item.propietario !== 'Desconocido' ? item.propietario : item.tipo}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Botón para abrir lista si está cerrada */}
        {!showList && (
          <button className="fichas-list-toggle" onClick={() => setShowList(true)} title="Mostrar fichas">
            <List size={18} />
            <span>{items.length}</span>
          </button>
        )}

        {/* Mapa central */}
        <section className="map-container">
          <MapView
            items={items}
            selected={selected}
            onSelect={setSelected}
          />
          {loading && <div className="loading-overlay"><div className="spinner"></div></div>}
        </section>

        {/* Ficha detalle (panel derecho) */}
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
                  <span className="label"><User size={12} /> Tasador</span>
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

              <div className="sidebar-actions">
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/ficha/${selected.id}`)}
                >
                  <ExternalLink size={15} /> Ver / Editar
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/ficha/${selected.id}`)}
                  title="Editar ficha"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  className="btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Eliminar ficha"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <MapPin size={48} />
              </div>
              <p>Selecciona una tasación en el mapa o en la lista</p>
              <small className="text-muted">{items.length} tasaciones cargadas</small>
            </div>
          )}
        </aside>

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && selected && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <h3>Eliminar Ficha</h3>
              <p>¿Seguro que quieres eliminar <strong>{selected.referencia}</strong>? Esta acción no se puede deshacer.</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
                <button className="btn-danger" onClick={handleDelete} disabled={!!deleting}>
                  {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
