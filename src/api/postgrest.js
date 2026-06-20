/**
 * API PostgREST - Capa de acceso a datos
 * Tabla principal: informes_tasacion
 * Tablas relacionadas: datos_catastrales, datos_registrales, cultivos_informe, mejoras_informe, comprobaciones, reservas_informe, tasadores
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'https://n8n-postgrest-api.n9xpuu.easypanel.host';

export { BASE_URL };

/**
 * Parsea un valor monetario en formato español (136.500,00 €) o anglosajón (136500.00)
 * Devuelve number o null
 */
function parseValorEspanol(s) {
  if (!s) return null;
  let clean = String(s).replace(/[^\d.,\-]/g, '');
  if (!clean) return null;
  // Si tiene coma → formato español (punto=miles, coma=decimal)
  if (clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  }
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}

// ══════════════════════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════════════════════

export async function checkConnection() {
  try {
    const resp = await fetch(`${BASE_URL}/informes_tasacion?select=id&limit=1`, {
      method: 'HEAD',
      headers: { 'Prefer': 'count=exact' }
    });
    if (resp.ok) {
      const range = resp.headers.get('content-range');
      let count = 0;
      if (range) {
        const total = range.split('/')[1];
        if (total && total !== '*') count = Number(total);
      }
      return { online: true, count };
    }
    return { online: false, count: 0 };
  } catch {
    return { online: false, count: 0 };
  }
}

// ══════════════════════════════════════════════════════════
// INFORMES DE TASACION (tabla principal)
// ══════════════════════════════════════════════════════════

export async function searchInformes(query = '', filters = {}) {
  let params = [];

  if (query) {
    const q = encodeURIComponent(`*${query}*`);
    params.push(`or=(numero_informe.ilike.${q},solicitante_nombre.ilike.${q},municipio.ilike.${q},provincia.ilike.${q},paraje.ilike.${q},clase_general.ilike.${q})`);
  }

  if (filters.clase_general) params.push(`clase_general=eq.${encodeURIComponent(filters.clase_general)}`);
  if (filters.municipio) params.push(`municipio=eq.${encodeURIComponent(filters.municipio)}`);
  if (filters.provincia) params.push(`provincia=eq.${encodeURIComponent(filters.provincia)}`);
  if (filters.estado_actual) params.push(`estado_actual=eq.${encodeURIComponent(filters.estado_actual)}`);
  if (filters.fechaDesde) params.push(`fecha_emision=gte.${filters.fechaDesde}`);
  if (filters.fechaHasta) params.push(`fecha_emision=lte.${filters.fechaHasta}`);
  if (filters.valorMin) params.push(`valor_mercado_adoptado=gte.${filters.valorMin}`);
  if (filters.valorMax) params.push(`valor_mercado_adoptado=lte.${filters.valorMax}`);

  params.push('order=fecha_creacion_registro.desc');
  params.push('limit=5000');

  const queryStr = params.length > 0 ? `?${params.join('&')}` : '';
  const res = await fetch(`${BASE_URL}/informes_tasacion${queryStr}`);
  if (!res.ok) throw new Error('Error al buscar informes');
  return res.json();
}

export async function getInformeById(id) {
  const res = await fetch(`${BASE_URL}/informes_tasacion?id=eq.${id}`);
  if (!res.ok) throw new Error('Error al obtener informe');
  const data = await res.json();
  return data[0] || null;
}

export async function getInformeCompleto(id) {
  // Traer informe + todas las tablas hijas
  const [informe, catastrales, registrales, cultivos, mejoras, comprobaciones, reservas] = await Promise.all([
    fetch(`${BASE_URL}/informes_tasacion?id=eq.${id}`).then(r => r.json()),
    fetch(`${BASE_URL}/datos_catastrales?informe_id=eq.${id}`).then(r => r.json()),
    fetch(`${BASE_URL}/datos_registrales?informe_id=eq.${id}`).then(r => r.json()),
    fetch(`${BASE_URL}/cultivos_informe?informe_id=eq.${id}`).then(r => r.json()),
    fetch(`${BASE_URL}/mejoras_informe?informe_id=eq.${id}`).then(r => r.json()),
    fetch(`${BASE_URL}/comprobaciones?informe_id=eq.${id}`).then(r => r.json()),
    fetch(`${BASE_URL}/reservas_informe?informe_id=eq.${id}`).then(r => r.json()),
  ]);

  if (!informe[0]) return null;

  return {
    ...informe[0],
    datos_catastrales: catastrales,
    datos_registrales: registrales,
    cultivos: cultivos,
    mejoras: mejoras,
    comprobaciones: comprobaciones,
    reservas: reservas,
  };
}

export async function createInforme(payload) {
  const res = await fetch(`${BASE_URL}/informes_tasacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al crear informe: ${errText}`);
  }
  return res.json();
}

export async function updateInforme(id, payload) {
  const res = await fetch(`${BASE_URL}/informes_tasacion?id=eq.${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar informe');
  return res.json();
}

export async function deleteInforme(id) {
  const res = await fetch(`${BASE_URL}/informes_tasacion?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar informe');
  return true;
}

// ══════════════════════════════════════════════════════════
// IMPORTACION MASIVA - Adapta el JSON completo a las tablas
// ══════════════════════════════════════════════════════════

export async function importarInformeCompleto(jsonData) {
  // Primero insertar/obtener el tasador
  let tasador_id = null;
  const tasadorNombre = jsonData.identificacion_informe?.tasador?.nombre;
  if (tasadorNombre) {
    try {
      const existente = await fetch(`${BASE_URL}/tasadores?nombre=eq.${encodeURIComponent(tasadorNombre)}`).then(r => r.json());
      if (existente.length > 0) {
        tasador_id = existente[0].id;
      } else {
        const nuevo = await fetch(`${BASE_URL}/tasadores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: JSON.stringify({
            nombre: tasadorNombre,
            titulacion: jsonData.identificacion_informe.tasador.titulacion || null,
            colegiado: jsonData.identificacion_informe.tasador.colegiado || null
          })
        }).then(r => r.json());
        tasador_id = nuevo[0]?.id || null;
      }
    } catch (e) {
      console.warn('Error al gestionar tasador:', e);
    }
  }

  // Mapear JSON completo a la tabla informes_tasacion
  const informe = {
    numero_informe: jsonData.identificacion_informe?.numero_informe || null,
    fecha_emision: jsonData.identificacion_informe?.fecha_emision || null,
    referencia_cliente: jsonData.identificacion_informe?.referencia_cliente || null,
    tasador_id,
    fecha_visita: jsonData.identificacion_informe?.tasador?.fecha_visita || null,
    fecha_validez: jsonData.identificacion_informe?.tasador?.fecha_validez || null,
    sociedad_nombre: jsonData.identificacion_informe?.sociedad_tasacion?.nombre || null,
    sociedad_registro_b_e: jsonData.identificacion_informe?.sociedad_tasacion?.registro_banco_espana || null,
    sociedad_cif: jsonData.identificacion_informe?.sociedad_tasacion?.cif || null,
    domicilio_social: jsonData.identificacion_informe?.sociedad_tasacion?.domicilio_social || null,
    solicitante_nombre: jsonData.solicitante_y_finalidad?.solicitante?.nombre || null,
    solicitante_dni: jsonData.solicitante_y_finalidad?.solicitante?.dni || null,
    solicitante_direccion: jsonData.solicitante_y_finalidad?.solicitante?.direccion || null,
    solicitante_cp: jsonData.solicitante_y_finalidad?.solicitante?.cp || null,
    solicitante_municipio: jsonData.solicitante_y_finalidad?.solicitante?.municipio || null,
    solicitante_provincia: jsonData.solicitante_y_finalidad?.solicitante?.provincia || null,
    solicitante_pais: jsonData.solicitante_y_finalidad?.solicitante?.pais || null,
    entidad_mandataria: jsonData.solicitante_y_finalidad?.entidad_mandataria || null,
    finalidad: jsonData.solicitante_y_finalidad?.finalidad || null,
    observaciones_generales: jsonData.solicitante_y_finalidad?.observaciones || null,
    municipio: jsonData.identificacion_y_localizacion?.municipio || null,
    provincia: jsonData.identificacion_y_localizacion?.provincia || null,
    paraje: jsonData.identificacion_y_localizacion?.paraje || null,
    direccion: jsonData.identificacion_y_localizacion?.direccion || null,
    estado_actual: jsonData.identificacion_y_localizacion?.estado_actual || 'En explotación agrícola',
    clase_general: jsonData.identificacion_y_localizacion?.clase_general_inmueble || 'Finca Rústica',
    ocupacion: jsonData.identificacion_y_localizacion?.ocupacion || null,
    latitud: parseFloat(jsonData.identificacion_y_localizacion?.coordenadas_gps?.latitud) || null,
    longitud: parseFloat(jsonData.identificacion_y_localizacion?.coordenadas_gps?.longitud) || null,
    planeamiento_vigente: jsonData.urbanismo?.planeamiento_vigente || null,
    clasificacion_suelo: jsonData.urbanismo?.clasificacion_suelo || null,
    calificacion_suelo: jsonData.urbanismo?.calificacion_suelo || null,
    uso_predominante: jsonData.urbanismo?.uso_predominante || null,
    aprovechamiento_urbanistico: jsonData.urbanismo?.aprovechamiento_urbanistico || null,
    servidumbres: jsonData.urbanismo?.servidumbres || null,
    protecciones: jsonData.urbanismo?.protecciones || null,
    urbanismo_observaciones: jsonData.urbanismo?.observaciones || null,
    poblacion: jsonData.localidad_y_entorno?.poblacion || null,
    superficie_municipio_km2: parseFloat(jsonData.localidad_y_entorno?.superficie_municipio_km2) || null,
    densidad_poblacion: jsonData.localidad_y_entorno?.densidad_poblacion || null,
    ritmo_crecimiento: jsonData.localidad_y_entorno?.ritmo_crecimiento || null,
    caracterizacion_entorno: jsonData.localidad_y_entorno?.caracterizacion_entorno || null,
    usos_dominantes: jsonData.localidad_y_entorno?.usos_dominantes || null,
    infraestructuras: jsonData.localidad_y_entorno?.infraestructuras || null,
    riesgos_medioambientales: jsonData.localidad_y_entorno?.riesgos_medioambientales || null,
    clima: jsonData.descripcion_y_superficies?.caracteristicas_morfologicas?.clima || null,
    orografia: jsonData.descripcion_y_superficies?.caracteristicas_morfologicas?.orografia || null,
    pendiente_media_porcentaje: parseFloat(jsonData.descripcion_y_superficies?.caracteristicas_morfologicas?.pendiente_media) || null,
    textura_suelo: jsonData.descripcion_y_superficies?.caracteristicas_morfologicas?.textura || null,
    profundidad: jsonData.descripcion_y_superficies?.caracteristicas_morfologicas?.profundidad || null,
    salinidad: jsonData.descripcion_y_superficies?.caracteristicas_morfologicas?.salinidad || null,
    contaminacion: jsonData.descripcion_y_superficies?.caracteristicas_morfologicas?.contaminacion || null,
    descripcion_agrologica: jsonData.descripcion_y_superficies?.descripcion_agrologica || null,
    descripcion_finca: jsonData.descripcion_y_superficies?.descripcion_finca || null,
    energia_electrica: jsonData.descripcion_y_superficies?.infraestructuras_interiores?.energia_electrica === 'Sí',
    agua_regadio: jsonData.descripcion_y_superficies?.infraestructuras_interiores?.agua_regadio === 'Sí',
    procedencia_agua: jsonData.descripcion_y_superficies?.infraestructuras_interiores?.procedencia_agua || null,
    sistema_riego: jsonData.descripcion_y_superficies?.infraestructuras_interiores?.sistema_riego || null,
    red_viaria: jsonData.descripcion_y_superficies?.infraestructuras_interiores?.red_viaria || null,
    otros_infraestructuras: jsonData.descripcion_y_superficies?.infraestructuras_interiores?.otros || null,
    produccion_ultimos_3_anos: jsonData.descripcion_y_superficies?.produccion?.produccion_ultimos_3_anios || null,
    cultivos_recomendados: jsonData.descripcion_y_superficies?.produccion?.cultivos_recomendados || null,
    valor_comparacion_superficie: parseFloat(jsonData.valores_tasacion?.valor_comparacion?.superficie) || null,
    valor_comparacion_unitario: parseValorEspanol(jsonData.valores_tasacion?.valor_comparacion?.valor_unitario),
    valor_comparacion_total: parseValorEspanol(jsonData.valores_tasacion?.valor_comparacion?.valor_total),
    valor_comparacion_detalles: (jsonData.valores_tasacion?.valor_comparacion?.detalles || []).join(' '),
    valor_coste_reposicion: parseValorEspanol(jsonData.valores_tasacion?.valor_coste?.coste_reposicion),
    valor_coste_depreciacion: parseValorEspanol(jsonData.valores_tasacion?.valor_coste?.depreciacion),
    valor_coste_final: parseValorEspanol(jsonData.valores_tasacion?.valor_coste?.valor_final),
    valor_coste_detalles: (jsonData.valores_tasacion?.valor_coste?.detalles || []).join(' '),
    renta_anual: jsonData.valores_tasacion?.valor_actualizacion_rentas?.renta_anual || null,
    tasa_actualizacion: jsonData.valores_tasacion?.valor_actualizacion_rentas?.tasa_actualizacion || null,
    valor_actualizacion_rentas: parseValorEspanol(jsonData.valores_tasacion?.valor_actualizacion_rentas?.valor_actualizado),
    valor_actualizacion_detalles: (jsonData.valores_tasacion?.valor_actualizacion_rentas?.detalles || []).join(' '),
    valor_residual_estatico: parseValorEspanol(jsonData.valores_tasacion?.valor_residual?.residual_estatico),
    valor_residual_dinamico: parseValorEspanol(jsonData.valores_tasacion?.valor_residual?.residual_dinamico),
    valor_residual_detalles: (jsonData.valores_tasacion?.valor_residual?.detalles || []).join(' '),
    mejoras_deducciones: jsonData.valores_tasacion?.mejoras_deducciones || null,
    valor_mercado: parseValorEspanol(jsonData.valores_tasacion?.resumen_final?.valor_mercado),
    valor_hipotecario: parseValorEspanol(jsonData.valores_tasacion?.resumen_final?.valor_hipotecario),
    valor_mercado_adoptado: parseValorEspanol(jsonData.valores_tasacion?.resumen_final?.valor_adoptado),
    metodo_principal: jsonData.valores_tasacion?.resumen_final?.metodo_principal || null,
  };

  // Limpiar nulls y NaN
  Object.keys(informe).forEach(k => {
    if (informe[k] === null || informe[k] === '' || (typeof informe[k] === 'number' && isNaN(informe[k]))) {
      delete informe[k];
    }
  });

  // Insertar informe principal
  const resInforme = await fetch(`${BASE_URL}/informes_tasacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(informe)
  });

  if (!resInforme.ok) {
    const errText = await resInforme.text();
    throw new Error(`Error insertando informe: ${errText}`);
  }

  const informeCreado = await resInforme.json();
  const informe_id = informeCreado[0]?.id;
  if (!informe_id) throw new Error('No se obtuvo ID del informe creado');

  // Insertar datos catastrales
  const refs = jsonData.datos_catastrales?.referencias || [];
  if (refs.length > 0) {
    const catastrales = refs.map(r => ({
      informe_id,
      referencia_catastral: r.referencia_catastral || '',
      poligono: r.poligono || null,
      parcela: r.parcela || null,
      superficie_catastral_m2: parseFloat(r.superficie_catastral) || null,
      uso_catastral: r.uso || null,
      superficie_terreno_m2: parseFloat(r.superficie_terreno) || null,
      ano_edificacion: parseInt(r.ano_edificacion) || null,
      observaciones: r.observaciones || null,
    }));
    await fetch(`${BASE_URL}/datos_catastrales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catastrales)
    });
  }

  // Insertar datos registrales
  const fincas = jsonData.datos_registrales?.fincas || [];
  if (fincas.length > 0) {
    const registrales = fincas.map(f => ({
      informe_id,
      numero_finca: f.numero_finca || null,
      descripcion_registral: f.descripcion_registral || null,
      superficie_registral: parseFloat(f.superficie_registral) || null,
      titularidad: f.titularidad || null,
      cargas: f.cargas || null,
      coincidencia_con_catastro: f.coincidencia_con_catastro || null,
      observaciones: f.observaciones || null,
    }));
    await fetch(`${BASE_URL}/datos_registrales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrales)
    });
  }

  // Insertar cultivos
  const cultivos = jsonData.unidades_y_mejoras?.cultivos || [];
  if (cultivos.length > 0) {
    const cultivosData = cultivos.map(c => ({
      informe_id,
      sector: c.sector || null,
      tipo_cultivo: c.tipo_cultivo || 'Sin especificar',
      superficie_ha: parseFloat(c.superficie_ha) || 0,
      ano_plantacion: parseInt(c.ano_plantacion) || null,
      estado_produccion: c.estado || null,
    }));
    await fetch(`${BASE_URL}/cultivos_informe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cultivosData)
    });
  }

  // Insertar mejoras
  const mejoras = (jsonData.unidades_y_mejoras?.mejoras || []).filter(m => m.tipo_mejora);
  if (mejoras.length > 0) {
    const mejorasData = mejoras.map(m => ({
      informe_id,
      tipo_mejora: m.tipo_mejora || 'Mejora',
      superficie_m2: parseFloat(m.superficie_m2) || null,
      ano_instalacion_construccion: parseInt(m.ano_construccion) || null,
      vida_util_restante_anos: parseInt(m.vida_util_restante_anos) || null,
    }));
    await fetch(`${BASE_URL}/mejoras_informe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mejorasData)
    });
  }

  // Insertar comprobaciones
  const comps = jsonData.comprobaciones?.lista_comprobaciones || [];
  if (comps.length > 0) {
    const compsData = comps.map(c => ({
      informe_id,
      tipo: typeof c === 'string' ? 'comprobacion' : (c.tipo || 'comprobacion'),
      descripcion: typeof c === 'string' ? c : (c.descripcion || c.texto || JSON.stringify(c)),
    }));
    await fetch(`${BASE_URL}/comprobaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compsData)
    });
  }

  // Insertar reservas
  const reservas = jsonData.reservas_y_observaciones?.reservas || [];
  if (reservas.length > 0) {
    const reservasData = reservas.map(r => ({
      informe_id,
      codigo: r.codigo || null,
      descripcion: typeof r === 'string' ? r : (r.descripcion || JSON.stringify(r)),
    }));
    await fetch(`${BASE_URL}/reservas_informe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservasData)
    });
  }

  return informeCreado[0];
}

export async function importarLoteMasivo(jsonArray) {
  const resultados = { exitos: 0, errores: [], total: jsonArray.length };

  for (let i = 0; i < jsonArray.length; i++) {
    try {
      await importarInformeCompleto(jsonArray[i]);
      resultados.exitos++;
    } catch (err) {
      resultados.errores.push({ indice: i, error: err.message });
    }
  }

  return resultados;
}

// ══════════════════════════════════════════════════════════
// USUARIOS
// ══════════════════════════════════════════════════════════

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
  const res = await fetch(`${BASE_URL}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify({ email: userData.email, password: userData.password, role: userData.role || 'tasador' })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error al crear usuario: ${errText}`);
  }
  return res.json();
}

export async function updateUsuario(email, userData) {
  const payload = {};
  if (userData.role) payload.role = userData.role;
  if (userData.password) payload.password = userData.password;

  const res = await fetch(`${BASE_URL}/usuarios?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Error al actualizar usuario');
  return res.json();
}

export async function deleteUsuario(email) {
  const res = await fetch(`${BASE_URL}/usuarios?email=eq.${encodeURIComponent(email)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar usuario');
  return true;
}

// ══════════════════════════════════════════════════════════
// TASADORES
// ══════════════════════════════════════════════════════════

export async function fetchTasadores() {
  const res = await fetch(`${BASE_URL}/tasadores?order=nombre.asc`);
  if (!res.ok) throw new Error('Error al cargar tasadores');
  return res.json();
}
