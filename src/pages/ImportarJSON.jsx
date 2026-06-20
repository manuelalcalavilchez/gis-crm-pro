import { useState, useCallback } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, FileJson, Trash2, Eye, EyeOff, Send, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { importarLoteMasivo } from '../api/postgrest';

export default function ImportarJSON() {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [rawData, setRawData] = useState([]);
  const [showRaw, setShowRaw] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const navigate = useNavigate();

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
          if (Array.isArray(json)) {
            allData.push(...json);
          } else {
            allData.push(json);
          }
        }
      }
      setRawData(allData);
      setStatus('loaded');
      setMessage(`${allData.length} informe(s) detectados en ${selected.length} archivo(s)`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Error al procesar los archivos. Verifica que los JSON sean válidos.');
    }
  };

  const handleFileChange = (e) => handleFiles(e.target.files);

  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.length > 0) handleFiles(e.dataTransfer.files);
  }, []);

  const procesarYSubir = async () => {
    setStatus('uploading');
    setProgress({ current: 0, total: rawData.length });

    try {
      const resultado = await importarLoteMasivo(rawData);
      setStatus('success');
      setMessage(`Importación completada: ${resultado.exitos} de ${resultado.total} informes importados correctamente.${resultado.errores.length > 0 ? ` ${resultado.errores.length} errores.` : ''}`);
      setFiles([]);
      setRawData([]);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Error al importar los informes en la base de datos.');
    }
  };

  const removeRecord = (idx) => {
    setRawData(prev => prev.filter((_, i) => i !== idx));
    if (rawData.length <= 1) { setStatus('idle'); setFiles([]); }
  };

  const toggleRaw = (idx) => setShowRaw(prev => ({ ...prev, [idx]: !prev[idx] }));

  const reset = () => {
    setStatus('idle'); setFiles([]); setRawData([]);
    setMessage(''); setShowRaw({});
  };

  // Resumen visual de un JSON de informe
  const getResumen = (item) => {
    if (item.identificacion_informe) {
      return {
        titulo: item.identificacion_informe.numero_informe || 'Sin número',
        municipio: item.identificacion_y_localizacion?.municipio || 'Sin municipio',
        clase: item.identificacion_y_localizacion?.clase_general_inmueble || 'Finca Rústica',
        solicitante: item.solicitante_y_finalidad?.solicitante?.nombre || 'Sin solicitante',
        valor: item.valores_tasacion?.resumen_final?.valor_adoptado || item.valores_tasacion?.valor_comparacion?.valor_total || 'Sin valorar',
      };
    }
    // Formato simple/plano
    return {
      titulo: item.numero_informe || item.referencia || `Registro ${Math.random().toString(36).slice(2, 6)}`,
      municipio: item.municipio || item.localidad || '---',
      clase: item.clase_general || item.tipo || '---',
      solicitante: item.solicitante_nombre || item.propietario || '---',
      valor: item.valor_mercado_adoptado || item.valor || '---',
    };
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Importar Informes de Tasación</h2>
        <p className="text-muted">Sube archivos JSON (formato completo de informe o simplificado). Importación masiva a BD.</p>
      </header>

      {(status === 'idle' || status === 'error' || status === 'success') && (
        <div className={`card import-card ${dragActive ? 'drag-active' : ''}`}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className="upload-zone">
            <div className="upload-icon-wrapper"><UploadCloud size={48} /></div>
            <h3>Arrastra archivos JSON aquí o haz clic para seleccionar</h3>
            <p className="text-muted">Cada archivo puede contener un informe o un array de informes</p>
            <input type="file" accept=".json" multiple onChange={handleFileChange} className="file-input" id="file-upload" />
            <label htmlFor="file-upload" className="btn-primary" style={{ marginTop: '1rem' }}>
              <FileJson size={18} /><span>Seleccionar archivos</span>
            </label>
          </div>
          {status === 'success' && (
            <div className="alert alert-success">
              <CheckCircle size={20} /><span>{message}</span>
              <button className="btn-link" onClick={() => navigate('/dashboard')}>Ver en Dashboard</button>
            </div>
          )}
          {status === 'error' && (
            <div className="alert alert-error"><AlertTriangle size={20} /><span>{message}</span></div>
          )}
        </div>
      )}

      {(status === 'loaded' || status === 'uploading') && (
        <div className="import-preview">
          <div className="import-actions-bar">
            <div className="import-summary">
              <CheckCircle size={18} color="var(--green)" />
              <span><strong>{rawData.length}</strong> informe(s) listos para importar</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={reset}><RefreshCw size={16} /> Cancelar</button>
              <button className="btn-primary" onClick={procesarYSubir} disabled={status === 'uploading'}>
                <Send size={16} />
                <span>{status === 'uploading' ? 'Importando...' : 'Confirmar Importación Masiva'}</span>
              </button>
            </div>
          </div>

          <div className="import-records">
            {rawData.map((record, idx) => {
              const resumen = getResumen(record);
              return (
                <div key={idx} className="import-record-card card">
                  <div className="record-header">
                    <div className="record-badges">
                      <span className="badge badge-accent">#{idx + 1}</span>
                      <span className="badge">{resumen.clase}</span>
                      <span className="badge badge-green">{resumen.municipio}</span>
                    </div>
                    <div className="record-actions">
                      <button className="btn-icon-sm" onClick={() => toggleRaw(idx)} title="Ver JSON">
                        {showRaw[idx] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button className="btn-icon-sm btn-danger" onClick={() => removeRecord(idx)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="record-fields">
                    <div className="record-field"><label>Nº Informe</label><span>{resumen.titulo}</span></div>
                    <div className="record-field"><label>Solicitante</label><span>{resumen.solicitante}</span></div>
                    <div className="record-field"><label>Municipio</label><span>{resumen.municipio}</span></div>
                    <div className="record-field"><label>Valor</label><span>{resumen.valor}</span></div>
                  </div>
                  {showRaw[idx] && (
                    <div className="record-raw">
                      <h4>JSON Original</h4>
                      <pre>{JSON.stringify(record, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
