import { useState } from 'react';
import { Save, MapPin, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createInforme } from '../api/postgrest';

const CLASES = ['Finca R\u00fastica', 'Urbano', 'Industrial', 'Comercial', 'Residencial'];

export default function NuevaFicha() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    numero_informe: '',
    clase_general: 'Finca R\u00fastica',
    solicitante_nombre: '',
    municipio: '',
    provincia: '',
    estado_actual: 'En explotaci\u00f3n agr\u00edcola',
    finalidad: 'Asesoramiento - Valor de mercado',
    valor_mercado_adoptado: '',
    latitud: '',
    longitud: '',
    paraje: '',
    observaciones_generales: ''
  });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const generateRef = () => {
    const prefix = formData.clase_general ? formData.clase_general.substring(0, 3).toUpperCase() : 'INF';
    const timestamp = Date.now().toString(36).toUpperCase();
    setFormData({ ...formData, numero_informe: `${prefix}-${timestamp}` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    setErrorMsg('');

    try {
      const payload = {
        numero_informe: formData.numero_informe || null,
        clase_general: formData.clase_general,
        solicitante_nombre: formData.solicitante_nombre || null,
        municipio: formData.municipio || null,
        provincia: formData.provincia || null,
        estado_actual: formData.estado_actual,
        finalidad: formData.finalidad,
        valor_mercado_adoptado: Number(formData.valor_mercado_adoptado) || null,
        latitud: parseFloat(formData.latitud) || null,
        longitud: parseFloat(formData.longitud) || null,
        paraje: formData.paraje || null,
        observaciones_generales: formData.observaciones_generales || null,
      };

      // Limpiar nulls
      Object.keys(payload).forEach(k => { if (payload[k] === null) delete payload[k]; });

      const result = await createInforme(payload);
      setStatus('success');
      setTimeout(() => {
        if (result && result[0]?.id) navigate(`/ficha/${result[0].id}`);
        else navigate('/dashboard');
      }, 1200);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Error al guardar. Verifica que el n\u00famero de informe sea \u00fanico.');
    }
  };

  const resetForm = () => {
    setFormData({ numero_informe: '', clase_general: 'Finca R\u00fastica', solicitante_nombre: '', municipio: '', provincia: '', estado_actual: 'En explotaci\u00f3n agr\u00edcola', finalidad: 'Asesoramiento - Valor de mercado', valor_mercado_adoptado: '', latitud: '', longitud: '', paraje: '', observaciones_generales: '' });
    setStatus('idle'); setErrorMsg('');
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Nuevo Informe de Tasaci\u00f3n</h2>
        <p className="text-muted">Alta manual r\u00e1pida. Para importar datos completos desde JSON/PDF usa la secci\u00f3n Importar.</p>
      </header>

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-section">
          <h3>Identificaci\u00f3n</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>N\u00ba Informe</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input name="numero_informe" value={formData.numero_informe} onChange={handleChange} placeholder="Ej: VT-2024-001" style={{ flex: 1 }} />
                <button type="button" className="btn-icon" onClick={generateRef} title="Generar"><RotateCcw size={16} /></button>
              </div>
            </div>
            <div className="form-group">
              <label>Clase de Inmueble</label>
              <select name="clase_general" value={formData.clase_general} onChange={handleChange}>
                {CLASES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Solicitante</label>
              <input name="solicitante_nombre" value={formData.solicitante_nombre} onChange={handleChange} placeholder="Nombre del solicitante" />
            </div>
            <div className="form-group">
              <label>Finalidad</label>
              <input name="finalidad" value={formData.finalidad} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3><MapPin size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />Ubicaci\u00f3n</h3>
          <div className="form-grid">
            <div className="form-group"><label>Municipio</label><input name="municipio" value={formData.municipio} onChange={handleChange} placeholder="Ej: Roquetas de Mar" /></div>
            <div className="form-group"><label>Provincia</label><input name="provincia" value={formData.provincia} onChange={handleChange} placeholder="Ej: Almer\u00eda" /></div>
            <div className="form-group"><label>Paraje</label><input name="paraje" value={formData.paraje} onChange={handleChange} placeholder="Ej: Los Llanos" /></div>
            <div className="form-group"><label>Estado actual</label><input name="estado_actual" value={formData.estado_actual} onChange={handleChange} /></div>
            <div className="form-group"><label>Latitud</label><input name="latitud" value={formData.latitud} onChange={handleChange} placeholder="36.8381" /></div>
            <div className="form-group"><label>Longitud</label><input name="longitud" value={formData.longitud} onChange={handleChange} placeholder="-2.4597" /></div>
          </div>
        </div>

        <div className="form-section">
          <h3>Valoraci\u00f3n</h3>
          <div className="form-grid">
            <div className="form-group highlight-group">
              <label>Valor de Mercado Adoptado (\u20ac)</label>
              <input type="number" step="0.01" name="valor_mercado_adoptado" value={formData.valor_mercado_adoptado} onChange={handleChange} placeholder="0.00" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Observaciones</h3>
          <div className="form-group">
            <textarea name="observaciones_generales" value={formData.observaciones_generales} onChange={handleChange} placeholder="Notas, reservas, condicionantes..." rows={4} className="form-textarea" />
          </div>
        </div>

        <div className="form-actions">
          <div>
            {status === 'error' && <span className="text-error">{errorMsg}</span>}
            {status === 'success' && <span className="text-success">Informe creado. Redirigiendo...</span>}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={resetForm}><RotateCcw size={16} /> Limpiar</button>
            <button type="submit" className="btn-primary" disabled={status === 'saving'}>
              <Save size={18} /><span>{status === 'saving' ? 'Guardando...' : 'Crear Informe'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
