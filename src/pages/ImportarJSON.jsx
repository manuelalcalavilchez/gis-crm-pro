import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ImportarJSON() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const BASE_URL = import.meta.env.VITE_API_URL || 'https://n8n-postgrest-api.n9xpuu.easypanel.host';
      const res = await fetch(`${BASE_URL}/informes_tasacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(json)
      });

      if (!res.ok) {
        throw new Error(`Error en el servidor: ${res.statusText}`);
      }

      setStatus('success');
      setMessage(`Se han importado ${Array.isArray(json) ? json.length : 1} registros correctamente.`);
      setFile(null);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Error al procesar el JSON. Asegúrate de que el formato coincide con la tabla informes_tasacion.');
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Importación Masiva</h2>
        <p className="text-muted">Sube un archivo JSON con las nuevas tasaciones.</p>
      </header>

      <div className="card import-card">
        <div className="upload-zone">
          <UploadCloud size={48} className="upload-icon" />
          <h3>Selecciona o arrastra tu archivo JSON</h3>
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileChange} 
            className="file-input"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="btn-primary">
            Buscar archivo
          </label>
          {file && <p className="file-name">Archivo seleccionado: {file.name}</p>}
        </div>

        <div className="upload-actions">
          <button 
            className="btn-success" 
            onClick={handleUpload} 
            disabled={!file || status === 'uploading'}
          >
            {status === 'uploading' ? 'Procesando...' : 'Iniciar Importación'}
          </button>
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
    </div>
  );
}
