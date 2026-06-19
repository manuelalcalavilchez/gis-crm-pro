const BASE_URL = import.meta.env.VITE_API_URL || 'https://n8n-postgrest-api.n9xpuu.easypanel.host';

export { BASE_URL };

// ── Importación de Tasaciones (tabla principal) ──

export async function searchTasaciones(query, filters = {}) {
  let params = [];

  // Búsqueda textual global
  if (query) {
    const q = encodeURIComponent(`*${query}*`);
    params.push(`or=(referencia.ilike.${q},propietario.ilike.${q},localidad.ilike.${q},tipo.ilike.${q},observaciones.ilike.${q})`);
  }

  // Filtros exactos
  if (filters.tipo) params.push(`tipo=eq.${encodeURIComponent(filters.tipo)}`);
  if (filters.localidad) params.push(`localidad=eq.${encodeURIComponent(filters.localidad)}`);
  if (filters.estado) params.push(`estado=eq.${encodeURIComponent(filters.estado)}`);
  if (filters.propietario) params.push(`propietario=eq.${encodeURIComponent(filters.propietario)}`);

  // Rango de fechas
  if (filters.fechaDesde) params.push(`fecha=gte.${filters.fechaDesde}`);
  if (filters.fechaHasta) params.push(`fecha=lte.${filters.fechaHasta}`);

  // Rango de valor
  if (filters.valorMin) params.push(`valor=gte.${filters.valorMin}`);
  if (filters.valorMax) params.push(`valor=lte.${filters.valorMax}`);

  // Ordenar por fecha descendente, traer todos los registros
  params.push('order=fecha.desc');
  params.push('limit=10000');

  const queryStr = params.length > 0 ? `?${params.join('&')}` : '';
  const res = await fetch(`${BASE_URL}/importacion_tasaciones${queryStr}`);
  if (!res.ok) throw new Error('Error al buscar tasaciones');
  return res.json();
}

export async function getTasacionById(id) {
  const res = await fetch(`${BASE_URL}/importacion_tasaciones?id=eq.${id}`);
  if (!res.ok) throw new Error('Error al obtener tasación');
  const data = await res.json();
  return data[0] || null;
}

export async function createTasacion(payload) {
  const res = await fetch(`${BASE_URL}/importacion_tasaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al crear tasación: ${errText}`);
  }
  return res.json();
}

export async function updateTasacion(id, payload) {
  const res = await fetch(`${BASE_URL}/importacion_tasaciones?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar tasación');
  return res.json();
}

export async function deleteTasacion(id) {
  const res = await fetch(`${BASE_URL}/importacion_tasaciones?id=eq.${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar tasación');
  return res;
}

export async function importTasaciones(dataArray) {
  const res = await fetch(`${BASE_URL}/importacion_tasaciones?on_conflict=referencia`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(dataArray)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error en importación: ${errText}`);
  }
  return res.json();
}

// ── Usuarios ──

export async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/usuarios?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(password)}`);
  if (!res.ok) throw new Error('Error de conexión');
  return res.json();
}

export async function fetchUsuarios() {
  const res = await fetch(`${BASE_URL}/usuarios?order=email.asc`);
  if (!res.ok) throw new Error('Error al cargar usuarios');
  return res.json();
}

export async function createUsuario(userData) {
  // Solo enviar los campos que existen en la tabla: email, password, role
  const payload = {
    email: userData.email,
    password: userData.password,
    role: userData.role || 'tasador'
  };
  const res = await fetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al crear usuario: ${errText}`);
  }
  return res.json();
}

export async function updateUsuario(email, userData) {
  // Filtrar por email (clave primaria), solo actualizar campos válidos
  const payload = {};
  if (userData.role) payload.role = userData.role;
  if (userData.password) payload.password = userData.password;

  const res = await fetch(`${BASE_URL}/usuarios?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar usuario');
  return res.json();
}

export async function deleteUsuario(email) {
  const res = await fetch(`${BASE_URL}/usuarios?email=eq.${encodeURIComponent(email)}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Error al eliminar usuario');
  return res;
}
