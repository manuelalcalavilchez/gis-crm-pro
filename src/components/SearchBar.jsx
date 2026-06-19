import { useState } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ onSearch, loading, placeholder = 'Buscar por municipio, referencia, solicitante...' }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(value);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <Search size={16} className={loading ? 'spinning' : ''} />
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          className="search-input-inline"
        />
        {value && (
          <button type="button" className="search-clear" onClick={handleClear}>
            <X size={14} />
          </button>
        )}
      </div>
    </form>
  );
}
