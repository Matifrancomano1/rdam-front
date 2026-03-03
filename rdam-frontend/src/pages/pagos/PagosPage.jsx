import { useState, useEffect, useCallback } from "react";
import { expedientesAPI } from "../../api/api.js";
import { Badge, Card, PageSpinner, EmptyState, Pagination, fmtMonto, fmtFechaHora } from "../../components/ui.jsx";

export default function PagosPage() {
  const [expedientes, setExpedientes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 30;

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      // Load expedientes that have been paid or have payment data
      const res = await expedientesAPI.listar({
        page,
        limit: LIMIT,
        sortOrder: "desc",
      });
      const exps = res.data?.expedientes || [];
      setExpedientes(exps);
      setTotal(res.data?.pagination?.total || 0);

      // Fetch payments for each expediente (only those with confirmed payments)
      const pagosPromesas = exps
        .filter(e => ["Pago Confirmado - Pendiente Validación", "Certificado Emitido"].includes(e.estado?.actual))
        .map(e => expedientesAPI.pagos(e.id).then(r => ({ expId: e.id, expNum: e.numeroExpediente, pagos: r.data?.pagos || [] })).catch(() => null));

      const resultados = await Promise.all(pagosPromesas);
      const allPagos = [];
      resultados.filter(Boolean).forEach(r => {
        r.pagos.forEach(p => allPagos.push({ ...p, expedienteNumero: r.expNum, expedienteId: r.expId }));
      });
      allPagos.sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));
      setPagos(allPagos);
    } catch {}
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de Pagos</h1>
          <p className="page-subtitle">{pagos.length} pagos encontrados</p>
        </div>
      </div>

      {loading ? <PageSpinner /> : pagos.length === 0 ? (
        <EmptyState icon="💳" title="Sin pagos registrados" subtitle="No hay pagos confirmados en el sistema." />
      ) : (
        <Card>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID Transacción</th><th>Expediente</th><th>Fecha</th><th>Monto</th><th>Método</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map(p => (
                  <tr key={p.id}>
                    <td className="mono" style={{ fontSize: 11 }}>{p.referenciaExterna || p.id?.substring(0, 8)}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{p.expedienteNumero}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtFechaHora(p.fechaPago)}</td>
                    <td style={{ fontWeight: 700, color: "var(--green)" }}>{fmtMonto(p.monto)}</td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {p.datosPasarela ? `**** ${p.datosPasarela.ultimosCuatroDigitos} ${p.datosPasarela.marca || ""}` : p.metodoPago || "—"}
                    </td>
                    <td>
                      <span className={`badge ${p.estadoPago === "confirmado" ? "badge-green" : p.estadoPago === "rechazado" ? "badge-red" : "badge-yellow"}`}>
                        {p.estadoPago}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
        </Card>
      )}
    </div>
  );
}
