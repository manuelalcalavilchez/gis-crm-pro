import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ onSearch, loading }) {
  const [q, setQ] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(q);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <Search size={16} />
        <input
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por referencia, localidad, tasador..."
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        className="search-button"
        disabled={loading}
      >
        {loading ? <div className="spinner-sm"></div> : 'Buscar'}
      </button>
    </form>
  );
}
