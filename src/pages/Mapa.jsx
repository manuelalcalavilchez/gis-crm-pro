import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import SearchBar from "../components/SearchBar";
import ConnectionStatus from "../components/ConnectionStatus";
import { searchInformes, deleteInforme } from "../api/postgrest";
import { useStore } from "../store/useStore";
import { MapPin, Euro, Ruler, Tag, Calendar, ExternalLink, User, List, X, Edit3, Trash2, FileText } from "lucide-react";

export default function Mapa() {
  const { items, setItems, selected, setSelected, resultCount } = useStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showList, setShowList] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    handleSearch('');
    setSelected(null);
  }, []);

  const handleSearch = async (q) => {
    setLoading(true);
    try {
      const res = await searchInformes(q);
      setItems(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteInforme(selected.id);
      const updated = items.filter(i => i.id !== selected.id);
      setItems(updated);
      setSelected(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el informe');
    } finally {
      setDeleting(false);
    }
  };

  const formatValue = (val) => val ? Number(val).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : 'Sin valorar';

  return (
    <div className="mapa-page">
      <header className="page-header mapa-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2><MapPin size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />Visor Cartográfico</h2>
          <ConnectionStatus compact />
          <span className="badge badge-accent">{resultCount} informes</span>
        </div>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </header>

      <main className="mapa-content">
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
                onClick={() => setSelected(item)}
              >
                <div className="ficha-list-item-top">
                  <span className="ficha-list-ref">{item.numero_informe || `INF-${item.id}`}</span>
                  <span className={`status-dot status-dot-active`}></span>
                </div>
                <div className="ficha-list-item-info">
                  <span className="ficha-list-loc">{item.municipio || 'Sin municipio'}</span>
                  <span className="ficha-list-valor">{formatValue(item.valor_mercado_adoptado)}</span>
                </div>
                <div className="ficha-list-item-meta">
                  <span>{item.solicitante_nombre || item.clase_general || ''}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {!showList && (
          <button className="fichas-list-toggle" onClick={() => setShowList(true)} title="Mostrar fichas">
            <List size={18} />
            <span>{items.length}</span>
          </button>
        )}

        <section className="map-container">
          <MapView items={items} selected={selected} onSelect={setSelected} />
          {loading && <div className="loading-overlay"><div className="spinner"></div></div>}
        </section>

        <aside className="mapa-sidebar">
          {selected ? (
            <div className="card ficha-sidebar-card">
              <div className="sidebar-card-header">
                <h2>{selected.numero_informe || `INF-${selected.id}`}</h2>
                <span className="status-badge status-active">{selected.estado_actual || 'Activo'}</span>
              </div>

              <div className="details">
                <div className="detail-item">
                  <span className="label"><User size={12} /> Solicitante</span>
                  <span className="value">{selected.solicitante_nombre || 'Sin asignar'}</span>
                </div>
                <div className="detail-item">
                  <span className="label"><MapPin size={12} /> Municipio</span>
                  <span className="value">{selected.municipio || '---'} ({selected.provincia || ''})</span>
                </div>
                <div className="detail-item">
                  <span className="label"><Tag size={12} /> Clase</span>
                  <span className="value">{selected.clase_general || 'Finca Rústica'}</span>
                </div>
                <div className="detail-item">
                  <span className="label"><FileText size={12} /> Finalidad</span>
                  <span className="value">{selected.finalidad || '---'}</span>
                </div>
                {selected.latitud && selected.longitud && (
                  <div className="detail-item">
                    <span className="label">Coordenadas</span>
                    <span className="value field-mono">{Number(selected.latitud).toFixed(5)}, {Number(selected.longitud).toFixed(5)}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label"><Calendar size={12} /> Fecha emisión</span>
                  <span className="value">{selected.fecha_emision || 'Sin fecha'}</span>
                </div>
                <div className="detail-item highlight">
                  <span className="label"><Euro size={12} /> Valor Adoptado</span>
                  <span className="value">{formatValue(selected.valor_mercado_adoptado)}</span>
                </div>
                {selected.paraje && (
                  <div className="detail-item">
                    <span className="label">Paraje</span>
                    <span className="value">{selected.paraje}</span>
                  </div>
                )}
              </div>

              <div className="sidebar-actions">
                <button className="btn-primary" onClick={() => navigate(`/ficha/${selected.id}`)}>
                  <ExternalLink size={15} /> Ver Completo
                </button>
                <button className="btn-secondary" onClick={() => navigate(`/ficha/${selected.id}`)}>
                  <Edit3 size={15} />
                </button>
                <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><MapPin size={48} /></div>
              <p>Selecciona un informe en el mapa o en la lista</p>
              <small className="text-muted">{items.length} informes cargados</small>
            </div>
          )}
        </aside>

        {showDeleteConfirm && selected && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <h3>Eliminar Informe</h3>
              <p>¿Seguro que quieres eliminar <strong>{selected.numero_informe || `INF-${selected.id}`}</strong>? Se borrarán también los datos catastrales, cultivos y mejoras asociados.</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
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
