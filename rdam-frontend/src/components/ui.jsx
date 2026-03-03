import { useEffect, useRef } from "react";

/* ── Estado de Expediente ──────────────────────────────────── */
export const ESTADOS_CONFIG = {
  "Pendiente de Revisión":                { label: "Pendiente",       className: "badge-yellow" },
  "Aprobado - Pendiente de Pago":         { label: "Aprobado",        className: "badge-green"  },
  "Pago Confirmado - Pendiente Validación":{ label: "Pago Confirmado", className: "badge-blue"   },
  "Certificado Emitido":                  { label: "Certificado",     className: "badge-purple" },
  "Rechazado":                            { label: "Rechazado",       className: "badge-red"    },
  "Expirado":                             { label: "Expirado",        className: "badge-slate"  },
};

export const Badge = ({ estado, custom }) => {
  const cfg = ESTADOS_CONFIG[estado] || { label: estado, className: "badge-slate" };
  return (
    <span className={`badge ${custom || cfg.className}`}>
      {cfg.label}
    </span>
  );
};

/* ── Botón ─────────────────────────────────────────────────── */
export const Btn = ({ children, variant = "primary", size, onClick, style, disabled, type = "button", loading }) => (
  <button
    type={type}
    disabled={disabled || loading}
    onClick={onClick}
    style={style}
    className={`btn btn-${variant}${size ? ` btn-${size}` : ""}`}
  >
    {loading && <span className="spinner" style={{ width: 14, height: 14 }} />}
    {children}
  </button>
);

/* ── Card ──────────────────────────────────────────────────── */
export const Card = ({ children, style, className = "" }) => (
  <div className={`card ${className}`} style={style}>{children}</div>
);

/* ── Input ─────────────────────────────────────────────────── */
export const Inp = ({ label, required, hint, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}{required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}</label>}
    <input className="form-input" {...props} />
    {hint && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>{hint}</p>}
  </div>
);

/* ── Select ────────────────────────────────────────────────── */
export const Sel = ({ label, required, children, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}{required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}</label>}
    <select className="form-select" {...props}>{children}</select>
  </div>
);

/* ── Textarea ──────────────────────────────────────────────── */
export const Textarea = ({ label, required, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}{required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}</label>}
    <textarea className="form-textarea" {...props} />
  </div>
);

/* ── Modal ─────────────────────────────────────────────────── */
export const Modal = ({ open, onClose, title, children, width = 520 }) => {
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.target === ref.current) onClose(); };
    ref.current?.addEventListener("click", handler);
    return () => ref.current?.removeEventListener("click", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" ref={ref}>
      <div className="modal-box fade-in" style={{ maxWidth: width }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ── Toast ─────────────────────────────────────────────────── */
export const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  return (
    <div className={`toast toast-${type}`}>
      <span>{icons[type]}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.6, color: "inherit" }}>×</button>
    </div>
  );
};

/* ── Spinner de página ─────────────────────────────────────── */
export const PageSpinner = ({ text = "Cargando..." }) => (
  <div className="spinner-page">
    <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    <span>{text}</span>
  </div>
);

/* ── Empty State ───────────────────────────────────────────── */
export const EmptyState = ({ icon = "📂", title = "Sin resultados", subtitle }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <p className="empty-state-title">{title}</p>
    {subtitle && <p style={{ fontSize: 13, maxWidth: 300 }}>{subtitle}</p>}
  </div>
);

/* ── Alerta ────────────────────────────────────────────────── */
export const Alert = ({ type = "info", children }) => (
  <div className={`alert alert-${type}`}>{children}</div>
);

/* ── Paginación ────────────────────────────────────────────── */
export const Pagination = ({ page, total, limit, onPage }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <span className="pagination-info">
        Mostrando {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
      </span>
      <div className="pagination-buttons">
        <Btn variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>← Anterior</Btn>
        <span style={{ fontSize: 13, color: "var(--text-muted)", padding: "0 8px" }}>Página {page} de {totalPages}</span>
        <Btn variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Siguiente →</Btn>
      </div>
    </div>
  );
};

/* ── Formatters ────────────────────────────────────────────── */
export const fmtMonto = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export const fmtFecha = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const fmtFechaHora = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
