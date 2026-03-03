import { useState } from "react";
import { Btn, Inp, Badge, fmtMonto, fmtFecha } from "../../components/ui.jsx";

// Public consultation — no auth needed
export default function PortalCiudadano({ onLoginInterno }) {
  const [tab, setTab] = useState("consulta"); // "consulta" | "resultado" | "vacio"
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const consultar = async () => {
    if (!dni.trim() || !email.trim()) {
      setError("Ingrese DNI y correo electrónico.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/v1/expedientes?search=${encodeURIComponent(dni.trim())}&limit=5`
      );
      const data = await res.json();
      const exps = data?.data?.expedientes || [];
      // Try to match by DNI and email
      const match = exps.find(
        (e) =>
          (e.deudor?.numeroIdentificacion === dni.trim() ||
            e.deudor?.email?.toLowerCase() === email.trim().toLowerCase())
      );
      if (match) {
        setResultado(match);
        setTab("resultado");
      } else {
        setTab("vacio");
      }
    } catch {
      // Fallback: show not-found
      setTab("vacio");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") consultar(); };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #060d1f 0%, #0d1f3c 45%, #091428 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -120, left: -120, width: 500, height: 500, background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 400, height: 400, background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
      </div>

      {/* Header */}
      <header style={{ padding: "20px 36px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>Portal RDAM</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px" }}>Provincia de Santa Fe</div>
          </div>
        </div>
        <button
          onClick={onLoginInterno}
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", padding: "8px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
        >
          Acceso Interno →
        </button>
      </header>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 500 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-block", background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 20, padding: "5px 16px", marginBottom: 18 }}>
              <span style={{ color: "#93c5fd", fontSize: 12, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>Consulta Pública</span>
            </div>
            <h1 style={{ fontSize: 40, fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-1.5px", lineHeight: 1.1 }}>
              Registro de Deudores<br />
              <span style={{ background: "linear-gradient(90deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Alimentarios Morosos</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, margin: 0 }}>Consultá si una persona figura en el registro.</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: 20, padding: 36, boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
            {tab === "consulta" && (
              <div className="fade-in">
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Consultar Situación</h2>
                <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Ingresá el DNI y correo para verificar si figura en el registro.</p>

                <Inp label="DNI / Identificación" placeholder="Ej: 12345678" value={dni} onChange={e => setDni(e.target.value)} onKeyDown={handleKey} />
                <Inp label="Correo Electrónico" type="email" placeholder="correo@dominio.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKey} />

                {error && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={consultar}
                  disabled={loading}
                  style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {loading && <span className="spinner" style={{ width: 16, height: 16 }} />}
                  {loading ? "Consultando..." : "Consultar Registro"}
                </button>
              </div>
            )}

            {tab === "vacio" && (
              <div className="fade-in" style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Sin deudas registradas</h3>
                <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>El DNI ingresado no figura en el Registro de Deudores Alimentarios Morosos de Santa Fe.</p>
                <Btn variant="outline" onClick={() => { setTab("consulta"); setDni(""); setEmail(""); }}>← Volver</Btn>
              </div>
            )}

            {tab === "resultado" && resultado && (
              <div className="fade-in">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>⚠️ Persona registrada</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{resultado.deudor?.nombreCompleto}</div>
                  </div>
                  <Badge estado={resultado.estado?.actual} />
                </div>

                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, marginBottom: 20, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {[
                      ["Expediente", resultado.numeroExpediente],
                      ["DNI", resultado.deudor?.numeroIdentificacion],
                      ["Monto Adeudado", fmtMonto(resultado.deuda?.montoAdeudado || 0)],
                      ["Fecha", fmtFecha(resultado.metadata?.fechaCreacion)],
                    ].map(([lbl, val]) => (
                      <div key={lbl}>
                        <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{lbl}</div>
                        <div style={{ fontWeight: 600, color: lbl === "Monto Adeudado" ? "#dc2626" : "#0f172a", fontSize: lbl === "Monto Adeudado" ? 17 : 14 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#78350f", marginBottom: 20 }}>
                  ⚠️ Esta información es de carácter público. Para más detalles, comuníquese con la Defensoría del Pueblo.
                </div>

                <Btn variant="outline" onClick={() => { setTab("consulta"); setDni(""); setEmail(""); setResultado(null); }} style={{ width: "100%" }}>← Nueva consulta</Btn>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer style={{ textAlign: "center", padding: "16px", color: "rgba(255,255,255,0.25)", fontSize: 12, position: "relative", zIndex: 1 }}>
        Gobierno de la Provincia de Santa Fe — Sistema RDAM v2.0
      </footer>
    </div>
  );
}
