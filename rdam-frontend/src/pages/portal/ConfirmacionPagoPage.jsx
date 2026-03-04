import { useState, useEffect, useCallback } from "react";
import { fmtMonto } from "../../components/ui.jsx";
import { portalAPI } from "../../api/api.js";

/**
 * ConfirmacionPagoPage — Landing page de retorno de la pasarela PlusPagos
 *
 * 1. Verifica el resultado contra el backend (por referencia)
 * 2. Muestra el estado del pago con animación
 * 3. Permite al usuario volver al portal o reintentar si fue rechazado
 */
export default function ConfirmacionPagoPage({ params = {}, onVolver }) {
  const { estado, pagoId, monto, referencia, numeroExpediente } = params;
  const [countdown, setCountdown] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [datosVerificados, setDatosVerificados] = useState(null); // datos del backend después de verificar
  const [errorVerificacion, setErrorVerificacion] = useState(null);

  // ── Verificar contra el backend por referencia ────────────────
  const verificarConBackend = useCallback(async () => {
    const ref = referencia || params.merchant_order_id || params.ref;
    if (!ref) return; // sin referencia no podemos verificar

    setVerificando(true);
    setErrorVerificacion(null);
    try {
      const res = await portalAPI.verificarPago(ref);
      const data = res.data || res;
      setDatosVerificados(data);
    } catch {
      // No bloquear — mostrar igual los datos que llegaron en los query params
      setErrorVerificacion("No se pudo verificar el estado del pago con el servidor.");
    } finally {
      setVerificando(false);
    }
  }, [referencia, params]);

  useEffect(() => {
    verificarConBackend();
  }, [verificarConBackend]);

  // ── Countdown para aprobado ────────────────────────────────────
  useEffect(() => {
    if (estado === "aprobado") {
      let s = 15;
      setCountdown(s);
      const t = setInterval(() => {
        s -= 1;
        setCountdown(s);
        if (s <= 0) {
          clearInterval(t);
          onVolver?.();
        }
      }, 1000);
      return () => clearInterval(t);
    }
  }, [estado, onVolver]);

  // ── Estado efectivo (backend tiene prioridad sobre query params) ──
  const estadoEfectivo = (() => {
    if (datosVerificados?.estadoPago) {
      const m = { "confirmado": "aprobado", "pendiente": "pendiente", "rechazado": "rechazado" };
      return m[datosVerificados.estadoPago] ?? estado ?? "pendiente";
    }
    return estado ?? "pendiente";
  })();

  const montoEfectivo = datosVerificados?.monto ?? (monto ? parseFloat(monto) : null);
  const expNumero = datosVerificados?.numeroExpediente ?? numeroExpediente ?? null;
  const pagoIdEffective = datosVerificados?.pagoId ?? pagoId ?? null;
  const referenciaEfectiva = datosVerificados?.referenciaExterna ?? referencia ?? null;

  // ── Configuración por estado ──────────────────────────────────
  const configs = {
    aprobado: {
      icon: "✅",
      title: "¡Pago Exitoso!",
      subtitle: "Su pago fue procesado correctamente y está siendo validado.",
      color: "#4ade80",
      bg: "rgba(22,163,74,0.15)",
      border: "rgba(22,163,74,0.35)",
      glowColor: "rgba(22,163,74,0.2)",
      steps: [
        { done: true,  icon: "💳", text: "Pago recibido por PlusPagos" },
        { done: true,  icon: "🔍", text: "Verificación automática completada" },
        { done: false, icon: "👤", text: "Validación interna por operador (1-2 días hábiles)" },
        { done: false, icon: "📜", text: "Certificado de libre deuda disponible" },
      ],
    },
    pendiente: {
      icon: "⏳",
      title: "Pago en Proceso",
      subtitle: "Su pago está siendo procesado. Le notificaremos cuando se confirme.",
      color: "#fbbf24",
      bg: "rgba(217,119,6,0.15)",
      border: "rgba(217,119,6,0.35)",
      glowColor: "rgba(217,119,6,0.15)",
      steps: [
        { done: true,  icon: "💳", text: "Intento de pago registrado" },
        { done: false, icon: "🔄", text: "Confirmación pendiente de la pasarela" },
        { done: false, icon: "👤", text: "Validación interna" },
        { done: false, icon: "📜", text: "Emisión del certificado" },
      ],
    },
    rechazado: {
      icon: "❌",
      title: "Pago Rechazado",
      subtitle: "Su pago no pudo procesarse. Por favor intente con otro medio de pago.",
      color: "#f87171",
      bg: "rgba(220,38,38,0.15)",
      border: "rgba(220,38,38,0.35)",
      glowColor: "rgba(220,38,38,0.15)",
      steps: [],
    },
  };

  const cfg = configs[estadoEfectivo] || configs["pendiente"];

  const causasRechazo = [
    "Fondos insuficientes en la tarjeta.",
    "Datos de la tarjeta incorrectos.",
    "Límite de compras por internet alcanzado.",
    "Tarjeta bloqueada por el banco emisor.",
  ];

  const copiarReferencia = () => {
    if (referenciaEfectiva) {
      navigator.clipboard.writeText(referenciaEfectiva).catch(() => {});
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
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-success { 0% { box-shadow: 0 0 0 0 ${cfg.glowColor}; } 70% { box-shadow: 0 0 0 20px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }
        @keyframes checkBounce { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      {/* Pantalla de verificación */}
      {verificando && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(5,13,31,0.85)", backdropFilter: "blur(8px)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
        }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600 }}>Verificando estado del pago...</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Consultando con el servidor</div>
        </div>
      )}

      <div style={{
        width: "100%",
        maxWidth: 560,
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${cfg.border}`,
        borderRadius: 24,
        overflow: "hidden",
        animation: "fadeInUp 0.5s ease",
        boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 80px ${cfg.glowColor}`,
      }}>

        {/* Header */}
        <div style={{
          background: cfg.bg,
          borderBottom: `1px solid ${cfg.border}`,
          padding: "36px 32px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 56, marginBottom: 14, animation: "checkBounce 0.6s ease", display: "block" }}>
            {cfg.icon}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: cfg.color, letterSpacing: "-0.5px", margin: "0 0 8px" }}>
            {cfg.title}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
            {cfg.subtitle}
          </p>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: "28px 32px" }}>

          {/* Error de verificación (no bloquea) */}
          {errorVerificacion && !verificando && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(217,119,6,0.1)",
              border: "1px solid rgba(217,119,6,0.3)",
              borderRadius: 10,
              fontSize: 12,
              color: "#fbbf24",
              marginBottom: 20,
            }}>
              ⚠️ {errorVerificacion}
            </div>
          )}

          {/* Datos de la transacción */}
          {(referenciaEfectiva || montoEfectivo || pagoIdEffective || expNumero) && (
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "18px 20px",
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>
                Detalle de la Transacción
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Monto Abonado",    val: montoEfectivo ? fmtMonto(montoEfectivo) : null, highlight: true },
                  { label: "N° de Expediente", val: expNumero, mono: true },
                  { label: "ID de Pago",       val: pagoIdEffective, mono: true },
                  { label: "Ref. Pasarela",    val: referenciaEfectiva, mono: true, copyable: true },
                  { label: "Estado",           val: cfg.title },
                ].filter(f => f.val).map((f, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{f.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: f.highlight ? "#4ade80" : f.mono ? "#93c5fd" : "#fff",
                        fontFamily: f.mono ? "monospace" : "inherit",
                      }}>
                        {f.val}
                      </span>
                      {f.copyable && (
                        <button
                          onClick={copiarReferencia}
                          title="Copiar referencia"
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "rgba(255,255,255,0.35)", padding: 2, fontSize: 13,
                          }}
                        >📋</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pasos del proceso */}
          {cfg.steps.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>
                Estado del Trámite
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {cfg.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, paddingBottom: i < cfg.steps.length - 1 ? 18 : 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: step.done ? "rgba(22,163,74,0.25)" : "rgba(255,255,255,0.06)",
                        border: `2px solid ${step.done ? "rgba(22,163,74,0.5)" : "rgba(255,255,255,0.12)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                      }}>
                        {step.done ? "✓" : step.icon}
                      </div>
                      {i < cfg.steps.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 16, background: step.done ? "rgba(22,163,74,0.3)" : "rgba(255,255,255,0.08)", marginTop: 4 }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 5 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: step.done ? 700 : 400,
                        color: step.done ? "#fff" : "rgba(255,255,255,0.45)",
                      }}>
                        {step.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Causas de rechazo */}
          {estadoEfectivo === "rechazado" && (
            <div style={{
              background: "rgba(220,38,38,0.1)",
              border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: 12,
              padding: "16px 18px",
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", marginBottom: 10 }}>
                Causas frecuentes de rechazo:
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 6 }}>
                {causasRechazo.map((c, i) => (
                  <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Countdown para aprobado */}
          {estadoEfectivo === "aprobado" && countdown !== null && (
            <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
              Volviendo al portal en <strong style={{ color: "rgba(255,255,255,0.6)" }}>{countdown}s</strong>...
            </div>
          )}

          {/* Botones */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {estadoEfectivo === "rechazado" && (
              <button
                onClick={onVolver}
                style={{
                  width: "100%", padding: "14px 24px",
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "#fff", border: "none", borderRadius: 12,
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
                }}
              >
                💳 Intentar con otro medio de pago
              </button>
            )}

            <button
              onClick={onVolver}
              style={{
                width: "100%", padding: "12px 24px",
                background: estadoEfectivo === "aprobado"
                  ? "linear-gradient(135deg, rgba(22,163,74,0.3), rgba(22,163,74,0.2))"
                  : "rgba(255,255,255,0.06)",
                color: estadoEfectivo === "aprobado" ? "#4ade80" : "rgba(255,255,255,0.5)",
                border: `1px solid ${estadoEfectivo === "aprobado" ? "rgba(22,163,74,0.35)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              {estadoEfectivo === "aprobado" ? "🏠 Volver al Portal" : "← Volver al Portal"}
            </button>
          </div>

          {/* Info qué pasa ahora */}
          {(estadoEfectivo === "aprobado" || estadoEfectivo === "pendiente") && (
            <div style={{
              marginTop: 20, padding: "14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, fontSize: 12,
              color: "rgba(255,255,255,0.35)", lineHeight: 1.6,
            }}>
              📧 Un operador revisará el pago en los próximos 1-2 días hábiles. Cuando el certificado esté listo, podés descargarlo desde el portal usando tu DNI. Guardá tu número de referencia.
            </div>
          )}
        </div>
      </div>

      {/* Sello */}
      <div style={{ marginTop: 24, fontSize: 11, color: "rgba(255,255,255,0.15)", textAlign: "center" }}>
        RDAM · Gobierno de la Provincia de Santa Fe · 2026
      </div>
    </div>
  );
}
