import { useState } from "react";
import { expedientesAPI, certDownloadUrl } from "../../api/api.js";
import { fmtMonto, fmtFecha, fmtFechaHora } from "../../components/ui.jsx";

const BACKEND = "http://localhost:3000/v1";

/* ─── Modal visor de imagen inline ─────────────────────────── */
const ImagenModal = ({ src, nombre, onClose }) => (
  <div
    onClick={onClose}
    style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, cursor: "zoom-out",
    }}
  >
    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>{nombre}</div>
    <img
      src={src}
      alt={nombre}
      onClick={e => e.stopPropagation()}
      style={{
        maxWidth: "90vw", maxHeight: "80vh",
        borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
        cursor: "default",
      }}
    />
    <button
      onClick={onClose}
      style={{
        marginTop: 16, padding: "8px 20px",
        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 8, color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer",
      }}
    >Cerrar</button>
  </div>
);

/* ─── Sección de documentos adjuntos ──────────────────────── */
const DocumentoItem = ({ doc, expedienteId }) => {
  const ext = (doc.nombreArchivo || "").split(".").pop().toUpperCase();
  const extColors = { PDF: "#dc2626", JPG: "#2563eb", JPEG: "#2563eb", PNG: "#7c3aed", WEBP: "#7c3aed" };
  const bgColor = extColors[ext] || "#64748b";
  const isImage = ["JPG", "JPEG", "PNG", "WEBP", "GIF"].includes(ext);
  const [imagenAbierta, setImagenAbierta] = useState(false);

  // Usar la URL del backend con el docId correcto
  const docUrl = `${BACKEND}/expedientes/${expedienteId}/documentos/${doc.id}/descargar`;

  const handleVer = () => {
    if (isImage) {
      setImagenAbierta(true);
    } else {
      // PDF: abrir en nueva pestaña para que el navegador lo renderice
      window.open(docUrl, "_blank");
    }
  };

  return (
    <>
      {imagenAbierta && (
        <ImagenModal
          src={docUrl}
          nombre={doc.nombreArchivo}
          onClose={() => setImagenAbierta(false)}
        />
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 14px",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10,
        transition: "all 0.18s",
      }}>
        <div style={{ background: bgColor, color: "#fff", padding: "4px 8px", borderRadius: 5, fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
          {ext}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {doc.nombreArchivo}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
            {doc.tamanioBytes ? `${(doc.tamanioBytes / 1024).toFixed(0)} KB · ` : ""}{fmtFecha(doc.fechaSubida)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={handleVer} style={{
            background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.4)",
            color: "#93c5fd", borderRadius: 7, padding: "5px 12px", fontSize: 12,
            fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            transition: "all 0.18s",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(37,99,235,0.35)"; }}
          onMouseOut={e => { e.currentTarget.style.background = "rgba(37,99,235,0.2)"; }}
          >
            {isImage ? "🖼 Ver imagen" : "👁 Ver PDF"}
          </button>
          <a href={docUrl} download={doc.nombreArchivo} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.5)", borderRadius: 7, padding: "5px 10px", fontSize: 11,
            fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            textDecoration: "none", display: "flex", alignItems: "center",
          }}>
            ↓
          </a>
        </div>
      </div>
    </>
  );
};


/* ─── Estado badge ─────────────────────────────────────────── */
const estadoBadge = (estado) => {
  const map = {
    "Pendiente de Revisión":                 { color: "#d97706", bg: "rgba(217,119,6,0.12)",  label: "⏳ En Revisión" },
    "Aprobado - Pendiente de Pago":          { color: "#2563eb", bg: "rgba(37,99,235,0.12)",  label: "💳 Pendiente de Pago" },
    "Pago Confirmado - Pendiente Validación":{ color: "#7c3aed", bg: "rgba(124,58,237,0.12)", label: "🔍 Validando Pago" },
    "Certificado Emitido":                   { color: "#16a34a", bg: "rgba(22,163,74,0.12)",  label: "✅ Certificado Disponible" },
    "Rechazado":                             { color: "#dc2626", bg: "rgba(220,38,38,0.12)",  label: "❌ Rechazado" },
    "Expirado":                              { color: "#64748b", bg: "rgba(100,116,139,0.12)", label: "⌛ Expirado" },
  };
  const cfg = map[estado] || { color: "#64748b", bg: "rgba(100,116,139,0.12)", label: estado };
  return (
    <span style={{
      display: "inline-block", padding: "6px 14px", borderRadius: 99,
      fontWeight: 700, fontSize: 13, color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.color}33`,
    }}>
      {cfg.label}
    </span>
  );
};

/* ─── Panel de resultado de búsqueda ──────────────────────── */
const PanelExpediente = ({ data, onPagar }) => {
  const estado = data?.estado?.actual;
  const deudor = data?.deudor;
  const deuda = data?.deuda;
  const [docsOpen, setDocsOpen] = useState(false);
  const [docs, setDocs] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const cargarDocs = async () => {
    if (docs !== null) { setDocsOpen(!docsOpen); return; }
    setLoadingDocs(true);
    setDocsOpen(true);
    try {
      const r = await expedientesAPI.listarDocumentos(data.id);
      setDocs(r.data?.documentos || r.documentos || []);
    } catch {
      setDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const certUrl = certDownloadUrl(data.id);

  // ── Status info lines ──
  const statusMsg = {
    "Pendiente de Revisión": "Su expediente está siendo revisado por un operador del sistema. Le notificaremos cuando haya novedades.",
    "Aprobado - Pendiente de Pago": "Su expediente fue aprobado. Puede proceder con el pago para regularizar la situación.",
    "Pago Confirmado - Pendiente Validación": "Su pago fue recibido correctamente y está siendo validado internamente. En breve podrá descargar su certificado.",
    "Certificado Emitido": "¡Su certificado de libre deuda está listo! Puede descargarlo a continuación.",
    "Rechazado": "Su expediente fue rechazado. Para más información, comuníquese con la sede correspondiente.",
    "Expirado": "El certificado venció (90 días). Debe iniciar un nuevo trámite.",
  }[estado] || "";

  return (
    <div style={{ animation: "fadeInUp 0.4s ease" }}>

      {/* Card principal */}
      <div style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20,
        padding: 28,
        marginBottom: 20,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>
              {deudor?.nombreCompleto}
            </h2>
            <div style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>
              {data.numeroExpediente}
            </div>
          </div>
          {estadoBadge(estado)}
        </div>

        {/* Mensaje de estado */}
        {statusMsg && (
          <div style={{
            padding: "12px 16px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            fontSize: 13,
            color: "rgba(255,255,255,0.75)",
            marginBottom: 24,
            lineHeight: 1.6,
          }}>
            ℹ️ {statusMsg}
          </div>
        )}

        {/* Grid de datos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[
            { label: "DNI / Identificación", val: deudor?.numeroIdentificacion, mono: true },
            { label: "Monto Adeudado", val: fmtMonto(deuda?.montoAdeudado || 0), highlight: estado === "Aprobado - Pendiente de Pago" },
            { label: "Período de Deuda", val: deuda?.periodoDeuda },
            { label: "Beneficiario/a", val: deuda?.beneficiario?.nombre },
            { label: "Parentesco", val: deuda?.beneficiario?.parentesco },
            { label: "Fecha Creación", val: fmtFechaHora(data.metadata?.fechaCreacion) },
          ].map((f, i) => (
            <div key={i}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 5 }}>
                {f.label}
              </div>
              <div style={{
                fontWeight: 700,
                fontSize: f.highlight ? 22 : 15,
                color: f.highlight ? "#4ade80" : f.mono ? "#93c5fd" : "#fff",
                fontFamily: f.mono ? "monospace" : "inherit",
              }}>
                {f.val || "—"}
              </div>
            </div>
          ))}
        </div>

        {/* ── BOTÓN PAGAR (solo si está aprobado y pendiente de pago) ── */}
        {estado === "Aprobado - Pendiente de Pago" && (
          <div style={{
            background: "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(124,58,237,0.25))",
            border: "1px solid rgba(99,139,255,0.4)",
            borderRadius: 14,
            padding: 20,
            marginBottom: 20,
          }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Monto a abonar</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#4ade80", letterSpacing: "-1px" }}>
                {fmtMonto(deuda?.montoAdeudado || 0)}
              </div>
            </div>
            <button
              onClick={() => onPagar(data)}
              style={{
                width: "100%",
                padding: "14px 24px",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: "0 4px 20px rgba(37,99,235,0.4)",
                transition: "all 0.2s",
                letterSpacing: "-0.3px",
              }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(37,99,235,0.5)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.4)"; }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Pagar Ahora · {fmtMonto(deuda?.montoAdeudado || 0)}
            </button>
            <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 10 }}>
              🔒 Pago seguro vía PlusPagos · Tarjeta de débito/crédito
            </p>
          </div>
        )}

        {/* ── DESCARGAR CERTIFICADO (si está emitido) ── */}
        {estado === "Certificado Emitido" && (
          <div style={{
            background: "rgba(22,163,74,0.15)",
            border: "1px solid rgba(22,163,74,0.4)",
            borderRadius: 14,
            padding: 20,
            marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={{ background: "#dc2626", color: "#fff", padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                PDF
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>Certificado de Libre Deuda</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                  Expediente {data.numeroExpediente} · Vigencia 90 días desde emisión
                </div>
              </div>
            </div>

            {data.estado?.fechaExpiracion && (
              <div style={{ fontSize: 12, color: "#fbbf24", marginBottom: 14, fontWeight: 600 }}>
                ⚠️ Válido hasta: {fmtFecha(data.estado.fechaExpiracion)}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <a
                href={certUrl}
                download
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Descargar Certificado
              </a>
              <a
                href={certUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "12px 20px",
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  textDecoration: "none",
                }}
              >
                👁 Ver
              </a>
            </div>
          </div>
        )}

        {/* Botón Ver Documentos */}
        <button
          onClick={cargarDocs}
          style={{
            width: "100%",
            padding: "10px 18px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.7)",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.18s",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {docsOpen ? "▲ Ocultar documentos" : "📎 Ver documentos adjuntos"}
        </button>

        {/* Lista de documentos */}
        {docsOpen && (
          <div style={{ marginTop: 14 }}>
            {loadingDocs ? (
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                Cargando documentos...
              </div>
            ) : docs && docs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {docs.map(d => (
                  <DocumentoItem key={d.id} doc={d} expedienteId={data.id} />
                ))}
              </div>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                No hay documentos adjuntos.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Página principal del Portal ─────────────────────────── */
export default function PortalCiudadano({ onLoginInterno, onPagar }) {
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null); // null | "not_found" | expedienteData
  const [error, setError] = useState("");

  const buscar = async (e) => {
    e.preventDefault();
    if (!dni.trim()) return;
    setLoading(true);
    setResultado(null);
    setError("");

    try {
      // Intenta llamar al backend (endpoint público)
      const res = await fetch(`http://localhost:3000/v1/portal/consultar?dni=${encodeURIComponent(dni.trim())}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 404) {
        setResultado("not_found");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data?.message || "Error al consultar. Intente nuevamente.");
        return;
      }

      const data = await res.json();
      setResultado(data.data || data);
    } catch {
      // Backend offline: muestra mensaje claro
      setError("No se pudo conectar al servidor. Asegúrese de que el sistema esté disponible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #050d1f 0%, #0c1628 40%, #0f213b 100%)",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
          70%  { box-shadow: 0 0 0 14px rgba(37,99,235,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        padding: "18px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(5,13,31,0.7)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38,
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "#fff", fontSize: 18, lineHeight: 1 }}>RDAM</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Provincia de Santa Fe</div>
          </div>
        </div>
        <button
          onClick={onLoginInterno}
          style={{
            padding: "9px 18px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            color: "rgba(255,255,255,0.75)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7,
            transition: "all 0.18s",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Acceso Interno
        </button>
      </header>

      {/* ── Hero ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 20px" }}>

        {/* Glow bg */}
        <div style={{
          position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 600, pointerEvents: "none",
          background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
        }} />

        <div style={{ maxWidth: 640, width: "100%", position: "relative" }}>

          {/* Título */}
          {!resultado && (
            <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeInUp 0.5s ease" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 14px",
                background: "rgba(37,99,235,0.15)",
                border: "1px solid rgba(37,99,235,0.3)",
                borderRadius: 99,
                fontSize: 12, fontWeight: 700, color: "#93c5fd",
                letterSpacing: "0.5px", textTransform: "uppercase",
                marginBottom: 20,
              }}>
                🏛 Portal Ciudadano — RDAM
              </div>
              <h1 style={{
                fontSize: 40, fontWeight: 900, color: "#fff",
                letterSpacing: "-1.5px", lineHeight: 1.15, marginBottom: 14,
              }}>
                Consultá tu estado<br />
                <span style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  en el registro
                </span>
              </h1>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>
                Ingresá tu DNI para consultar el estado de tu expediente, realizar el pago de la deuda alimentaria o descargar tu certificado de libre deuda.
              </p>
            </div>
          )}

          {/* Search box */}
          <form onSubmit={buscar} style={{ animation: "fadeInUp 0.6s ease" }}>
            <div style={{
              display: "flex", gap: 0,
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(255,255,255,0.14)",
              borderRadius: 16,
              padding: 6,
              backdropFilter: "blur(10px)",
            }}>
              <input
                type="text"
                value={dni}
                onChange={e => setDni(e.target.value)}
                placeholder="Ingresá tu número de DNI (sin puntos)"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 15,
                  padding: "12px 16px",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="submit"
                disabled={loading || !dni.trim()}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 11,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading || !dni.trim() ? "not-allowed" : "pointer",
                  opacity: !dni.trim() ? 0.5 : 1,
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all 0.18s",
                  whiteSpace: "nowrap",
                  animation: !loading && dni.trim() ? "pulse-ring 2s infinite" : "none",
                }}
              >
                {loading ? (
                  <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Consultando...</>
                ) : (
                  <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>Consultar</>
                )}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "rgba(220,38,38,0.15)",
              border: "1px solid rgba(220,38,38,0.3)",
              borderRadius: 10,
              color: "#fca5a5",
              fontSize: 13,
              animation: "fadeInUp 0.3s ease",
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* No encontrado */}
          {resultado === "not_found" && (
            <div style={{
              marginTop: 24,
              padding: "24px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              textAlign: "center",
              color: "rgba(255,255,255,0.6)",
              animation: "fadeInUp 0.3s ease",
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6 }}>No se encontraron resultados</div>
              <div style={{ fontSize: 13 }}>No hay expedientes activos para el DNI <strong style={{ color: "#93c5fd" }}>{dni}</strong>.<br />Si creés que hay un error, comunicate con la sede más cercana.</div>
            </div>
          )}

          {/* Resultado del expediente */}
          {resultado && resultado !== "not_found" && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  Resultado para DNI <strong style={{ color: "#93c5fd" }}>{dni}</strong>
                </div>
                <button
                  onClick={() => { setResultado(null); setDni(""); }}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}
                >
                  × Nueva consulta
                </button>
              </div>
              <PanelExpediente
                data={resultado}
                onPagar={onPagar || ((exp) => alert(`Redirigiendo a pago del expediente ${exp.numeroExpediente}`))}
              />
            </div>
          )}

          {/* Info pills */}
          {!resultado && (
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 40, flexWrap: "wrap" }}>
              {[
                { icon: "🔒", text: "Consulta segura y confidencial" },
                { icon: "💳", text: "Pagos con tarjeta débito/crédito" },
                { icon: "📜", text: "Certificado descargable al instante" },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                  <span>{p.icon}</span>
                  <span>{p.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        padding: "16px 32px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 11,
        color: "rgba(255,255,255,0.2)",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <span>RDAM © 2026 · Gobierno de la Provincia de Santa Fe</span>
        <span>Para asistencia: <strong style={{ color: "rgba(255,255,255,0.4)" }}>0800-333-RDAM</strong></span>
      </footer>
    </div>
  );
}
