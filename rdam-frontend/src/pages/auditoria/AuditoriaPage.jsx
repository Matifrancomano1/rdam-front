import { useState, useEffect, useCallback } from "react";
import { auditoriaAPI } from "../../api/api.js";
import { Card, Inp, PageSpinner, EmptyState, Pagination, fmtFechaHora } from "../../components/ui.jsx";

const ACCION_LABELS = {
  EXPEDIENTE_CREADO: "Expediente Creado",
  EXPEDIENTE_APROBADO: "Expediente Aprobado",
  EXPEDIENTE_RECHAZADO: "Expediente Rechazado",
  PAGO_CONFIRMADO: "Pago Confirmado",
  PAGO_VALIDADO: "Pago Validado",
  CERTIFICADO_EMITIDO: "Certificado Emitido",
  USUARIO_CREADO: "Usuario Creado",
  USUARIO_ACTUALIZADO: "Usuario Actualizado",
  LOGIN: "Inicio de Sesión",
  LOGOUT: "Cierre de Sesión",
};

const ACCION_COLORS = {
  EXPEDIENTE_APROBADO: "badge-green",
  EXPEDIENTE_RECHAZADO: "badge-red",
  PAGO_CONFIRMADO: "badge-blue",
  PAGO_VALIDADO: "badge-purple",
  CERTIFICADO_EMITIDO: "badge-purple",
  EXPEDIENTE_CREADO: "badge-yellow",
  LOGIN: "badge-slate",
  LOGOUT: "badge-slate",
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ usuarioId: "", expedienteId: "", accion: "", fechaDesde: "", fechaHasta: "" });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditoriaAPI.logs({ ...filters, page, limit: 50 });
      setLogs(res.data?.logs || []);
      setPagination(res.data?.pagination || { page, limit: 50, total: 0 });
    } catch {}
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { cargar(); }, [cargar]);

  const setF = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Logs de Auditoría</h1>
          <p className="page-subtitle">{pagination.total.toLocaleString()} registros</p>
        </div>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12 }}>
          <input className="form-input" placeholder="ID usuario" value={filters.usuarioId} onChange={e => setF("usuarioId", e.target.value)} />
          <input className="form-input" placeholder="ID expediente" value={filters.expedienteId} onChange={e => setF("expedienteId", e.target.value)} />
          <select className="form-select" value={filters.accion} onChange={e => setF("accion", e.target.value)}>
            <option value="">Todas las acciones</option>
            {Object.entries(ACCION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input className="form-input" type="date" value={filters.fechaDesde} onChange={e => setF("fechaDesde", e.target.value)} />
          <input className="form-input" type="date" value={filters.fechaHasta} onChange={e => setF("fechaHasta", e.target.value)} />
        </div>
      </Card>

      {loading ? <PageSpinner /> : logs.length === 0 ? (
        <EmptyState icon="📋" title="Sin logs de auditoría" subtitle="No hay registros que coincidan con los filtros." />
      ) : (
        <Card>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalles</th><th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtFechaHora(log.fecha)}</td>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{log.usuario?.nombre || "—"}</td>
                    <td>
                      <span className={`badge ${ACCION_COLORS[log.accion] || "badge-slate"}`}>
                        {ACCION_LABELS[log.accion] || log.accion}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      {log.entidad}{log.entidadId ? <span className="mono" style={{ marginLeft: 4, fontSize: 10 }}>({log.entidadId.substring(0, 8)}…)</span> : ""}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 260 }}>
                      {log.detalles && typeof log.detalles === "object"
                        ? Object.entries(log.detalles).map(([k, v]) => <div key={k}><strong>{k}:</strong> {String(v)}</div>)
                        : String(log.detalles || "—")}
                    </td>
                    <td className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{log.ipAddress || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={pagination.total} limit={50} onPage={setPage} />
        </Card>
      )}
    </div>
  );
}
