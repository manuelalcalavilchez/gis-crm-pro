import { useState } from 'react';
import { Save } from 'lucide-react';
import { createInforme } from '../api/postgrest';

export default function NuevaFicha() {
  const [formData, setFormData] = useState({
    numero_informe: '',
    solicitante_nombre: '',
    municipio: '',
    provincia: '',
    direccion: '',
    paraje: '',
    uso_predominante: '',
    clase_general: '',
    estado_actual: '',
    finalidad: '',
    sociedad_nombre: '',
    fecha_emision: '',
    latitud: '',
    longitud: '',
    valor_mercado_adoptado: ''
  });
  const [status, setStatus] = useState('idle');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('saving');

    try {
      // Formatear números
      const payload = {
        ...formData,
        latitud: formData.latitud ? parseFloat(formData.latitud) : null,
        longitud: formData.longitud ? parseFloat(formData.longitud) : null,
        valor_mercado_adoptado: formData.valor_mercado_adoptado ? parseFloat(formData.valor_mercado_adoptado) : null,
        fecha_emision: formData.fecha_emision || null
      };

      await createInforme(payload);
      
      setStatus('success');
      setFormData({
        numero_informe: '', solicitante_nombre: '', municipio: '', provincia: '',
        direccion: '', paraje: '', uso_predominante: '', clase_general: '',
        estado_actual: '', finalidad: '', sociedad_nombre: '', fecha_emision: '',
        latitud: '', longitud: '', valor_mercado_adoptado: ''
      });
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Nueva Ficha de Tasación</h2>
        <p className="text-muted">Introduce los datos manualmente para un nuevo registro.</p>
      </header>

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-section">
          <h3>Datos Generales</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Número de Informe</label>
              <input required name="numero_informe" value={formData.numero_informe} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Solicitante</label>
              <input required name="solicitante_nombre" value={formData.solicitante_nombre} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Sociedad Tasadora</label>
              <input name="sociedad_nombre" value={formData.sociedad_nombre} onChange={handleChange} placeholder="Ej: Valoraciones Mediterráneo, S.A." />
            </div>
            <div className="form-group">
              <label>Finalidad</label>
              <input name="finalidad" value={formData.finalidad} onChange={handleChange} placeholder="Ej: Asesoramiento - Valor de mercado" />
            </div>
            <div className="form-group">
              <label>Fecha de Emisión</label>
              <input type="date" name="fecha_emision" value={formData.fecha_emision} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Ubicación y Geometría</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Provincia</label>
              <input required name="provincia" value={formData.provincia} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Municipio</label>
              <input required name="municipio" value={formData.municipio} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input name="direccion" value={formData.direccion} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Paraje</label>
              <input name="paraje" value={formData.paraje} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Latitud</label>
              <input type="number" step="any" required name="latitud" value={formData.latitud} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Longitud</label>
              <input type="number" step="any" required name="longitud" value={formData.longitud} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Detalles de Tasación</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Clase General</label>
              <input name="clase_general" value={formData.clase_general} onChange={handleChange} placeholder="Ej: Finca Rústica" />
            </div>
            <div className="form-group">
              <label>Uso Predominante</label>
              <input required name="uso_predominante" value={formData.uso_predominante} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Estado Actual</label>
              <input required name="estado_actual" value={formData.estado_actual} onChange={handleChange} />
            </div>
            <div className="form-group highlight-group">
              <label>Valor de Mercado (€)</label>
              <input type="number" step="any" required name="valor_mercado_adoptado" value={formData.valor_mercado_adoptado} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="form-actions">
          {status === 'error' && <span className="text-error">Error al guardar. Verifica los datos.</span>}
          {status === 'success' && <span className="text-success">¡Ficha guardada con éxito!</span>}
          <button type="submit" className="btn-primary" disabled={status === 'saving'}>
            <Save size={18} />
            <span>{status === 'saving' ? 'Guardando...' : 'Guardar Ficha'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
