import { useState } from "react";

export default function SearchBar({ onSearch, loading }) {
  const [q, setQ] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(q);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <input 
        className="search-input"
        value={q} 
        onChange={(e)=>setQ(e.target.value)} 
        placeholder="Buscar por solicitante..." 
        disabled={loading}
      />
      <button 
        type="submit" 
        className="search-button"
        disabled={loading}
      >
        {loading ? '...' : 'Buscar'}
      </button>
    </form>
  );
}
