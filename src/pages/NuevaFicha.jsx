import { useState } from 'react';
import { Save, MapPin, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createTasacion } from '../api/postgrest';

const TIPOS = ['Rústico', 'Urbano', 'Industrial', 'Comercial', 'Residencial'];
const ESTADOS = ['Finalizado', 'Pendiente', 'En proceso', 'Cancelado'];

export default function NuevaFicha() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    referencia: '',
    tipo: 'Rústico',
    propietario: '',
    localidad: '',
    estado: 'Finalizado',
    valor: '',
    superficie: '',
    lote: '',
    observaciones: ''
  });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateRef = () => {
    const prefix = formData.tipo ? formData.tipo.substring(0, 3).toUpperCase() : 'TAS';
    const timestamp = Date.now().toString(36).toUpperCase();
    setFormData({ ...formData, referencia: `${prefix}-${timestamp}` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    try {
      const payload = {
        referencia: formData.referencia,
        tipo: formData.tipo,
        propietario: formData.propietario || 'Desconocido',
        localidad: formData.localidad || 'Almería',
        estado: formData.estado,
        valor: Number(formData.valor) || 0,
        superficie: Number(formData.superficie) || 0,
        lote: formData.lote || '36.8381,-2.4597',
        observaciones: formData.observaciones || null
      };

      const result = await createTasacion(payload);

      setStatus('success');
      // Redirigir a la ficha creada después de un momento
      setTimeout(() => {
        if (result && result[0]?.id) {
          navigate(`/ficha/${result[0].id}`);
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'Error al guardar. Verifica que la referencia sea única.');
    }
  };

  const resetForm = () => {
    setFormData({
      referencia: '', tipo: 'Rústico', propietario: '', localidad: '',
      estado: 'Finalizado', valor: '', superficie: '', lote: '', observaciones: ''
    });
    setStatus('idle');
    setErrorMsg('');
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Nueva Ficha de Tasación</h2>
        <p className="text-muted">Introduce los datos para registrar una nueva tasación en el sistema.</p>
      </header>

      <form onSubmit={handleSubmit} className="form-card">
        {/* Identificación */}
        <div className="form-section">
          <h3>Identificación</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Referencia *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  required
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  placeholder="Ej: RUS-ABC123"
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn-icon" onClick={generateRef} title="Generar automáticamente">
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Tipo de Inmueble</label>
              <select name="tipo" value={formData.tipo} onChange={handleChange}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select name="estado" value={formData.estado} onChange={handleChange}>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Tasador</label>
              <input
                name="propietario"
                value={formData.propietario}
                onChange={handleChange}
                placeholder="Nombre del tasador"
              />
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="form-section">
          <h3><MapPin size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />Ubicación</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Localidad *</label>
              <input
                required
                name="localidad"
                value={formData.localidad}
                onChange={handleChange}
                placeholder="Ej: Almería, Roquetas de Mar..."
              />
            </div>
            <div className="form-group">
              <label>Coordenadas GPS (lat,lng)</label>
              <input
                name="lote"
                value={formData.lote}
                onChange={handleChange}
                placeholder="36.8381,-2.4597"
              />
              <small className="form-hint">Formato: latitud,longitud</small>
            </div>
          </div>
        </div>

        {/* Valoración */}
        <div className="form-section">
          <h3>Valoración</h3>
          <div className="form-grid">
            <div className="form-group highlight-group">
              <label>Valor de Mercado (€) *</label>
              <input
                type="number"
                step="0.01"
                required
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label>Superficie (m²)</label>
              <input
                type="number"
                step="0.01"
                name="superficie"
                value={formData.superficie}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="form-section">
          <h3>Observaciones</h3>
          <div className="form-group">
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Notas adicionales, parajes, cargas, detalles del terreno..."
              rows={4}
              className="form-textarea"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="form-actions">
          <div>
            {status === 'error' && <span className="text-error">{errorMsg}</span>}
            {status === 'success' && <span className="text-success">¡Ficha creada con éxito! Redirigiendo...</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              <RotateCcw size={16} /> Limpiar
            </button>
            <button type="submit" className="btn-primary" disabled={status === 'saving'}>
              <Save size={18} />
              <span>{status === 'saving' ? 'Guardando...' : 'Crear Ficha'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
