const API_BASE = "http://localhost:3000/v1";

// ── Token helpers ──────────────────────────────────────────────
export const getToken = () => localStorage.getItem("rdam_token");
export const getRefreshToken = () => localStorage.getItem("rdam_refresh");
export const setTokens = (access, refresh) => {
  localStorage.setItem("rdam_token", access);
  if (refresh) localStorage.setItem("rdam_refresh", refresh);
};
export const clearTokens = () => {
  localStorage.removeItem("rdam_token");
  localStorage.removeItem("rdam_refresh");
};

// ── Core fetch ─────────────────────────────────────────────────
let refreshPromise = null;

async function doRefresh() {
  const rt = getRefreshToken();
  if (!rt) throw new Error("No refresh token");
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: rt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Refresh failed");
  setTokens(data.data?.accessToken, null);
  return data.data?.accessToken;
}

async function apiFetch(path, options = {}, retry = true) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    // Try refresh once
    if (!refreshPromise) refreshPromise = doRefresh().finally(() => (refreshPromise = null));
    try {
      await refreshPromise;
      return apiFetch(path, options, false);
    } catch {
      clearTokens();
      window.location.reload();
      return;
    }
  }

  // Handle no-content responses
  if (res.status === 204) return { success: true };

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error?.message || data?.message || "Error del servidor");
    err.code = data?.error?.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── Auth ───────────────────────────────────────────────────────
export const authAPI = {
  login: (username, password) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  me: () => apiFetch("/auth/me"),
  refresh: () => apiFetch("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: getRefreshToken() }) }),
};

// ── Expedientes ────────────────────────────────────────────────
export const expedientesAPI = {
  listar: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v !== null && v !== undefined) q.set(k, v); });
    return apiFetch(`/expedientes${q.toString() ? "?" + q : ""}`);
  },
  obtener: (id) => apiFetch(`/expedientes/${id}`),
  crear: (body) => apiFetch("/expedientes", { method: "POST", body: JSON.stringify(body) }),
  actualizar: (id, body) => apiFetch(`/expedientes/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  aprobar: (id, observaciones) =>
    apiFetch(`/expedientes/${id}/aprobar`, { method: "POST", body: JSON.stringify({ observaciones }) }),
  rechazar: (id, observaciones) =>
    apiFetch(`/expedientes/${id}/rechazar`, { method: "POST", body: JSON.stringify({ observaciones }) }),
  historial: (id) => apiFetch(`/expedientes/${id}/historial`),
  pagos: (id) => apiFetch(`/expedientes/${id}/pagos`),
  validarPago: (id, pagoId, observaciones) =>
    apiFetch(`/expedientes/${id}/validar-pago`, { method: "POST", body: JSON.stringify({ pagoId, observaciones }) }),
  // Documentos
  listarDocumentos: (id) => apiFetch(`/expedientes/${id}/documentos`),
  subirDocumento: (id, file) => {
    const form = new FormData();
    form.append("archivo", file);
    return apiFetch(`/expedientes/${id}/documentos`, { method: "POST", body: form });
  },
  // Certificado
  subirCertificado: (id, file) => {
    const form = new FormData();
    form.append("archivo", file);
    return apiFetch(`/expedientes/${id}/certificado`, { method: "POST", body: form });
  },
  descargarCertificado: (id) => `${API_BASE}/expedientes/${id}/certificado/descargar`,
};

// ── Pagos ──────────────────────────────────────────────────────
export const pagosAPI = {
  crearOrden: (expedienteId, monto, email) =>
    apiFetch("/pagos/crear-orden", { method: "POST", body: JSON.stringify({ expedienteId, monto, email }) }),
  estadoPago: (pagoId) => apiFetch(`/pagos/${pagoId}/estado`),
};

// ── Portal Ciudadano (SIN autenticación) ───────────────────────
async function publicFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (res.status === 204) return { success: true };
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error?.message || data?.message || "Error del servidor");
    err.status = res.status;
    throw err;
  }
  return data;
}

export const portalAPI = {
  // Consulta por DNI (público)
  consultar: (dni) => publicFetch(`/portal/consultar?dni=${encodeURIComponent(dni)}`),
  // Estado de un expediente vía token de pago (link enviado al deudor)
  expedientePublico: (token) => publicFetch(`/portal/expediente?token=${encodeURIComponent(token)}`),
  // Crear orden de pago PÚBLICA (ciudadano, sin JWT)
  crearOrdenPublica: (expedienteId, monto, email) =>
    publicFetch('/pagos/crear-orden-publica', {
      method: 'POST',
      body: JSON.stringify({ expedienteId, monto: Number(monto), email }),
    }),
  // Verificar resultado del pago por referencia (retorno desde pasarela)
  verificarPago: (referencia) =>
    publicFetch(`/pagos/estado-por-referencia/${encodeURIComponent(referencia)}`),
  // Resultado del pago (retorno desde pasarela)
  resultadoPago: (params) => {
    const q = new URLSearchParams(params).toString();
    return publicFetch(`/portal/resultado-pago?${q}`);
  },
  // Verificar un nro de certificado
  verificarCertificado: (nro) => publicFetch(`/portal/verificar-certificado/${nro}`),
};

// ── URL de descarga directa de certificado (pública) ──────────
export const certDownloadUrl = (expedienteId, token) =>
  `${API_BASE}/portal/certificado/${expedienteId}${token ? `?token=${token}` : ""}`;

// ── Usuarios ───────────────────────────────────────────────────
export const usuariosAPI = {
  listar: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v !== null && v !== undefined) q.set(k, v); });
    return apiFetch(`/usuarios${q.toString() ? "?" + q : ""}`);
  },
  obtener: (id) => apiFetch(`/usuarios/${id}`),
  crear: (body) => apiFetch("/usuarios", { method: "POST", body: JSON.stringify(body) }),
  actualizar: (id, body) => apiFetch(`/usuarios/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  eliminar: (id) => apiFetch(`/usuarios/${id}`, { method: "DELETE" }),
  cambiarPassword: (id, body) =>
    apiFetch(`/usuarios/${id}/password`, { method: "PUT", body: JSON.stringify(body) }),
};

// ── Dashboard ──────────────────────────────────────────────────
export const dashboardAPI = {
  metricas: () => apiFetch("/dashboard/metricas"),
  actividadReciente: (limit = 10) => apiFetch(`/dashboard/actividad-reciente?limit=${limit}`),
};

// ── Auditoría ──────────────────────────────────────────────────
export const auditoriaAPI = {
  logs: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== "" && v !== null && v !== undefined) q.set(k, v); });
    return apiFetch(`/auditoria/logs${q.toString() ? "?" + q : ""}`);
  },
};

// ── Certificados ───────────────────────────────────────────────
export const certificadosAPI = {
  validar: (numeroCertificado) => apiFetch(`/certificados/validar/${numeroCertificado}`),
  descargar: (id) => `${API_BASE}/certificados/${id}/descargar`,
};
