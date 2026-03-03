import { useState, useEffect } from "react";
import { dashboardAPI } from "../../api/api.js";
import { Card, PageSpinner, fmtFechaHora, Badge } from "../../components/ui.jsx";

const TIPO_LABELS = {
  CERTIFICADO_EMITIDO: "Certificado emitido",
  PAGO_CONFIRMADO: "Pago confirmado",
  EXPEDIENTE_CREADO: "Expediente creado",
  EXPEDIENTE_APROBADO: "Expediente aprobado",
  EXPEDIENTE_RECHAZADO: "Expediente rechazado",
  PAGO_VALIDADO: "Pago validado",
};

const TIPO_ICONS = {
  CERTIFICADO_EMITIDO: "📜",
  PAGO_CONFIRMADO: "💳",
  EXPEDIENTE_CREADO: "📄",
  EXPEDIENTE_APROBADO: "✅",
  EXPEDIENTE_RECHAZADO: "❌",
  PAGO_VALIDADO: "🔍",
};

export default function DashboardPage({ usuario }) {
  const [metricas, setMetricas] = useState(null);
  const [actividad, setActividad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([dashboardAPI.metricas(), dashboardAPI.actividadReciente(8)])
      .then(([m, a]) => {
        if (!mounted) return;
        setMetricas(m.data);
        setActividad(a.data?.actividades || []);
      })
      .catch(() => {
        if (mounted) setError("No se pudieron cargar las métricas del servidor.");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <PageSpinner text="Cargando dashboard..." />;

  const stats = metricas
    ? [
        { label: "Total Expedientes",          value: metricas.totales?.expedientes || 0,           color: "#2563eb", icon: "📂" },
        { label: "Pendientes de Revisión",      value: metricas.totales?.pendientesRevision || 0,    color: "#d97706", icon: "⏳" },
        { label: "Pendientes Validar Pago",     value: metricas.totales?.pendientesValidacionPago || 0, color: "#7c3aed", icon: "💳" },
        { label: "Certificados Emitidos",       value: metricas.totales?.certificadosEmitidos || 0,  color: "#16a34a", icon: "📜" },
      ]
    : [];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Dashboard Operativo</h1>
        <p className="page-subtitle">
          Bienvenido, <strong>{usuario?.nombre}</strong> — {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {error && (
        <div style={{ background: "var(--yellow-light)", border: "1px solid rgba(217,119,6,0.3)", color: "#78350f", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13 }}>
          ⚠️ {error} Se muestran datos parciales.
        </div>
      )}

      {/* Stat Cards */}
      <div className="stat-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-accent" style={{ background: s.color }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
              </div>
              <span style={{ fontSize: 28, opacity: 0.6 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Grid de 2 columnas */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Actividad reciente */}
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>Actividad Reciente</h2>
          {actividad.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)" }}>Sin actividad reciente</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Expediente</th>
                    <th>Acción</th>
                    <th>Deudor</th>
                    <th>Usuario</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {actividad.map(act => (
                    <tr key={act.id}>
                      <td><span className="mono">{act.expediente?.numeroExpediente || "—"}</span></td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                          <span>{TIPO_ICONS[act.tipo] || "📝"}</span>
                          <span style={{ fontWeight: 500 }}>{TIPO_LABELS[act.tipo] || act.tipo}</span>
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{act.expediente?.deudor || "—"}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{act.usuario?.nombre || "Sistema"}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{fmtFechaHora(act.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Estado por categoría */}
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 20 }}>Distribución por Estado</h2>
          {metricas?.porEstado?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {metricas.porEstado.map(e => (
                <div key={e.estado}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500, flex: 1, paddingRight: 8 }}>{e.estado}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>{e.cantidad}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${e.porcentaje}%`, background: "linear-gradient(90deg, #2563eb, #7c3aed)", borderRadius: 99, transition: "width 0.6s ease" }} />
                  </div>
                  <div style={{ textAlign: "right", fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{e.porcentaje}%</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin datos disponibles</div>
          )}

          {/* Alertas */}
          {metricas?.alertas && (
            <div style={{ marginTop: 24, padding: "14px 16px", background: "var(--yellow-light)", border: "1px solid rgba(217,119,6,0.25)", borderRadius: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#78350f", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>⚠️ Alertas</div>
              <div style={{ fontSize: 13, color: "#92400e" }}>
                <div>{metricas.alertas.proximosExpirar} expedientes próximos a expirar</div>
                <div>{metricas.alertas.pendientesVencidos} pendientes vencidos</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
