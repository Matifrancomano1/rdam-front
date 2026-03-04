import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

// ── Sedes disponibles (igual que poc-rdam) ──────────────────
const SEDES = [
  { value: "Santa Fe",     label: "Santa Fe" },
  { value: "Rosario",      label: "Rosario" },
  { value: "Venado Tuerto",label: "Venado Tuerto" },
  { value: "Rafaela",      label: "Rafaela" },
  { value: "Reconquista",  label: "Reconquista" },
];

const SEDE_STORAGE_KEY = "rdam_sede_seleccionada";

// ── Permisos por rol ────────────────────────────────────────
export const PERMISOS = {
  Operador: ["dashboard", "expedientes", "pagos"],
  Administrador: ["dashboard", "expedientes", "pagos", "usuarios", "auditoria"],
};

export const tienePermiso = (rol, vista) => {
  const permisos = PERMISOS[rol] || PERMISOS["Operador"];
  return permisos.includes(vista);
};

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    roles: ["Operador", "Administrador"],
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: "expedientes",
    label: "Expedientes",
    roles: ["Operador", "Administrador"],
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: "pagos",
    label: "Historial Pagos",
    roles: ["Operador", "Administrador"],
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    id: "usuarios",
    label: "Usuarios",
    roles: ["Administrador"],
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  },
  {
    id: "auditoria",
    label: "Auditoría",
    roles: ["Administrador"],
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

export default function Sidebar({ vista, onVista }) {
  const { user, logout } = useAuth();
  const rol = user?.rol || "Operador";

  // ── Estado de sede ────────────────────────────────────────
  const [sede, setSede] = useState(
    () => localStorage.getItem(SEDE_STORAGE_KEY) || "Santa Fe",
  );

  const cambiarSede = (nuevaSede) => {
    setSede(nuevaSede);
    localStorage.setItem(SEDE_STORAGE_KEY, nuevaSede);
  };

  const itemsVisibles = NAV_ITEMS.filter((item) => item.roles.includes(rol));

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38, height: 38,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <div className="sidebar-brand-name">RDAM</div>
            {/* Sede seleccionada aparece aquí también (como en el poc: "Santa Fe") */}
            <div className="sidebar-brand-sub">{sede}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div
          style={{
            padding: "6px 18px 8px",
            fontSize: 10,
            color: "rgba(255,255,255,0.25)",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            fontWeight: 600,
          }}
        >
          {rol === "Administrador" ? "Administración" : "Operación"}
        </div>

        {itemsVisibles.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item${
              vista === item.id ||
              (vista === "expediente-detalle" && item.id === "expedientes")
                ? " active"
                : ""
            }`}
            onClick={() => onVista(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Rol badge */}
        <div
          style={{
            marginBottom: 12,
            padding: "6px 10px",
            background:
              rol === "Administrador"
                ? "rgba(217,119,6,0.15)"
                : "rgba(37,99,235,0.15)",
            border: `1px solid ${
              rol === "Administrador"
                ? "rgba(217,119,6,0.25)"
                : "rgba(37,99,235,0.25)"
            }`,
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: rol === "Administrador" ? "#fbbf24" : "#93c5fd",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}
          >
            {rol === "Administrador" ? "🔑 Administrador" : "👤 Operador"}
          </span>
        </div>

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {(user?.nombre || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name">{user?.nombre}</div>
            <div className="sidebar-user-role">{user?.departamento || user?.rol}</div>
          </div>
        </div>

        {/* ── Selector de Sede (igual que poc-rdam) ─────────── */}
        <div
          style={{
            marginTop: 14,
            padding: "0 2px",
          }}
        >
          <label
            htmlFor="sidebar-sede"
            style={{
              display: "block",
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              fontWeight: 600,
            }}
          >
            Sede
          </label>
          <select
            id="sidebar-sede"
            value={sede}
            onChange={(e) => cambiarSede(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              color: "#fff",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              outline: "none",
              transition: "border-color 0.2s ease, background 0.2s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(37,99,235,0.6)";
              e.target.style.background = "rgba(255,255,255,0.12)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255,255,255,0.2)";
              e.target.style.background = "rgba(255,255,255,0.08)";
            }}
          >
            {SEDES.map((s) => (
              <option
                key={s.value}
                value={s.value}
                style={{ color: "#000", background: "#f0f0f0" }}
              >
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="sidebar-nav-item"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 8,
            marginTop: 10,
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
