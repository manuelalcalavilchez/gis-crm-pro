import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Save, Trash2, MapPin, Calendar, Euro, Ruler, User, Tag, FileText, AlertTriangle } from 'lucide-react';
import { getTasacionById, updateTasacion, deleteTasacion } from '../api/postgrest';

export default function FichaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadFicha();
  }, [id]);

  const loadFicha = async () => {
    setLoading(true);
    try {
      const data = await getTasacionById(id);
      if (data) {
        setFicha(data);
        setEditData(data);
      } else {
        setError('Tasación no encontrada');
      }
    } catch (err) {
      setError('Error al cargar la tasación');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        referencia: editData.referencia,
        tipo: editData.tipo,
        propietario: editData.propietario,
        localidad: editData.localidad,
        estado: editData.estado,
        valor: Number(editData.valor) || 0,
        superficie: Number(editData.superficie) || 0,
        lote: editData.lote,
        observaciones: editData.observaciones
      };
      const result = await updateTasacion(id, payload);
      setFicha(result[0] || { ...ficha, ...payload });
      setEditing(false);
      setSuccess('Ficha actualizada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTasacion(id);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Error al eliminar la tasación');
      setShowDeleteConfirm(false);
    }
  };

  const handleChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Parsear coordenadas del campo lote
  const getCoords = () => {
    if (!ficha?.lote) return null;
    const parts = ficha.lote.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Cargando ficha...</p>
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <AlertTriangle size={48} />
          <h3>Tasación no encontrada</h3>
          <button className="btn-primary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Volver
          </button>
        </div>
      </div>
    );
  }

  const coords = getCoords();

  return (
    <div className="page-container">
      {/* Header */}
      <header className="ficha-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>
        <div className="ficha-header-actions">
          {!editing ? (
            <>
              <button className="btn-secondary" onClick={() => setEditing(true)}>
                <Edit3 size={16} /> Editar
              </button>
              <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={16} /> Eliminar
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => { setEditing(false); setEditData(ficha); }}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </header>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}><AlertTriangle size={16} /> {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}

      {/* Modal confirmación eliminación */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Confirmar eliminación</h3>
            <p>¿Estás seguro de eliminar la tasación <strong>{ficha.referencia}</strong>? Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              <button className="btn-danger" onClick={handleDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido de la ficha */}
      <div className="ficha-content">
        {/* Cabecera de la ficha */}
        <div className="ficha-title-card card">
          <div className="ficha-title-row">
            <div>
              <h1>{editing ? (
                <input className="ficha-title-input" value={editData.referencia} onChange={e => handleChange('referencia', e.target.value)} />
              ) : ficha.referencia}</h1>
              <div className="ficha-meta">
                <span className={`status-badge status-${(ficha.estado || '').toLowerCase().replace(/\s/g, '-')}`}>
                  {ficha.estado}
                </span>
                <span className="ficha-meta-item"><Calendar size={14} /> {ficha.fecha ? new Date(ficha.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin fecha'}</span>
              </div>
            </div>
            <div className="ficha-valor-display">
              <span className="ficha-valor-label">Valor</span>
              {editing ? (
                <input type="number" className="ficha-valor-input" value={editData.valor} onChange={e => handleChange('valor', e.target.value)} />
              ) : (
                <span className="ficha-valor-amount">{Number(ficha.valor).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
              )}
            </div>
          </div>
        </div>

        {/* Grid de datos */}
        <div className="ficha-grid">
          {/* Datos principales */}
          <div className="ficha-section card">
            <h3><Tag size={16} /> Datos Principales</h3>
            <div className="ficha-fields">
              <div className="ficha-field">
                <label>Tipo de Inmueble</label>
                {editing ? (
                  <select value={editData.tipo} onChange={e => handleChange('tipo', e.target.value)}>
                    <option value="Rústico">Rústico</option>
                    <option value="Urbano">Urbano</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Residencial">Residencial</option>
                  </select>
                ) : (
                  <span className="field-value">{ficha.tipo}</span>
                )}
              </div>
              <div className="ficha-field">
                <label><User size={14} /> Tasador</label>
                {editing ? (
                  <input value={editData.propietario} onChange={e => handleChange('propietario', e.target.value)} />
                ) : (
                  <span className="field-value">{ficha.propietario}</span>
                )}
              </div>
              <div className="ficha-field">
                <label>Estado</label>
                {editing ? (
                  <select value={editData.estado} onChange={e => handleChange('estado', e.target.value)}>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En proceso">En proceso</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                ) : (
                  <span className="field-value">{ficha.estado}</span>
                )}
              </div>
              <div className="ficha-field">
                <label><Ruler size={14} /> Superficie</label>
                {editing ? (
                  <input type="number" value={editData.superficie} onChange={e => handleChange('superficie', e.target.value)} />
                ) : (
                  <span className="field-value">{Number(ficha.superficie).toLocaleString('es-ES')} m²</span>
                )}
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="ficha-section card">
            <h3><MapPin size={16} /> Ubicación</h3>
            <div className="ficha-fields">
              <div className="ficha-field">
                <label>Localidad</label>
                {editing ? (
                  <input value={editData.localidad} onChange={e => handleChange('localidad', e.target.value)} />
                ) : (
                  <span className="field-value">{ficha.localidad}</span>
                )}
              </div>
              <div className="ficha-field">
                <label>Coordenadas (lat, lng)</label>
                {editing ? (
                  <input value={editData.lote} onChange={e => handleChange('lote', e.target.value)} placeholder="36.8381,-2.4597" />
                ) : (
                  <span className="field-value field-mono">{ficha.lote}</span>
                )}
              </div>
            </div>
            {coords && !editing && (
              <button className="btn-link" onClick={() => navigate(`/?lat=${coords.lat}&lng=${coords.lng}`)}>
                <MapPin size={14} /> Ver en mapa
              </button>
            )}
          </div>

          {/* Observaciones */}
          <div className="ficha-section card ficha-section-wide">
            <h3><FileText size={16} /> Observaciones</h3>
            {editing ? (
              <textarea
                className="ficha-textarea"
                value={editData.observaciones || ''}
                onChange={e => handleChange('observaciones', e.target.value)}
                placeholder="Notas adicionales, parajes, cargas..."
                rows={4}
              />
            ) : (
              <p className="ficha-observations">{ficha.observaciones || 'Sin observaciones'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
