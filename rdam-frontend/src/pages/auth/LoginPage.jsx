import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Inp } from "../../components/ui.jsx";

const ROL_CONFIG = {
  Administrador: {
    icon: "🔑",
    color: "#d97706",
    bg: "rgba(217,119,6,0.12)",
    border: "rgba(217,119,6,0.45)",
    activeText: "#92400e",
    placeholder: "Ej: admin.rodriguez",
    subtitulo: "Acceso completo al sistema",
    gradient: "linear-gradient(135deg, #d97706, #f59e0b)",
  },
  Operador: {
    icon: "👤",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.1)",
    border: "rgba(37,99,235,0.45)",
    activeText: "#1e3a8a",
    placeholder: "Ej: mfrancomano",
    subtitulo: "RDAM — Uso exclusivo de personal autorizado",
    gradient: "linear-gradient(135deg, #1e40af, #3b82f6)",
  },
};

export default function LoginPage({ onBack }) {
  const { login } = useAuth();
  const [rolSeleccionado, setRolSeleccionado] = useState("Operador");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cfg = ROL_CONFIG[rolSeleccionado];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || "Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 60, height: 60,
              background: cfg.gradient,
              borderRadius: 16,
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 8px 24px ${cfg.border}`,
              transition: "all 0.3s ease",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            Acceso al Sistema
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0, transition: "all 0.2s" }}>
            {cfg.subtitulo}
          </p>
        </div>

        {/* ── Selector de Rol ── */}
        <div style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 5,
        }}>
          {["Administrador", "Operador"].map(rol => {
            const isActive = rolSeleccionado === rol;
            const c = ROL_CONFIG[rol];
            return (
              <button
                key={rol}
                onClick={() => { setRolSeleccionado(rol); setError(""); }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: isActive ? `1.5px solid ${c.border}` : "1.5px solid transparent",
                  background: isActive ? c.bg : "transparent",
                  color: isActive ? c.color : "var(--text-muted)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                }}
              >
                <span style={{ fontSize: 16 }}>{c.icon}</span>
                {rol}
              </button>
            );
          })}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <Inp
              label="Usuario"
              placeholder={cfg.placeholder}
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
            <Inp
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && (
              <div
                style={{
                  background: "var(--red-light)",
                  border: "1px solid rgba(220,38,38,0.25)",
                  color: "#991b1b",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                background: cfg.gradient,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: loading ? 0.75 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s ease",
                boxShadow: `0 4px 14px ${cfg.border}`,
              }}
            >
              {loading && <span className="spinner" style={{ width: 16, height: 16 }} />}
              {loading ? "Ingresando..." : `Ingresar como ${rolSeleccionado}`}
            </button>
          </form>
        </div>

        <button
          onClick={onBack}
          style={{
            marginTop: 18,
            display: "block",
            width: "100%",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit",
            padding: "8px 0",
          }}
        >
          ← Volver al Portal Ciudadano
        </button>
      </div>
    </div>
  );
}
