import { useState } from "react";
import { portalAPI } from "../../api/api.js";
import { fmtMonto } from "../../components/ui.jsx";

const BACKEND = "http://localhost:3000/v1";

/**
 * PagarPage — Resumen previo al pago, genera orden y hace POST form a PlusPagos
 *
 * Props:
 *   expediente  — datos del expediente { id, numeroExpediente, deudor, deuda, ... }
 *   onVolver    — callback para volver al portal
 */
export default function PagarPage({ expediente, onVolver }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paso, setPaso] = useState(null); // null | "creando" | "redirigiendo"

  if (!expediente) return null;

  const { deudor, deuda, numeroExpediente, id } = expediente;
  const monto = deuda?.montoAdeudado || 0;

  const iniciarPago = async () => {
    setLoading(true);
    setError("");
    setPaso("creando");

    try {
      // 1. Crear orden de pago en el backend (endpoint público)
      const res = await portalAPI.crearOrdenPublica(id, monto, deudor?.email);
      const orden = res.data || res;

      if (!orden?.checkoutUrl) {
        setError("No se pudo generar el link de pago. Intente nuevamente.");
        setLoading(false);
        setPaso(null);
        return;
      }

      setPaso("redirigiendo");

      // 2. Si PlusPagos requiere POST form (encriptado), hacer submit automático
      if (orden.plusPagosFormData && Object.keys(orden.plusPagosFormData).length > 0) {
        // Crear y enviar form POST automáticamente
        const form = document.createElement("form");
        form.method = "POST";
        form.action = orden.checkoutUrl;
        form.style.display = "none";

        Object.entries(orden.plusPagosFormData).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        setTimeout(() => form.submit(), 600);
      } else {
        // Fallback: redirect GET
        setTimeout(() => {
          window.location.href = orden.checkoutUrl;
        }, 800);
      }
    } catch (err) {
      const msg = err.message || "Error al procesar el pago. Intente nuevamente.";
      // Parse backend error codes
      if (msg.includes("INVALID_STATE")) {
        setError("Este expediente no está disponible para pago en este momento. Contacte a la sede.");
      } else if (msg.includes("INVALID_AMOUNT")) {
        setError("Error de monto. Por favor recargue la página y vuelva a intentar.");
      } else if (msg.includes("no encontrado") || err.status === 404) {
        setError("Expediente no encontrado. Por favor vuelva al portal.");
      } else {
        setError(msg);
      }
      setLoading(false);
      setPaso(null);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #050d1f 0%, #0c1628 40%, #0f213b 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
    }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes checkAnim { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); } 70% { box-shadow: 0 0 0 12px rgba(37,99,235,0); } 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); } }
        @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
      `}</style>

      {/* Card del pago */}
      <div style={{
        width: "100%",
        maxWidth: 500,
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 24,
        overflow: "hidden",
        animation: "fadeInUp 0.4s ease",
        boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      }}>

        {/* Header de la card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.3), rgba(124,58,237,0.3))",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "28px 32px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 42, height: 42,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, color: "#fff", fontSize: 18 }}>Resumen del Pago</div>
              <div style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{numeroExpediente}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Deudor</div>
          <div style={{ fontWeight: 700, color: "#fff", fontSize: 17 }}>{deudor?.nombreCompleto}</div>
        </div>

        {/* Cuerpo del resumen */}
        <div style={{ padding: "28px 32px" }}>

          {/* Monto destacado */}
          <div style={{
            textAlign: "center",
            padding: "24px 20px",
            background: "rgba(22,163,74,0.12)",
            border: "1px solid rgba(22,163,74,0.25)",
            borderRadius: 16,
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
              Total a Abonar
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: "#4ade80", letterSpacing: "-2px" }}>
              {fmtMonto(monto)}
            </div>
            {deuda?.periodoDeuda && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
                Período: {deuda.periodoDeuda}
              </div>
            )}
          </div>

          {/* Detalles */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Beneficiario/a", val: deuda?.beneficiario?.nombre },
              { label: "Parentesco", val: deuda?.beneficiario?.parentesco },
              { label: "Email confirmación", val: deudor?.email },
            ].filter(f => f.val).map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{f.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", textAlign: "right" }}>{f.val}</span>
              </div>
            ))}
          </div>

          {/* Aviso de pasarela */}
          <div style={{
            padding: "10px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            marginBottom: 20,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}>
            <span>🔒</span>
            <span>Serás redirigido a PlusPagos, la pasarela de pago segura del Gobierno de Santa Fe. El pago se procesa con encriptación SSL.</span>
          </div>

          {/* Progress paso a paso */}
          {paso && (
            <div style={{
              padding: "14px 16px",
              background: "rgba(37,99,235,0.12)",
              border: "1px solid rgba(37,99,235,0.25)",
              borderRadius: 12,
              marginBottom: 16,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { key: "creando", label: "Generando orden de pago segura...", done: paso === "redirigiendo" },
                  { key: "redirigiendo", label: "Conectando con PlusPagos...", done: false, active: paso === "redirigiendo" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      background: s.done ? "rgba(22,163,74,0.3)" : s.active ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.06)",
                      border: `2px solid ${s.done ? "rgba(22,163,74,0.6)" : s.active ? "rgba(37,99,235,0.6)" : "rgba(255,255,255,0.1)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                    }}>
                      {s.done ? "✓" : s.active ? (
                        <span style={{ width: 10, height: 10, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                      ) : "·"}
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: s.active || s.done ? 600 : 400,
                      color: s.done ? "#4ade80" : s.active ? "#93c5fd" : "rgba(255,255,255,0.3)",
                    }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: "12px 14px",
              background: "rgba(220,38,38,0.12)",
              border: "1px solid rgba(220,38,38,0.3)",
              borderRadius: 10,
              color: "#fca5a5",
              fontSize: 13,
              marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Botones */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={iniciarPago}
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px 24px",
                background: loading
                  ? "rgba(37,99,235,0.4)"
                  : "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                transition: "all 0.2s",
                boxShadow: loading ? "none" : "0 4px 20px rgba(37,99,235,0.4)",
                animation: !loading ? "pulse-ring 2.5s infinite" : "none",
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                  {paso === "redirigiendo" ? "Redirigiendo a PlusPagos..." : "Procesando..."}
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Ir a Pagar · {fmtMonto(monto)}
                </>
              )}
            </button>

            <button
              onClick={onVolver}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 24px",
                background: "transparent",
                color: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              ← Volver al portal
            </button>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #2563eb, #7c3aed)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>RDAM · Gobierno de la Provincia de Santa Fe</span>
      </div>
    </div>
  );
}
