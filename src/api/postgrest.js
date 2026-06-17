const BASE_URL = import.meta.env.VITE_API_URL || 'https://n8n-postgrest-api.n9xpuu.easypanel.host';

export async function searchItems(query) {
  // Búsqueda global (or=)
  let searchQuery = '';
  if (query) {
    const q = encodeURIComponent(`*${query}*`);
    searchQuery = `&or=(solicitante_nombre.ilike.${q},municipio.ilike.${q},numero_informe.ilike.${q},provincia.ilike.${q},uso_predominante.ilike.${q},paraje.ilike.${q})`;
  }
  
  const res = await fetch(`${BASE_URL}/informes_tasacion?limit=50${searchQuery}`);
  return res.json();
}
