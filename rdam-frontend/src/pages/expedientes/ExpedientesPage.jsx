import { useState, useEffect, useCallback } from "react";
import { expedientesAPI } from "../../api/api.js";
import { Badge, Btn, Card, Modal, Inp, Sel, Textarea, PageSpinner, EmptyState, Pagination, fmtMonto, fmtFecha } from "../../components/ui.jsx";

const SEDES = ["Santa Fe", "Rosario", "Venado Tuerto", "Rafaela", "Reconquista"];
const ESTADOS = [
  "Pendiente de Revisión",
  "Aprobado - Pendiente de Pago",
  "Pago Confirmado - Pendiente Validación",
  "Certificado Emitido",
  "Rechazado",
  "Expirado",
];

// ── Formulario para nuevo expediente ──────────────────────────
const FormNuevoExpediente = ({ onClose, onCreado, setToast }) => {
  const [form, setForm] = useState({
    nombreCompleto: "", tipoIdentificacion: "DNI", numeroIdentificacion: "",
    email: "", telefono: "", montoAdeudado: "", periodoDeuda: "",
    beneficiarioNombre: "", beneficiarioParentesco: "", sede: "Santa Fe", observaciones: ""
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nombreCompleto || !form.numeroIdentificacion || !form.email || !form.montoAdeudado) {
      setToast({ msg: "Complete los campos obligatorios.", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      const body = {
        deudor: { nombreCompleto: form.nombreCompleto, tipoIdentificacion: form.tipoIdentificacion, numeroIdentificacion: form.numeroIdentificacion, email: form.email, telefono: form.telefono },
        deuda: { montoAdeudado: parseFloat(form.montoAdeudado), periodoDeuda: form.periodoDeuda, beneficiario: { nombre: form.beneficiarioNombre, parentesco: form.beneficiarioParentesco } },
        sede: form.sede,
        observaciones: form.observaciones,
      };
      await expedientesAPI.crear(body);
      setToast({ msg: "✅ Expediente creado correctamente.", type: "success" });
      onCreado();
      onClose();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}><strong style={{ color: "var(--text-secondary)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Datos del Deudor</strong></div>
        <Inp label="Nombre Completo" required placeholder="Juan Carlos Pérez" value={form.nombreCompleto} onChange={e => set("nombreCompleto", e.target.value)} />
        <Sel label="Tipo Documento" required value={form.tipoIdentificacion} onChange={e => set("tipoIdentificacion", e.target.value)}>
          <option>DNI</option><option>CEDULA</option><option>PASAPORTE</option>
        </Sel>
        <Inp label="Número Documento" required placeholder="12345678" value={form.numeroIdentificacion} onChange={e => set("numeroIdentificacion", e.target.value)} />
        <Inp label="Email" required type="email" placeholder="juan@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
        <Inp label="Teléfono" placeholder="+54 11 1234-5678" value={form.telefono} onChange={e => set("telefono", e.target.value)} />

        <div style={{ gridColumn: "1/-1", marginTop: 8 }}><strong style={{ color: "var(--text-secondary)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Datos de la Deuda</strong></div>
        <Inp label="Monto Adeudado (ARS)" required type="number" placeholder="150000" value={form.montoAdeudado} onChange={e => set("montoAdeudado", e.target.value)} />
        <Inp label="Período de Deuda" placeholder="Ene 2023 - Dic 2024" value={form.periodoDeuda} onChange={e => set("periodoDeuda", e.target.value)} />
        <Inp label="Nombre del Beneficiario" placeholder="María Pérez" value={form.beneficiarioNombre} onChange={e => set("beneficiarioNombre", e.target.value)} />
        <Inp label="Parentesco" placeholder="Hija" value={form.beneficiarioParentesco} onChange={e => set("beneficiarioParentesco", e.target.value)} />

        <div style={{ gridColumn: "1/-1", marginTop: 8 }}><strong style={{ color: "var(--text-secondary)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Información Adicional</strong></div>
        <Sel label="Sede" required value={form.sede} onChange={e => set("sede", e.target.value)} style={{ gridColumn: "1/-1" }}>
          {SEDES.map(s => <option key={s}>{s}</option>)}
        </Sel>
        <div style={{ gridColumn: "1/-1" }}>
          <Textarea label="Observaciones" placeholder="Detalles del caso..." value={form.observaciones} onChange={e => set("observaciones", e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" loading={loading} onClick={handleSubmit}>Crear Expediente</Btn>
      </div>
    </>
  );
};

// ── Página principal ───────────────────────────────────────────
export default function ExpedientesPage({ onVerDetalle }) {
  const [expedientes, setExpedientes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estadoF, setEstadoF] = useState("");
  const [page, setPage] = useState(1);
  const [modNuevo, setModNuevo] = useState(false);
  const [toast, setToast] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expedientesAPI.listar({ search, estado: estadoF, page, limit: 20, sortOrder: "desc" });
      setExpedientes(res.data?.expedientes || []);
      setPagination(res.data?.pagination || { page, limit: 20, total: 0 });
    } catch (err) {
      setToast({ msg: `Error al cargar expedientes: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, estadoF, page]);

  useEffect(() => { cargar(); }, [cargar]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="fade-in">
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999 }}>
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Expedientes</h1>
          <p className="page-subtitle">{pagination.total} expedientes registrados</p>
        </div>
        <Btn variant="primary" onClick={() => setModNuevo(true)}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Expediente
        </Btn>
      </div>

      {/* Filtros */}
      <Card style={{ marginBottom: 20 }}>
        <div className="filters-row">
          <input
            className="form-input"
            placeholder="Buscar por nombre, DNI o número..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ flex: "2 1 240px" }}
          />
          <select
            className="form-select"
            value={estadoF}
            onChange={e => { setEstadoF(e.target.value); setPage(1); }}
            style={{ flex: "1 1 200px" }}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <Btn variant="outline" onClick={() => { setSearchInput(""); setEstadoF(""); setPage(1); }}>
            Limpiar
          </Btn>
        </div>
      </Card>

      {/* Lista */}
      {loading ? (
        <PageSpinner />
      ) : expedientes.length === 0 ? (
        <EmptyState icon="🔍" title="No se encontraron expedientes" subtitle="Intente con otros filtros o cree un expediente nuevo." />
      ) : (
        <Card>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nro. Expediente</th>
                  <th>Deudor</th>
                  <th>DNI</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expedientes.map(exp => (
                  <tr key={exp.id} style={{ cursor: "pointer" }} onClick={() => onVerDetalle(exp.id)}>
                    <td><span className="mono">{exp.numeroExpediente}</span></td>
                    <td><span style={{ fontWeight: 600 }}>{exp.deudor?.nombreCompleto}</span></td>
                    <td style={{ color: "var(--text-muted)" }}>{exp.deudor?.numeroIdentificacion || exp.deudor?.email}</td>
                    <td><span style={{ fontWeight: 700, color: "var(--red)" }}>{fmtMonto(exp.deuda?.montoAdeudado || 0)}</span></td>
                    <td><Badge estado={exp.estado?.actual} /></td>
                    <td style={{ color: "var(--text-muted)" }}>{fmtFecha(exp.fechaCreacion || exp.metadata?.fechaCreacion)}</td>
                    <td>
                      <Btn variant="ghost" size="sm" onClick={e => { e.stopPropagation(); onVerDetalle(exp.id); }}>Ver →</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={pagination.total} limit={pagination.limit} onPage={p => setPage(p)} />
        </Card>
      )}

      <Modal open={modNuevo} onClose={() => setModNuevo(false)} title="Nuevo Expediente" width={680}>
        <FormNuevoExpediente onClose={() => setModNuevo(false)} onCreado={cargar} setToast={setToast} />
      </Modal>
    </div>
  );
}
