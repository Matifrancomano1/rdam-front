import { useState, useEffect, useCallback } from "react";
import { expedientesAPI, pagosAPI } from "../../api/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  Badge, Btn, Card, Modal, Inp, Sel, Textarea, PageSpinner,
  Alert, fmtMonto, fmtFecha, fmtFechaHora
} from "../../components/ui.jsx";

/* ── Validaciones ─────────────────────────────────────────── */
const SEDES = ["Santa Fe", "Rosario", "Venado Tuerto", "Rafaela", "Reconquista"];

function validarCamposDeudor(form) {
  const errors = {};
  if (!form.nombreCompleto?.trim())
    errors.nombreCompleto = "El nombre es obligatorio.";
  if (!form.numeroIdentificacion?.trim())
    errors.numeroIdentificacion = "El número de documento es obligatorio.";
  else if (!/^\d{7,8}$/.test(form.numeroIdentificacion.trim()))
    errors.numeroIdentificacion = "Solo números, entre 7 y 8 dígitos.";
  if (!form.email?.trim())
    errors.email = "El email es obligatorio.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = "Formato de email inválido.";
  if (!form.montoAdeudado || Number(form.montoAdeudado) <= 0)
    errors.montoAdeudado = "El monto debe ser mayor a 0.";
  return errors;
}

/* ── Campo con error inline ───────────────────────────────── */
const InpValido = ({ label, error, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>
      {label}
    </label>
    <input
      {...props}
      style={{
        width: "100%", boxSizing: "border-box",
        padding: "9px 12px", borderRadius: 8, fontSize: 14,
        border: `1.5px solid ${error ? "#dc2626" : "var(--border)"}`,
        background: "var(--surface)", color: "var(--text-primary)",
        outline: "none", fontFamily: "inherit", transition: "border-color 0.15s",
      }}
    />
    {error && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{error}</div>}
  </div>
);

const SelValido = ({ label, error, children, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>
      {label}
    </label>
    <select
      {...props}
      style={{
        width: "100%", boxSizing: "border-box",
        padding: "9px 12px", borderRadius: 8, fontSize: 14,
        border: `1.5px solid ${error ? "#dc2626" : "var(--border)"}`,
        background: "var(--surface)", color: "var(--text-primary)",
        outline: "none", fontFamily: "inherit",
      }}
    >
      {children}
    </select>
    {error && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{error}</div>}
  </div>
);

/* ── Formulario de edición del deudor ─────────────────────── */
function FormEditarDeudor({ exp, onClose, onGuardado, setToast }) {
  const [form, setForm] = useState({
    nombreCompleto:        exp.deudor?.nombreCompleto || "",
    tipoIdentificacion:    exp.deudor?.tipoIdentificacion || "DNI",
    numeroIdentificacion:  exp.deudor?.numeroIdentificacion || "",
    email:                 exp.deudor?.email || "",
    telefono:              exp.deudor?.telefono || "",
    montoAdeudado:         exp.deuda?.montoAdeudado?.toString() || "",
    periodoDeuda:          exp.deuda?.periodoDeuda || "",
    beneficiarioNombre:    exp.deuda?.beneficiario?.nombre || "",
    beneficiarioParentesco:exp.deuda?.beneficiario?.parentesco || "",
    sede:                  exp.metadata?.sede || "Santa Fe",
    observaciones:         exp.metadata?.observaciones || "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    // validar en tiempo real solo si el campo ya fue tocado
    if (touched[k]) {
      const newErrors = validarCamposDeudor({ ...form, [k]: v });
      setErrors(prev => ({ ...prev, [k]: newErrors[k] }));
    }
  };

  const blur = (k) => {
    setTouched(t => ({ ...t, [k]: true }));
    const newErrors = validarCamposDeudor(form);
    setErrors(prev => ({ ...prev, [k]: newErrors[k] }));
  };

  const handleGuardar = async () => {
    const allErrors = validarCamposDeudor(form);
    setErrors(allErrors);
    setTouched({ nombreCompleto: true, numeroIdentificacion: true, email: true, montoAdeudado: true });
    if (Object.keys(allErrors).length > 0) return;

    setLoading(true);
    try {
      const body = {
        deudor: {
          nombreCompleto:       form.nombreCompleto.trim(),
          tipoIdentificacion:   form.tipoIdentificacion,
          numeroIdentificacion: form.numeroIdentificacion.trim(),
          email:                form.email.trim(),
          telefono:             form.telefono.trim(),
        },
        deuda: {
          montoAdeudado: parseFloat(form.montoAdeudado),
          periodoDeuda:  form.periodoDeuda.trim(),
          beneficiario: {
            nombre:     form.beneficiarioNombre.trim(),
            parentesco: form.beneficiarioParentesco.trim(),
          },
        },
        sede:         form.sede,
        observaciones: form.observaciones.trim(),
      };
      await expedientesAPI.actualizar(exp.id, body);
      setToast({ msg: "✅ Datos actualizados correctamente.", type: "success" });
      onGuardado();
      onClose();
    } catch (err) {
      setToast({ msg: `Error al guardar: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
      {/* Sección Deudor */}
      <div style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Datos del Deudor
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}>
          <InpValido label="Nombre Completo *" value={form.nombreCompleto}
            onChange={e => set("nombreCompleto", e.target.value)}
            onBlur={() => blur("nombreCompleto")}
            error={errors.nombreCompleto} placeholder="Juan Carlos Pérez" />
        </div>
        <SelValido label="Tipo Documento" value={form.tipoIdentificacion}
          onChange={e => set("tipoIdentificacion", e.target.value)}>
          <option>DNI</option><option>CEDULA</option><option>PASAPORTE</option>
        </SelValido>
        <InpValido label="Número Documento *" value={form.numeroIdentificacion}
          onChange={e => set("numeroIdentificacion", e.target.value)}
          onBlur={() => blur("numeroIdentificacion")}
          error={errors.numeroIdentificacion} placeholder="12345678" />
        <InpValido label="Email *" type="email" value={form.email}
          onChange={e => set("email", e.target.value)}
          onBlur={() => blur("email")}
          error={errors.email} placeholder="juan@email.com" />
        <InpValido label="Teléfono" value={form.telefono}
          onChange={e => set("telefono", e.target.value)}
          placeholder="+54 11 1234-5678" />
      </div>

      {/* Sección Deuda */}
      <div style={{ margin: "8px 0 6px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Datos de la Deuda
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <InpValido label="Monto Adeudado (ARS) *" type="number" value={form.montoAdeudado}
          onChange={e => set("montoAdeudado", e.target.value)}
          onBlur={() => blur("montoAdeudado")}
          error={errors.montoAdeudado} placeholder="150000" min="1" />
        <InpValido label="Período de Deuda" value={form.periodoDeuda}
          onChange={e => set("periodoDeuda", e.target.value)}
          placeholder="Ene 2023 - Dic 2024" />
        <InpValido label="Nombre del Beneficiario" value={form.beneficiarioNombre}
          onChange={e => set("beneficiarioNombre", e.target.value)}
          placeholder="María Pérez" />
        <InpValido label="Parentesco" value={form.beneficiarioParentesco}
          onChange={e => set("beneficiarioParentesco", e.target.value)}
          placeholder="Hija" />
      </div>

      {/* Sección Adicional */}
      <div style={{ margin: "8px 0 6px" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Información Adicional
        </span>
      </div>
      <SelValido label="Sede *" value={form.sede} onChange={e => set("sede", e.target.value)}>
        {SEDES.map(s => <option key={s}>{s}</option>)}
      </SelValido>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Observaciones</label>
        <textarea
          value={form.observaciones}
          onChange={e => set("observaciones", e.target.value)}
          placeholder="Detalles del caso..."
          rows={3}
          style={{
            width: "100%", boxSizing: "border-box", padding: "9px 12px",
            borderRadius: 8, fontSize: 14, border: "1.5px solid var(--border)",
            background: "var(--surface)", color: "var(--text-primary)",
            outline: "none", fontFamily: "inherit", resize: "vertical",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 4, borderTop: "1px solid var(--border)" }}>
        <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" loading={loading} onClick={handleGuardar}>Guardar Cambios</Btn>
      </div>
    </div>
  );
}

/* ── Fila de información ─────────────────────────────────── */
const InfoRow = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14, fontFamily: mono ? "monospace" : "inherit" }}>{value || "—"}</div>
  </div>
);

/* ── Historial de estados ─────────────────────────────────── */
const Historial = ({ expedienteId }) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expedientesAPI.historial(expedienteId)
      .then(r => setHistorial(r.data?.historial || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expedienteId]);

  if (loading) return <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>Cargando historial...</div>;

  return (
    <div className="timeline">
      {historial.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin historial disponible.</p>
      ) : historial.map(h => (
        <div key={h.id} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-date">{fmtFechaHora(h.fechaCambio)}</div>
          <div className="timeline-title">{h.estadoNuevo || "Estado actualizado"}</div>
          <div className="timeline-desc">
            {h.estadoAnterior && <span style={{ opacity: 0.6 }}>Desde: {h.estadoAnterior} · </span>}
            {h.observaciones}
          </div>
          {h.usuario?.nombre && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>👤 {h.usuario.nombre}</div>}
        </div>
      ))}
    </div>
  );
};

/* ── Documentos adjuntos ─────────────────────────────────── */
const BACKEND = "http://localhost:3000/v1";

const Documentos = ({ expedienteId, setToast }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const cargar = useCallback(() => {
    expedientesAPI.listarDocumentos(expedienteId)
      .then(r => setDocs(r.data?.documentos || r.documentos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expedienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  const subir = async (file) => {
    if (!file) return;
    const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!ALLOWED.includes(file.type)) {
      setToast({ msg: "Solo se aceptan PDF, JPG o PNG.", type: "warning" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast({ msg: "El archivo no debe superar los 10 MB.", type: "warning" });
      return;
    }
    setUploading(true);
    try {
      await expedientesAPI.subirDocumento(expedienteId, file);
      setToast({ msg: "✅ Documento subido correctamente.", type: "success" });
      cargar();
    } catch (err) {
      setToast({ msg: `Error al subir: ${err.message}`, type: "error" });
    } finally { setUploading(false); }
  };

  const extInfo = (nombre) => {
    const ext = (nombre || "").split(".").pop().toUpperCase();
    if (ext === "PDF")  return { bg: "#e74c3c", txt: "#fff", label: "PDF", isPdf: true };
    if (["JPG", "JPEG", "PNG", "WEBP"].includes(ext)) return { bg: "#3498db", txt: "#fff", label: ext, isImg: true };
    return { bg: "#94a3b8", txt: "#fff", label: ext };
  };

  return (
    <div>
      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando documentos...</div>
      ) : docs.length > 0 ? (
        <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {docs.map(d => {
            const info = extInfo(d.nombreArchivo);
            const docUrl = `${BACKEND}/expedientes/${expedienteId}/documentos/${d.id}/descargar`;
            return (
              <div key={d.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "var(--surface-2, #f8fafc)",
              }}>
                {/* Badge tipo */}
                <div style={{
                  background: info.bg, color: info.txt,
                  padding: "3px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>
                  {info.label}
                </div>

                {/* Nombre y tamaño */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{d.nombreArchivo}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {d.tamanioBytes ? `${(d.tamanioBytes / 1024).toFixed(0)} KB · ` : ""}
                    {fmtFecha(d.fechaSubida)}
                  </div>
                </div>

                {/* Acciones: Ver + Descargar */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    title={info.isPdf ? "Ver PDF" : "Ver imagen"}
                    onClick={() => window.open(docUrl, "_blank")}
                    className="btn btn-outline btn-sm"
                    style={{ padding: "3px 10px", fontSize: 12 }}
                  >
                    {info.isPdf ? "👁 Ver" : "🖼 Ver"}
                  </button>
                  <a
                    href={docUrl}
                    download={d.nombreArchivo}
                    title="Descargar"
                    className="btn btn-outline btn-sm"
                    style={{ padding: "3px 10px", fontSize: 12, textDecoration: "none" }}
                  >
                    ↓
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ── Zona de carga siempre visible ── */}
      <label
        htmlFor={`doc-inp-${expedienteId}`}
        style={{
          display: "block",
          border: `2px dashed ${drag ? "var(--blue)" : "#93c5fd"}`,
          borderRadius: 12,
          background: drag ? "rgba(37,99,235,0.06)" : "rgba(239,246,255,0.7)",
          padding: "28px 20px",
          textAlign: "center",
          cursor: uploading ? "default" : "pointer",
          transition: "all 0.2s ease",
          marginTop: docs.length > 0 ? 14 : 0,
        }}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault();
          setDrag(false);
          subir(e.dataTransfer.files[0]);
        }}
      >
        {/* Input activado al hacer click en el label completo */}
        <input
          id={`doc-inp-${expedienteId}`}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={uploading}
          style={{ display: "none" }}
          onChange={e => { subir(e.target.files[0]); e.target.value = ""; }}
        />

        {uploading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span className="spinner" style={{ width: 22, height: 22 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--blue)" }}>Subiendo archivo...</span>
          </div>
        ) : (
          <>
            {/* Icono grande destacado */}
            <div style={{
              width: 56, height: 56,
              background: "rgba(37,99,235,0.12)",
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e3a8a", marginBottom: 5 }}>
              Cargar archivo
            </div>
            <div style={{ fontSize: 13, color: "#3b82f6", marginBottom: 16 }}>
              Hacé click o arrastrá el archivo aquí
            </div>

            {/* Botón styled como pill */}
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              background: "#2563eb",
              color: "#fff",
              borderRadius: 9,
              fontWeight: 700,
              fontSize: 14,
              boxShadow: "0 3px 10px rgba(37,99,235,0.4)",
              letterSpacing: "-0.01em",
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Seleccionar archivo
            </span>

            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
              Formatos aceptados: <strong>PDF, JPG, PNG</strong> · Máximo <strong>10 MB</strong>
            </div>
          </>
        )}
      </label>
    </div>
  );
};


/* ── Card prominente de Certificado PDF (para Operador) ─── */
const CertificadoCard = ({ expedienteId, expediente, setToast, onRefresh }) => {
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [certSubido, setCertSubido] = useState(false);
  const estado = expediente?.estado?.actual;

  // Si el cert ya fue emitido, mostrar descarga
  const certEmitido = estado === "Certificado Emitido";
  // Se puede subir si el pago fue confirmado y está pendiente de validación
  const puedeSubir = estado === "Pago Confirmado - Pendiente Validación";

  const subirCert = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setToast({ msg: "Solo se aceptan archivos PDF.", type: "warning" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setToast({ msg: "El archivo no debe superar los 10 MB.", type: "warning" });
      return;
    }
    setUploading(true);
    try {
      await expedientesAPI.subirCertificado(expedienteId, file);
      setToast({ msg: "✅ Certificado cargado. El cliente ya puede descargarlo.", type: "success" });
      setCertSubido(true);
      onRefresh();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  // Estado "no disponible aún"
  if (!puedeSubir && !certEmitido && !certSubido) {
    return (
      <div style={{ padding: "16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)" }}>
          <span style={{ fontSize: 22 }}>🔒</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-secondary)" }}>Certificado no disponible</div>
            <div style={{ fontSize: 12 }}>
              {estado === "Pendiente de Revisión" ? "Aprobá el expediente primero." :
               estado === "Aprobado - Pendiente de Pago" ? "Esperando el pago del deudor." :
               estado === "Rechazado" ? "El expediente fue rechazado." :
               "Estado: " + (estado || "—")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ya certificado
  if (certEmitido || certSubido) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--green-light)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 10, marginBottom: 12 }}>
          <div style={{ background: "#dc2626", color: "#fff", padding: "4px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700 }}>PDF</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Certificado cargado</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Disponible para el cliente</div>
          </div>
        </div>
        <div style={{ padding: "8px 12px", background: "var(--green-light)", borderRadius: 8, fontSize: 12, color: "var(--green)", fontWeight: 600, marginBottom: 10 }}>
          ✅ El cliente puede descargar el certificado
        </div>
        <a
          href={`http://localhost:3000/v1/expedientes/${expedienteId}/certificado`}
          target="_blank"
          rel="noreferrer"
          download
          className="btn btn-outline btn-sm"
          style={{ width: "100%", justifyContent: "center" }}
        >
          📥 Descargar certificado
        </a>
      </div>
    );
  }

  // Zona de carga
  return (
    <div>
      <Alert type="info" style={{ marginBottom: 12 }}>
        El pago fue confirmado. Subí el PDF del certificado para que el cliente pueda descargarlo.
      </Alert>

      <div
        className={`file-drop${drag ? " drag-over" : ""}`}
        style={{ cursor: "pointer", padding: 24 }}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault();
          setDrag(false);
          subirCert(e.dataTransfer.files[0]);
        }}
        onClick={() => document.getElementById(`cert-inp-${expedienteId}`)?.click()}
      >
        <input
          id={`cert-inp-${expedienteId}`}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={e => subirCert(e.target.files[0])}
        />
        {uploading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span className="spinner" style={{ width: 18, height: 18 }} />
            <span style={{ fontWeight: 600 }}>Subiendo certificado...</span>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📜</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Subir Certificado PDF</div>
            <div style={{ fontSize: 12 }}>Máx. 10 MB · Solo disponible con pago confirmado</div>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Sección de Pagos ─────────────────────────────────────── */
const PagosSection = ({ expedienteId, expediente, setToast, onRefresh }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modOrden, setModOrden] = useState(false);
  const [modValidar, setModValidar] = useState(false);
  const [obs, setObs] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const estado = expediente?.estado?.actual;

  const cargar = useCallback(() => {
    expedientesAPI.pagos(expedienteId)
      .then(r => setPagos(r.data?.pagos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expedienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  const crearOrden = async () => {
    setSubmitting(true);
    try {
      const res = await pagosAPI.crearOrden(expedienteId, expediente.deuda?.montoAdeudado, expediente.deudor?.email);
      const url = res.data?.checkoutUrl;
      setToast({ msg: "✅ Orden creada. Link enviado al deudor por email.", type: "success" });
      if (url) setTimeout(() => window.open(url, "_blank"), 800);
      setModOrden(false);
      onRefresh();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally { setSubmitting(false); }
  };

  const validarPago = async () => {
    setSubmitting(true);
    try {
      await expedientesAPI.validarPago(expedienteId, pagos[0]?.id, obs);
      setToast({ msg: "✅ Pago validado. El expediente avanzó al siguiente estado.", type: "success" });
      setModValidar(false); setObs("");
      cargar(); onRefresh();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      {/* Acciones según estado */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {estado === "Aprobado - Pendiente de Pago" && (
          <Btn variant="primary" onClick={() => setModOrden(true)}>
            💳 Crear Orden de Pago
          </Btn>
        )}
        {estado === "Pago Confirmado - Pendiente Validación" && pagos.length > 0 && (
          <Btn variant="success" onClick={() => setModValidar(true)}>
            ✔ Validar Pago
          </Btn>
        )}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando pagos...</div>
      ) : pagos.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No hay pagos registrados.</p>
      ) : pagos.map(p => (
        <div key={p.id} style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 800, color: "var(--green)", fontSize: 20 }}>{fmtMonto(p.monto)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                <span className="mono">{p.referenciaExterna}</span> · {fmtFechaHora(p.fechaPago)}
              </div>
              {p.datosPasarela && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                  💳 **** {p.datosPasarela.ultimosCuatroDigitos} {p.datosPasarela.marca}
                </div>
              )}
            </div>
            <span className={`badge ${p.estadoPago === "confirmado" ? "badge-green" : p.estadoPago === "rechazado" ? "badge-red" : "badge-yellow"}`}>
              {p.estadoPago}
            </span>
          </div>
          {p.validacion && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, padding: "8px 10px", background: "var(--green-light)", borderRadius: 6 }}>
              ✅ Validado por <strong>{p.validacion.nombreUsuario}</strong> el {fmtFecha(p.validacion.fechaValidacion)}
              {p.validacion.observaciones && <span> · {p.validacion.observaciones}</span>}
            </div>
          )}
        </div>
      ))}

      {/* Modal: crear orden */}
      <Modal open={modOrden} onClose={() => setModOrden(false)} title="Crear Orden de Pago">
        <Alert type="info">
          Se generará una orden de pago por <strong>{fmtMonto(expediente?.deuda?.montoAdeudado || 0)}</strong> y se enviará un link al email del deudor (<strong>{expediente?.deudor?.email}</strong>).
        </Alert>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn variant="outline" onClick={() => setModOrden(false)}>Cancelar</Btn>
          <Btn variant="primary" loading={submitting} onClick={crearOrden}>Confirmar y Enviar</Btn>
        </div>
      </Modal>

      {/* Modal: validar pago */}
      <Modal open={modValidar} onClose={() => setModValidar(false)} title="Validar Pago">
        <Alert type="info">Esta acción confirma que el pago fue verificado. Luego podrás subir el certificado PDF.</Alert>
        <div style={{ marginTop: 16 }}>
          <Textarea label="Observaciones (opcional)" placeholder="Pago verificado correctamente..." value={obs} onChange={e => setObs(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="outline" onClick={() => setModValidar(false)}>Cancelar</Btn>
          <Btn variant="success" loading={submitting} onClick={validarPago}>Validar Pago</Btn>
        </div>
      </Modal>
    </div>
  );
};

/* ── Página principal de Detalle ─────────────────────────── */
export default function DetalleExpedientePage({ expedienteId, onBack }) {
  const { user } = useAuth();
  const [exp, setExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modAp, setModAp] = useState(false);
  const [modRe, setModRe] = useState(false);
  const [modEditar, setModEditar] = useState(false);
  const [obs, setObs] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const cargar = useCallback(() => {
    setLoading(true);
    expedientesAPI.obtener(expedienteId)
      .then(r => setExp(r.data))
      .catch(() => setToast({ msg: "Error al cargar el expediente.", type: "error" }))
      .finally(() => setLoading(false));
  }, [expedienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const aprobar = async () => {
    setSubmitting(true);
    try {
      await expedientesAPI.aprobar(expedienteId, obs);
      setToast({ msg: "✅ Expediente aprobado. Se envió el link de pago al deudor.", type: "success" });
      setModAp(false); setObs(""); cargar();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally { setSubmitting(false); }
  };

  const rechazar = async () => {
    if (!obs.trim()) {
      setToast({ msg: "El motivo de rechazo es obligatorio.", type: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      await expedientesAPI.rechazar(expedienteId, obs);
      setToast({ msg: "Expediente rechazado.", type: "info" });
      setModRe(false); setObs(""); cargar();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally { setSubmitting(false); }
  };

  if (loading) return <PageSpinner text="Cargando expediente..." />;
  if (!exp) return <div style={{ color: "var(--red)", padding: 32 }}>No se encontró el expediente.</div>;

  const estado = exp?.estado?.actual;
  const esPendiente = estado === "Pendiente de Revisión";

  return (
    <div className="fade-in">
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, maxWidth: 360 }}>
          <div className={`toast toast-${toast.type}`}>
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 8, opacity: 0.6, fontSize: 16, color: "inherit" }}>×</button>
          </div>
        </div>
      )}

      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
        <button onClick={onBack} className="btn btn-outline btn-sm">← Volver</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            {exp.deudor?.nombreCompleto}
          </h1>
          <span className="mono" style={{ color: "var(--text-muted)" }}>{exp.numeroExpediente}</span>
        </div>
        <Badge estado={estado} />
      </div>

      {/* Grid 2:1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Columna izquierda */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Datos del deudor */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Datos del Deudor</h2>
              <Btn variant="outline" size="sm" onClick={() => setModEditar(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                ✏️ Editar
              </Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <InfoRow label="Nombre Completo" value={exp.deudor?.nombreCompleto} />
              <InfoRow label={exp.deudor?.tipoIdentificacion || "DNI"} value={exp.deudor?.numeroIdentificacion} mono />
              <InfoRow label="Email" value={exp.deudor?.email} />
              <InfoRow label="Teléfono" value={exp.deudor?.telefono} />
              <InfoRow label="Monto Adeudado" value={fmtMonto(exp.deuda?.montoAdeudado || 0)} />
              <InfoRow label="Período de Deuda" value={exp.deuda?.periodoDeuda} />
              <InfoRow label="Beneficiario" value={exp.deuda?.beneficiario?.nombre} />
              <InfoRow label="Parentesco" value={exp.deuda?.beneficiario?.parentesco} />
              <InfoRow label="Sede" value={exp.metadata?.sede} />
            </div>
            {exp.metadata?.observaciones && (
              <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)" }}>
                <strong>Observaciones:</strong> {exp.metadata.observaciones}
              </div>
            )}
          </Card>

          {/* Historial */}
          <Card>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Historial de Estados</h2>
            <Historial expedienteId={expedienteId} />
          </Card>

          {/* Pagos */}
          <Card>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Pagos</h2>
            <PagosSection expedienteId={expedienteId} expediente={exp} setToast={setToast} onRefresh={cargar} />
          </Card>

          {/* ── DOCUMENTOS ADJUNTOS — columna principal, ancho completo ── */}
          <Card style={{ border: "1.5px solid var(--blue)", borderColor: "rgba(37,99,235,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34,
                  background: "var(--blue-light)",
                  borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  📎
                </div>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Documentos Adjuntos</h2>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>PDF, JPG, PNG · Máx. 10 MB</div>
                </div>
              </div>
              {/* Botón prominente de subir */}
              <button
                className="btn btn-primary"
                onClick={() => document.getElementById(`doc-inp-${expedienteId}`)?.click()}
                style={{ gap: 8 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Subir Documento
              </button>
            </div>
            <Documentos expedienteId={expedienteId} setToast={setToast} />
          </Card>
        </div>

        {/* Columna derecha */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Acciones (solo pendiente) */}
          {esPendiente && (
            <Card>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Acciones</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Btn variant="success" style={{ justifyContent: "center" }} onClick={() => setModAp(true)}>
                  ✅ Aprobar Expediente
                </Btn>
                <Btn variant="danger" style={{ justifyContent: "center" }} onClick={() => setModRe(true)}>
                  ✗ Rechazar Expediente
                </Btn>
              </div>
            </Card>
          )}

          {/* Estado */}
          <Card>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Estado Actual</h2>
            <Badge estado={estado} />
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 4 }}>
              <div>Actualizado: {fmtFechaHora(exp.estado?.fechaActualizacion)}</div>
              {exp.estado?.fechaExpiracion && (
                <div style={{ color: "var(--red)", fontWeight: 600 }}>
                  ⚠️ Expira: {fmtFecha(exp.estado.fechaExpiracion)}
                </div>
              )}
            </div>
          </Card>

          {/* ── CERTIFICADO PDF ── Card prominente para el Operador */}
          <Card style={{ border: "1.5px solid", borderColor: estado === "Pago Confirmado - Pendiente Validación" ? "rgba(37,99,235,0.35)" : "var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>📜</span>
              <h2 style={{ fontSize: 14, fontWeight: 700 }}>Certificado PDF</h2>
            </div>
            <CertificadoCard expedienteId={expedienteId} expediente={exp} setToast={setToast} onRefresh={cargar} />
          </Card>


          {/* Info del sistema */}
          <Card>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Info del Sistema</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <InfoRow label="Fecha Creación" value={fmtFechaHora(exp.metadata?.fechaCreacion)} />
              <InfoRow label="Última Actualización" value={fmtFechaHora(exp.metadata?.fechaActualizacion)} />
              {user && <InfoRow label="Operador Actual" value={`${user.nombre} (${user.rol})`} />}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Aprobar */}
      <Modal open={modAp} onClose={() => setModAp(false)} title="Aprobar Expediente">
        <Alert type="info">
          Al aprobar, se generará automáticamente un link de pago que será enviado al email del deudor: <strong>{exp.deudor?.email}</strong>.
        </Alert>
        <div style={{ marginTop: 16 }}>
          <Textarea label="Observaciones (opcional)" placeholder="Documentación completa y verificada..." value={obs} onChange={e => setObs(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="outline" onClick={() => setModAp(false)}>Cancelar</Btn>
          <Btn variant="success" loading={submitting} onClick={aprobar}>Confirmar Aprobación</Btn>
        </div>
      </Modal>

      {/* Modal Rechazar */}
      <Modal open={modRe} onClose={() => setModRe(false)} title="Rechazar Expediente">
        <Alert type="danger">⚠️ El expediente pasará a estado Rechazado. Ingresá el motivo (obligatorio).</Alert>
        <div style={{ marginTop: 16 }}>
          <Textarea label="Motivo del Rechazo" required placeholder="Documentación incompleta. Falta: ..." value={obs} onChange={e => setObs(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="outline" onClick={() => setModRe(false)}>Cancelar</Btn>
          <Btn variant="danger" loading={submitting} onClick={rechazar}>Confirmar Rechazo</Btn>
        </div>
      </Modal>

      {/* Modal Editar Deudor */}
      <Modal open={modEditar} onClose={() => setModEditar(false)} title="Editar Datos del Deudor" width={680}>
        {exp && (
          <FormEditarDeudor
            exp={exp}
            onClose={() => setModEditar(false)}
            onGuardado={cargar}
            setToast={setToast}
          />
        )}
      </Modal>
    </div>
  );
}
