import { useState, useCallback } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileJson, FileText, Trash2, Eye, EyeOff, Send, RefreshCw, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { importTasaciones } from '../api/postgrest';

export default function ImportarJSON() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, loaded, uploading, success, error
  const [message, setMessage] = useState('');
  const [rawData, setRawData] = useState([]);
  const [mappedData, setMappedData] = useState([]);
  const [showRaw, setShowRaw] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  // Mapeo inteligente de campos del JSON/PDF a la tabla importacion_tasaciones
  const mapRecord = (item) => {
    // Extraer coordenadas de múltiples formatos posibles
    let lote = '36.8381,-2.4597'; // Default Almería
    if (item.lote) {
      lote = item.lote;
    } else if (item.latitud && item.longitud) {
      lote = `${item.latitud},${item.longitud}`;
    } else if (item.lat && item.lng) {
      lote = `${item.lat},${item.lng}`;
    } else if (item.coordenadas) {
      lote = item.coordenadas;
    }

    return {
      referencia: String(item.referencia || item.numero_informe || item.id || `IMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      tipo: item.tipo || item.clase_general || item.uso_predominante || 'Rústico',
      propietario: item.propietario || item.solicitante_nombre || item.sociedad_nombre || 'Desconocido',
      localidad: item.localidad || item.municipio || item.ciudad || 'Almería',
      estado: item.estado || item.estado_actual || 'Finalizado',
      valor: Number(String(item.valor || item.valor_mercado_adoptado || item.valor_tasado || 0).replace(/[^0-9.-]+/g, '')) || 0,
      superficie: Number(String(item.superficie || item.superficie_total || item.metros || 0).replace(/[^0-9.-]+/g, '')) || 0,
      lote,
      observaciones: item.observaciones || item.notas || item.paraje || item.direccion || null
    };
  };

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const selected = Array.from(fileList);
    setFiles(selected);

    try {
      const allData = [];
      for (const f of selected) {
        if (f.name.endsWith('.json')) {
          const text = await f.text();
          const json = JSON.parse(text);
          const dataArray = Array.isArray(json) ? json : [json];
          allData.push(...dataArray);
        } else if (f.name.endsWith('.pdf')) {
          // Para PDF: extraer texto básico (limitación del navegador)
          // En un entorno real usaríamos pdf.js o un servicio backend
          allData.push({
            referencia: `PDF-${f.name.replace('.pdf', '')}-${Date.now()}`,
            tipo: 'Rústico',
            propietario: 'Importado desde PDF',
            localidad: 'Pendiente revisión',
            estado: 'Pendiente',
            valor: 0,
            superficie: 0,
            observaciones: `Archivo PDF: ${f.name} - Requiere revisión manual de datos`
          });
        }
      }

      setRawData(allData);
      setMappedData(allData.map(mapRecord));
      setStatus('loaded');
      setMessage('');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Error al procesar los archivos. Verifica que los JSON sean válidos.');
    }
  };

  const handleFileChange = (e) => handleFiles(e.target.files);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const procesarYSubir = async () => {
    setStatus('uploading');
    try {
      const result = await importTasaciones(mappedData);
      setStatus('success');
      setMessage(`Se han importado ${mappedData.length} registros correctamente.`);
      setFiles([]);
      setRawData([]);
      setMappedData([]);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Error al importar los registros en la base de datos.');
    }
  };

  const removeRecord = (idx) => {
    setRawData(prev => prev.filter((_, i) => i !== idx));
    setMappedData(prev => prev.filter((_, i) => i !== idx));
    if (rawData.length <= 1) {
      setStatus('idle');
      setFiles([]);
    }
  };

  const editMappedField = (idx, field, value) => {
    setMappedData(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const toggleRaw = (idx) => {
    setShowRaw(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const reset = () => {
    setStatus('idle');
    setFiles([]);
    setRawData([]);
    setMappedData([]);
    setMessage('');
    setShowRaw({});
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Importar Tasaciones</h2>
        <p className="text-muted">Sube archivos JSON o PDF, revisa el mapeo y vuelca a la base de datos.</p>
      </header>

      {/* Zona de Upload */}
      {(status === 'idle' || status === 'error' || status === 'success') && (
        <div
          className={`card import-card ${dragActive ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-zone">
            <div className="upload-icon-wrapper">
              <UploadCloud size={48} />
            </div>
            <h3>Arrastra archivos aquí o haz clic para seleccionar</h3>
            <p className="text-muted">Formatos soportados: <strong>.json</strong> y <strong>.pdf</strong></p>
            <input
              type="file"
              accept=".json,.pdf"
              multiple
              onChange={handleFileChange}
              className="file-input"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="btn-primary" style={{ marginTop: '1rem' }}>
              <FileJson size={18} />
              <span>Seleccionar archivos</span>
            </label>
            {files.length > 0 && (
              <p className="file-name">
                <FileText size={14} /> {files.map(f => f.name).join(', ')}
              </p>
            )}
          </div>

          {status === 'success' && (
            <div className="alert alert-success">
              <CheckCircle size={20} />
              <span>{message}</span>
              <button className="btn-link" onClick={() => navigate('/dashboard')}>Ver en Dashboard</button>
            </div>
          )}

          {status === 'error' && (
            <div className="alert alert-error">
              <AlertTriangle size={20} />
              <span>{message}</span>
            </div>
          )}
        </div>
      )}

      {/* Preview y Mapeo */}
      {(status === 'loaded' || status === 'uploading') && (
        <div className="import-preview">
          {/* Barra de acciones */}
          <div className="import-actions-bar">
            <div className="import-summary">
              <CheckCircle size={18} color="var(--green)" />
              <span><strong>{mappedData.length}</strong> registros listos para importar</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={reset}>
                <RefreshCw size={16} /> Cancelar
              </button>
              <button className="btn-primary" onClick={procesarYSubir} disabled={status === 'uploading'}>
                <Send size={16} />
                <span>{status === 'uploading' ? 'Importando...' : 'Confirmar Importación'}</span>
              </button>
            </div>
          </div>

          {/* Lista de registros mapeados */}
          <div className="import-records">
            {mappedData.map((record, idx) => (
              <div key={idx} className="import-record-card card">
                <div className="record-header">
                  <div className="record-badges">
                    <span className="badge badge-accent">#{idx + 1}</span>
                    <span className="badge">{record.tipo}</span>
                    <span className="badge badge-green">{record.estado}</span>
                  </div>
                  <div className="record-actions">
                    <button className="btn-icon-sm" onClick={() => toggleRaw(idx)} title="Ver JSON original">
                      {showRaw[idx] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button className="btn-icon-sm btn-danger" onClick={() => removeRecord(idx)} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="record-fields">
                  <div className="record-field">
                    <label>Referencia</label>
                    <input value={record.referencia} onChange={e => editMappedField(idx, 'referencia', e.target.value)} />
                  </div>
                  <div className="record-field">
                    <label>Tasador</label>
                    <input value={record.propietario} onChange={e => editMappedField(idx, 'propietario', e.target.value)} />
                  </div>
                  <div className="record-field">
                    <label>Localidad</label>
                    <input value={record.localidad} onChange={e => editMappedField(idx, 'localidad', e.target.value)} />
                  </div>
                  <div className="record-field">
                    <label>Tipo</label>
                    <input value={record.tipo} onChange={e => editMappedField(idx, 'tipo', e.target.value)} />
                  </div>
                  <div className="record-field">
                    <label>Valor (€)</label>
                    <input type="number" value={record.valor} onChange={e => editMappedField(idx, 'valor', Number(e.target.value))} />
                  </div>
                  <div className="record-field">
                    <label>Superficie (m²)</label>
                    <input type="number" value={record.superficie} onChange={e => editMappedField(idx, 'superficie', Number(e.target.value))} />
                  </div>
                  <div className="record-field">
                    <label>Coordenadas (lat,lng)</label>
                    <input value={record.lote} onChange={e => editMappedField(idx, 'lote', e.target.value)} />
                  </div>
                  <div className="record-field record-field-wide">
                    <label>Observaciones</label>
                    <input value={record.observaciones || ''} onChange={e => editMappedField(idx, 'observaciones', e.target.value)} />
                  </div>
                </div>

                {showRaw[idx] && (
                  <div className="record-raw">
                    <h4>JSON Original</h4>
                    <pre>{JSON.stringify(rawData[idx], null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
