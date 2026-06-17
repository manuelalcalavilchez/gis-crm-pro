const BASE_URL = import.meta.env.VITE_API_URL;

export async function searchItems(query) {
  // Búsqueda por solicitante_nombre
  const searchQuery = query ? `&solicitante_nombre=ilike.*${query}*` : '';
  const res = await fetch(`${BASE_URL}/informes_tasacion?limit=50${searchQuery}`);
  return res.json();
}
