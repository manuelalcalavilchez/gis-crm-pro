import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, ArrowRight, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { importInformes } from '../api/postgrest';

export default function ImportarJSON() {
  const [files, setFiles] = useState([]); // multiple selected files
  const [status, setStatus] = useState('idle'); // idle, loaded, uploading, success, error
  const [message, setMessage] = useState('');
  const [rawData, setRawData] = useState([]);
  const navigate = useNavigate();

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const selected = Array.from(fileList);
    setFiles(selected);
    try {
      const allData = [];
      for (const f of selected) {
        const text = await f.text();
        const json = JSON.parse(text);
        const dataArray = Array.isArray(json) ? json : [json];
        allData.push(...dataArray);
      }
      setRawData(allData);
      setStatus('loaded');
      setMessage('');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Alguno de los archivos no es un JSON válido');
    }
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
  };

  const procesarYSubir = async () => {
    setStatus('uploading');

    try {
      // Mapeador Inteligente: adaptamos los campos del JSON a los campos de nuestra BBDD
      const mappedData = rawData.map(item => ({
        numero_informe: String(item.id || item.numero_informe || Math.floor(Math.random()*100000)),
        solicitante_nombre: item.solicitante_nombre || 'Importación Masiva',
        municipio: item.municipio || (item.direccion && item.direccion.split(',').pop().trim()) || 'Desconocido',
        provincia: item.provincia || 'Desconocida',
        direccion: item.direccion || '',
        paraje: item.paraje || '',
        uso_predominante: item.uso_predominante || 'Residencial',
        clase_general: item.clase_general || item.tipo || 'Finca Rústica',
        estado_actual: item.estado || item.estado_actual || 'Pendiente',
        finalidad: item.finalidad || 'Asesoramiento - Valor de mercado',
        sociedad_nombre: item.sociedad_nombre || item.propietario || '',
        fecha_emision: item.fecha_emision || item.fecha || null,
        latitud: Number(item.lat || item.latitud || 0),
        longitud: Number(item.lng || item.longitud || 0),
        valor_mercado_adoptado: Number(
          String(item.valor_tasado || item.valor_mercado_adoptado || 0)
            .replace(/[^0-9.-]+/g,"")
        )
      }));

      await importInformes(mappedData);

      setStatus('success');
      setMessage(`Se han importado ${mappedData.length} registros correctamente.`);
      setFiles([]);
      setRawData([]);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Error al procesar el JSON en la base de datos.');
    }
  };

   // Drag & drop handlers
   const onDragOver = (e) => {
     e.preventDefault();
     e.stopPropagation();
   };
   const onDrop = (e) => {
     e.preventDefault();
     e.stopPropagation();
     if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
       handleFiles(e.dataTransfer.files);
       e.dataTransfer.clearData();
     }
   };
   const localizeEnMapa = (lat, lng) => {
    // Para simplificar, en esta vista solo abrimos el mapa, la comunicación de coordenadas se haría por el store
    navigate('/');
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Auditoría e Importación</h2>
        <p className="text-muted">Carga un JSON, revisa las fichas de auditoría y vuelca a base de datos.</p>
      </header>

      {status === 'idle' || status === 'error' || status === 'success' ? (
        <div className="card import-card" onDragOver={onDragOver} onDrop={onDrop}>
          <div className="upload-zone">
            <UploadCloud size={48} className="upload-icon" />
            <h3>Selecciona o arrastra tu archivo JSON</h3>
            <input 
              type="file" 
              accept=".json"
              multiple
              onChange={handleFileChange} 
              className="file-input"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="btn-primary">
              Buscar archivo
            </label>
            {files.length > 0 && <p className="file-name">Seleccionados: {files.length} archivo(s)</p>}
          </div>

          {status === 'success' && (
            <div className="alert alert-success">
              <CheckCircle size={20} />
              <span>{message}</span>
            </div>
          )}
          
          {status === 'error' && (
            <div className="alert alert-error">
              <AlertTriangle size={20} />
              <span>{message}</span>
            </div>
          )}
        </div>
      ) : null}

      {(status === 'loaded' || status === 'uploading') && (
        <div className="auditoria-container">
          <div className="alert alert-success" style={{marginBottom: '2rem', display:'flex', justifyContent:'space-between'}}>
            <span>JSON Leído: {rawData.length} registros detectados listos para importar.</span>
            <button className="btn-success" onClick={procesarYSubir} disabled={status==='uploading'}>
              {status==='uploading' ? 'Procesando...' : 'Confirmar Volcado a BBDD'}
            </button>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            {rawData.map((registro, idx) => (
              <div key={idx} className="ficha-auditoria card" style={{padding: '1.5rem'}}>
                <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem'}}>
                  <span className="badge" style={{background: 'var(--accent)'}}>ID: #{registro.id || idx+1}</span>
                  <span className="badge">{registro.estado || 'Pendiente'}</span>
                  <span className="badge" style={{fontFamily: 'monospace'}}>{registro.fecha || new Date().toLocaleDateString()}</span>
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                  <div>
                    <h4 style={{color: 'var(--text-muted)', margin: '0 0 0.5rem 0'}}>Ubicación</h4>
                    <p style={{margin: '0 0 0.2rem 0'}}><strong>Dir:</strong> {registro.direccion || registro.municipio || 'Sin dirección'}</p>
                    <p style={{margin: '0'}}>Lat: {registro.lat || registro.latitud} | Lng: {registro.lng || registro.longitud}</p>
                  </div>
                  <div>
                    <h4 style={{color: 'var(--text-muted)', margin: '0 0 0.5rem 0'}}>Valoración Mapeada</h4>
                    <p style={{margin: '0 0 0.2rem 0', color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem'}}>
                      {registro.valor_tasado || registro.valor_mercado_adoptado || '0'}
                    </p>
                    <p style={{margin: '0'}}>Sup: {registro.superficie} m²</p>
                  </div>
                </div>

                <div style={{marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', overflowX: 'auto'}}>
                  <h4 style={{margin: '0 0 0.5rem 0', color: 'var(--accent)', fontSize: '0.85rem'}}>Payload Raw</h4>
                  <pre style={{margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                    {JSON.stringify(registro.metadatos || registro, null, 2)}
                  </pre>
                </div>

                <div style={{marginTop: '1.5rem', display: 'flex', gap: '1rem'}}>
                  <button className="btn-primary" onClick={() => localizeEnMapa(registro.lat, registro.lng)}>
                    Localizar en Mapa <ArrowRight size={16}/>
                  </button>
                  <button className="login-button" style={{background: 'transparent', border: '1px solid var(--border-color)'}}>
                    <Eye size={16}/> Inspeccionar JSON
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
