import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Save, Trash2, MapPin, Calendar, Euro, User, Tag, FileText, AlertTriangle } from 'lucide-react';
import { getInformeCompleto, updateInforme, deleteInforme } from '../api/postgrest';

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
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => { loadFicha(); }, [id]);

  const loadFicha = async () => {
    setLoading(true);
    try {
      const data = await getInformeCompleto(id);
      if (data) { setFicha(data); setEditData(data); }
      else setError('Informe no encontrado');
    } catch (err) { setError('Error al cargar el informe'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = {
        numero_informe: editData.numero_informe,
        solicitante_nombre: editData.solicitante_nombre,
        municipio: editData.municipio,
        provincia: editData.provincia,
        paraje: editData.paraje,
        clase_general: editData.clase_general,
        estado_actual: editData.estado_actual,
        valor_mercado_adoptado: Number(editData.valor_mercado_adoptado) || null,
        latitud: parseFloat(editData.latitud) || null,
        longitud: parseFloat(editData.longitud) || null,
        observaciones_generales: editData.observaciones_generales,
        finalidad: editData.finalidad,
      };
      Object.keys(payload).forEach(k => { if (payload[k] === null || payload[k] === '') delete payload[k]; });
      const result = await updateInforme(id, payload);
      setFicha({ ...ficha, ...result[0] });
      setEditing(false);
      setSuccess('Informe actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await deleteInforme(id); navigate('/dashboard', { replace: true }); }
    catch { setError('Error al eliminar'); setShowDeleteConfirm(false); }
  };

  const handleChange = (field, value) => setEditData(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="loading-state"><div className="spinner"></div><p>Cargando informe completo...</p></div>;
  if (!ficha) return <div className="page-container"><div className="empty-state"><AlertTriangle size={48} /><h3>Informe no encontrado</h3><button className="btn-primary" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Volver</button></div></div>;

  const formatVal = (v) => v ? Number(v).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : '—';

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'ubicacion', label: 'Ubicación' },
    { id: 'catastro', label: 'Catastro' },
    { id: 'cultivos', label: 'Cultivos' },
    { id: 'mejoras', label: 'Mejoras' },
    { id: 'valoracion', label: 'Valoración' },
    { id: 'reservas', label: 'Reservas' },
  ];

  return (
    <div className="page-container">
      <header className="ficha-header">
        <button className="btn-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /><span>Volver</span></button>
        <div className="ficha-header-actions">
          {!editing ? (
            <>
              <button className="btn-secondary" onClick={() => setEditing(true)}><Edit3 size={16} /> Editar</button>
              <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}><Trash2 size={16} /> Eliminar</button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => { setEditing(false); setEditData(ficha); }}>Cancelar</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}><Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}</button>
            </>
          )}
        </div>
      </header>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><AlertTriangle size={16} /> {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Confirmar eliminación</h3>
            <p>¿Eliminar el informe <strong>{ficha.numero_informe || `ID-${ficha.id}`}</strong>? Se borrarán todos los datos asociados (catastro, cultivos, mejoras, reservas).</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
              <button className="btn-danger" onClick={handleDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Cabecera */}
      <div className="ficha-title-card card">
        <div className="ficha-title-row">
          <div>
            <h1>{editing ? <input className="ficha-title-input" value={editData.numero_informe || ''} onChange={e => handleChange('numero_informe', e.target.value)} /> : (ficha.numero_informe || `INF-${ficha.id}`)}</h1>
            <div className="ficha-meta">
              <span className="status-badge status-active">{ficha.estado_actual}</span>
              <span className="ficha-meta-item"><Calendar size={14} /> {ficha.fecha_emision || 'Sin fecha'}</span>
              <span className="ficha-meta-item"><MapPin size={14} /> {ficha.municipio || 'Sin municipio'}</span>
            </div>
          </div>
          <div className="ficha-valor-display">
            <span className="ficha-valor-label">Valor Adoptado</span>
            {editing ? <input type="number" className="ficha-valor-input" value={editData.valor_mercado_adoptado || ''} onChange={e => handleChange('valor_mercado_adoptado', e.target.value)} />
              : <span className="ficha-valor-amount">{formatVal(ficha.valor_mercado_adoptado)}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ficha-tabs">
        {tabs.map(tab => (
          <button key={tab.id} className={`ficha-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </div>

      {/* Contenido por tab */}
      <div className="ficha-content">
        {activeTab === 'general' && (
          <div className="ficha-grid">
            <div className="ficha-section card">
              <h3><User size={16} /> Solicitante</h3>
              <div className="ficha-fields">
                <Field label="Nombre" value={ficha.solicitante_nombre} editing={editing} field="solicitante_nombre" editData={editData} onChange={handleChange} />
                <Field label="DNI" value={ficha.solicitante_dni} />
                <Field label="Dirección" value={ficha.solicitante_direccion} />
                <Field label="Municipio" value={ficha.solicitante_municipio} />
                <Field label="Provincia" value={ficha.solicitante_provincia} />
              </div>
            </div>
            <div className="ficha-section card">
              <h3><Tag size={16} /> Identificación</h3>
              <div className="ficha-fields">
                <Field label="Clase" value={ficha.clase_general} editing={editing} field="clase_general" editData={editData} onChange={handleChange} />
                <Field label="Estado actual" value={ficha.estado_actual} editing={editing} field="estado_actual" editData={editData} onChange={handleChange} />
                <Field label="Finalidad" value={ficha.finalidad} editing={editing} field="finalidad" editData={editData} onChange={handleChange} />
                <Field label="Referencia cliente" value={ficha.referencia_cliente} />
                <Field label="Sociedad" value={ficha.sociedad_nombre} />
                <Field label="CIF" value={ficha.sociedad_cif} />
              </div>
            </div>
            <div className="ficha-section card ficha-section-wide">
              <h3><FileText size={16} /> Observaciones</h3>
              {editing ? <textarea className="ficha-textarea" value={editData.observaciones_generales || ''} onChange={e => handleChange('observaciones_generales', e.target.value)} rows={4} />
                : <p className="ficha-observations">{ficha.observaciones_generales || 'Sin observaciones'}</p>}
            </div>
          </div>
        )}

        {activeTab === 'ubicacion' && (
          <div className="ficha-grid">
            <div className="ficha-section card">
              <h3><MapPin size={16} /> Localización</h3>
              <div className="ficha-fields">
                <Field label="Municipio" value={ficha.municipio} editing={editing} field="municipio" editData={editData} onChange={handleChange} />
                <Field label="Provincia" value={ficha.provincia} editing={editing} field="provincia" editData={editData} onChange={handleChange} />
                <Field label="Paraje" value={ficha.paraje} editing={editing} field="paraje" editData={editData} onChange={handleChange} />
                <Field label="Dirección" value={ficha.direccion} />
                <Field label="Latitud" value={ficha.latitud} editing={editing} field="latitud" editData={editData} onChange={handleChange} />
                <Field label="Longitud" value={ficha.longitud} editing={editing} field="longitud" editData={editData} onChange={handleChange} />
              </div>
            </div>
            <div className="ficha-section card">
              <h3>Urbanismo</h3>
              <div className="ficha-fields">
                <Field label="Planeamiento" value={ficha.planeamiento_vigente} />
                <Field label="Clasificación suelo" value={ficha.clasificacion_suelo} />
                <Field label="Calificación suelo" value={ficha.calificacion_suelo} />
                <Field label="Uso predominante" value={ficha.uso_predominante} />
                <Field label="Servidumbres" value={ficha.servidumbres} />
                <Field label="Protecciones" value={ficha.protecciones} />
              </div>
            </div>
            <div className="ficha-section card">
              <h3>Morfología</h3>
              <div className="ficha-fields">
                <Field label="Clima" value={ficha.clima} />
                <Field label="Orografía" value={ficha.orografia} />
                <Field label="Pendiente" value={ficha.pendiente_media_porcentaje ? `${ficha.pendiente_media_porcentaje}%` : null} />
                <Field label="Textura" value={ficha.textura_suelo} />
                <Field label="Riego" value={ficha.sistema_riego} />
                <Field label="Procedencia agua" value={ficha.procedencia_agua} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'catastro' && (
          <div className="ficha-grid">
            <div className="ficha-section card ficha-section-wide">
              <h3>Datos Catastrales</h3>
              {ficha.datos_catastrales?.length > 0 ? (
                <table className="data-table"><thead><tr><th>Ref. Catastral</th><th>Polígono</th><th>Parcela</th><th>Superficie</th><th>Uso</th></tr></thead>
                  <tbody>{ficha.datos_catastrales.map((dc, i) => (
                    <tr key={i}><td style={{fontWeight:600}}>{dc.referencia_catastral}</td><td>{dc.poligono}</td><td>{dc.parcela}</td><td>{dc.superficie_catastral_m2} m²</td><td>{dc.uso_catastral}</td></tr>
                  ))}</tbody></table>
              ) : <p className="text-muted">Sin datos catastrales registrados</p>}
            </div>
            <div className="ficha-section card ficha-section-wide">
              <h3>Datos Registrales</h3>
              {ficha.datos_registrales?.length > 0 ? (
                <table className="data-table"><thead><tr><th>Nº Finca</th><th>Descripción</th><th>Superficie</th><th>Titularidad</th><th>Cargas</th></tr></thead>
                  <tbody>{ficha.datos_registrales.map((dr, i) => (
                    <tr key={i}><td>{dr.numero_finca}</td><td>{dr.descripcion_registral}</td><td>{dr.superficie_registral}</td><td>{dr.titularidad}</td><td>{dr.cargas}</td></tr>
                  ))}</tbody></table>
              ) : <p className="text-muted">Sin datos registrales</p>}
            </div>
          </div>
        )}

        {activeTab === 'cultivos' && (
          <div className="ficha-section card ficha-section-wide">
            <h3>Cultivos</h3>
            {ficha.cultivos?.length > 0 ? (
              <table className="data-table"><thead><tr><th>Sector</th><th>Tipo Cultivo</th><th>Superficie (ha)</th><th>Año Plantación</th><th>Estado</th></tr></thead>
                <tbody>{ficha.cultivos.map((c, i) => (
                  <tr key={i}><td>{c.sector}</td><td style={{fontWeight:600}}>{c.tipo_cultivo}</td><td>{c.superficie_ha}</td><td>{c.ano_plantacion || '—'}</td><td>{c.estado_produccion || '—'}</td></tr>
                ))}</tbody></table>
            ) : <p className="text-muted">Sin cultivos registrados</p>}
          </div>
        )}

        {activeTab === 'mejoras' && (
          <div className="ficha-section card ficha-section-wide">
            <h3>Mejoras e Instalaciones</h3>
            {ficha.mejoras?.length > 0 ? (
              <table className="data-table"><thead><tr><th>Tipo</th><th>Superficie (m²)</th><th>Año Construcción</th><th>Vida Útil Restante</th></tr></thead>
                <tbody>{ficha.mejoras.map((m, i) => (
                  <tr key={i}><td style={{fontWeight:600}}>{m.tipo_mejora}</td><td>{m.superficie_m2 || '—'}</td><td>{m.ano_instalacion_construccion || '—'}</td><td>{m.vida_util_restante_anos ? `${m.vida_util_restante_anos} años` : '—'}</td></tr>
                ))}</tbody></table>
            ) : <p className="text-muted">Sin mejoras registradas</p>}
          </div>
        )}

        {activeTab === 'valoracion' && (
          <div className="ficha-grid">
            <div className="ficha-section card">
              <h3><Euro size={16} /> Método Comparación</h3>
              <div className="ficha-fields">
                <Field label="Superficie" value={ficha.valor_comparacion_superficie} />
                <Field label="Valor unitario" value={ficha.valor_comparacion_unitario ? `${Number(ficha.valor_comparacion_unitario).toLocaleString('es-ES')} €` : null} />
                <Field label="Valor total" value={ficha.valor_comparacion_total ? formatVal(ficha.valor_comparacion_total) : null} />
              </div>
              {ficha.valor_comparacion_detalles && <p className="ficha-observations" style={{marginTop:'0.75rem', fontSize:'0.85rem'}}>{ficha.valor_comparacion_detalles}</p>}
            </div>
            <div className="ficha-section card">
              <h3>Actualización Rentas</h3>
              <div className="ficha-fields">
                <Field label="Renta anual" value={ficha.renta_anual} />
                <Field label="Tasa actualización" value={ficha.tasa_actualizacion} />
                <Field label="Valor actualizado" value={ficha.valor_actualizacion_rentas ? formatVal(ficha.valor_actualizacion_rentas) : null} />
              </div>
            </div>
            <div className="ficha-section card">
              <h3>Método Coste</h3>
              <div className="ficha-fields">
                <Field label="Coste reposición" value={ficha.valor_coste_reposicion ? formatVal(ficha.valor_coste_reposicion) : null} />
                <Field label="Depreciación" value={ficha.valor_coste_depreciacion ? formatVal(ficha.valor_coste_depreciacion) : null} />
                <Field label="Valor final" value={ficha.valor_coste_final ? formatVal(ficha.valor_coste_final) : null} />
              </div>
            </div>
            <div className="ficha-section card">
              <h3>Resumen Final</h3>
              <div className="ficha-fields">
                <Field label="Valor de mercado" value={formatVal(ficha.valor_mercado)} />
                <Field label="Valor hipotecario" value={formatVal(ficha.valor_hipotecario)} />
                <Field label="Valor adoptado" value={formatVal(ficha.valor_mercado_adoptado)} highlight />
                <Field label="Método principal" value={ficha.metodo_principal} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reservas' && (
          <div className="ficha-grid">
            <div className="ficha-section card ficha-section-wide">
              <h3>Reservas y Condicionantes</h3>
              {ficha.reservas?.length > 0 ? (
                <table className="data-table"><thead><tr><th>Código</th><th>Descripción</th></tr></thead>
                  <tbody>{ficha.reservas.map((r, i) => (
                    <tr key={i}><td><span className="badge">{r.codigo || `R${i+1}`}</span></td><td>{r.descripcion}</td></tr>
                  ))}</tbody></table>
              ) : <p className="text-muted">Sin reservas ni condicionantes</p>}
            </div>
            <div className="ficha-section card ficha-section-wide">
              <h3>Comprobaciones</h3>
              {ficha.comprobaciones?.length > 0 ? (
                <ul style={{listStyle:'none',padding:0}}>{ficha.comprobaciones.map((c, i) => (
                  <li key={i} style={{padding:'0.5rem 0',borderBottom:'1px solid var(--border-color)',fontSize:'0.9rem'}}>{c.descripcion}</li>
                ))}</ul>
              ) : <p className="text-muted">Sin comprobaciones registradas</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente auxiliar para campos
function Field({ label, value, editing, field, editData, onChange, highlight }) {
  const displayValue = value || '—';
  return (
    <div className={`ficha-field ${highlight ? 'highlight' : ''}`}>
      <label>{label}</label>
      {editing && field && onChange ? (
        <input value={editData?.[field] || ''} onChange={e => onChange(field, e.target.value)} />
      ) : (
        <span className="field-value">{displayValue}</span>
      )}
    </div>
  );
}
