const BASE_URL = import.meta.env.VITE_API_URL || 'https://n8n-postgrest-api.n9xpuu.easypanel.host';

export { BASE_URL };

// ── Informes de Tasación ──

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

export async function createInforme(payload) {
  const res = await fetch(`${BASE_URL}/informes_tasacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al guardar informe');
  return res;
}

export async function importInformes(dataArray) {
  const res = await fetch(`${BASE_URL}/informes_tasacion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(dataArray)
  });
  if (!res.ok) throw new Error(`Error en el servidor: ${res.statusText}`);
  return res;
}

// ── Usuarios ──

export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/usuarios?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}`);
  return res.json();
}

export async function fetchUsuarios() {
  const res = await fetch(`${BASE_URL}/usuarios`);
  if (!res.ok) throw new Error('Error al cargar usuarios');
  return res.json();
}

export async function createUsuario(userData) {
  const res = await fetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) throw new Error('Error al crear usuario (quizá el correo ya existe)');
  return res;
}

export async function deleteUsuario(email) {
  const res = await fetch(`${BASE_URL}/usuarios?email=eq.${encodeURIComponent(email)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar');
  return res;
}
