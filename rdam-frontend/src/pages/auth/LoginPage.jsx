import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Inp } from "../../components/ui.jsx";

export default function LoginPage({ onBack }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      <div style={{ width: "100%", maxWidth: 420 }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 60,
              height: 60,
              background: "linear-gradient(135deg, #1e40af, #3b82f6)",
              borderRadius: 16,
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
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
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            RDAM — Uso exclusivo de personal autorizado
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <Inp
              label="Usuario"
              placeholder="Ej: mfrancomano"
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
                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
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
                transition: "all 0.18s",
                boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
              }}
            >
              {loading && <span className="spinner" style={{ width: 16, height: 16 }} />}
              {loading ? "Ingresando..." : "Iniciar Sesión"}
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
