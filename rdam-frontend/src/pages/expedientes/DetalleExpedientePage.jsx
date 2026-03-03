import { useState, useEffect, useCallback } from "react";
import { expedientesAPI, pagosAPI } from "../../api/api.js";
import { Badge, Btn, Card, Modal, Inp, Textarea, PageSpinner, fmtMonto, fmtFecha, fmtFechaHora, Alert } from "../../components/ui.jsx";

// ── Sub-componentes ───────────────────────────────────────────

const InfoRow = ({ label, value, mono }) => (
  <div>
    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
    <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14, fontFamily: mono ? "monospace" : "inherit" }}>{value || "—"}</div>
  </div>
);

const Historial = ({ expedienteId }) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expedientesAPI.historial(expedienteId)
      .then(r => setHistorial(r.data?.historial || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expedienteId]);

  if (loading) return <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando historial...</div>;

  return (
    <div className="timeline">
      {historial.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Sin historial disponible.</p>
      ) : historial.map(h => (
        <div key={h.id} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-date">{fmtFechaHora(h.fechaCambio)}</div>
          <div className="timeline-title">{h.estadoNuevo || "Estado actualizado"}</div>
          <div className="timeline-desc">
            {h.estadoAnterior && <span style={{ opacity: 0.6 }}>Desde: {h.estadoAnterior} — </span>}
            {h.observaciones}
          </div>
          {h.usuario?.nombre && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>👤 {h.usuario.nombre}</div>
          )}
        </div>
      ))}
    </div>
  );
};

const Documentos = ({ expedienteId, setToast }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const cargar = useCallback(() => {
    expedientesAPI.listarDocumentos(expedienteId)
      .then(r => setDocs(r.data?.documentos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expedienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  const subir = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setToast({ msg: "Solo se aceptan archivos PDF.", type: "warning" }); return; }
    setUploading(true);
    try {
      await expedientesAPI.subirDocumento(expedienteId, file);
      setToast({ msg: "✅ Documento subido correctamente.", type: "success" });
      cargar();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) subir(file);
  };

  return (
    <div>
      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando documentos...</div>
      ) : docs.length > 0 ? (
        <div style={{ marginBottom: 14 }}>
          {docs.map(d => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ background: "var(--red-light)", color: "var(--red)", padding: "3px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700 }}>PDF</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nombreArchivo}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{(d.tamañoBytes / 1024).toFixed(0)} KB — {fmtFecha(d.fechaSubida)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12 }}>Sin documentos adjuntos.</p>
      )}

      {/* Upload */}
      <div
        className={`file-drop${drag ? " drag-over" : ""}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById(`doc-upload-${expedienteId}`)?.click()}
      >
        <input id={`doc-upload-${expedienteId}`} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => subir(e.target.files[0])} />
        {uploading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span className="spinner" style={{ width: 16, height: 16 }} />
            <span>Subiendo...</span>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Subir documento PDF</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>Arrastrá o hacé click para seleccionar</div>
          </>
        )}
      </div>
    </div>
  );
};

const Pagos = ({ expedienteId, expediente, setToast, onRefresh }) => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modOrden, setModOrden] = useState(false);
  const [modValidar, setModValidar] = useState(false);
  const [modCert, setModCert] = useState(false);
  const [selectedPago, setSelectedPago] = useState(null);
  const [obs, setObs] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  const cargar = useCallback(() => {
    expedientesAPI.pagos(expedienteId)
      .then(r => setPagos(r.data?.pagos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expedienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  const crearOrden = async () => {
    setSubmitting(true);
    try {
      const res = await pagosAPI.crearOrden(expedienteId, expediente.deuda?.montoAdeudado, expediente.deudor?.email);
      const url = res.data?.checkoutUrl;
      setToast({ msg: "✅ Orden de pago creada. Redirigiendo a pasarela...", type: "success" });
      if (url) setTimeout(() => window.open(url, "_blank"), 800);
      setModOrden(false);
      onRefresh();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const validarPago = async () => {
    if (!selectedPago) return;
    setSubmitting(true);
    try {
      await expedientesAPI.validarPago(expedienteId, selectedPago.id, obs);
      setToast({ msg: "✅ Pago validado correctamente.", type: "success" });
      setModValidar(false); setObs("");
      cargar(); onRefresh();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const subirCertificado = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setToast({ msg: "Solo se aceptan PDF.", type: "warning" }); return; }
    setUploadingCert(true);
    try {
      await expedientesAPI.subirCertificado(expedienteId, file);
      setToast({ msg: "✅ Certificado cargado correctamente.", type: "success" });
      setModCert(false);
      onRefresh();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally {
      setUploadingCert(false);
    }
  };

  const estado = expediente?.estado?.actual;

  return (
    <div>
      {/* Botones de acción según estado */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {estado === "Aprobado - Pendiente de Pago" && (
          <Btn variant="primary" onClick={() => setModOrden(true)}>
            💳 Crear Orden de Pago
          </Btn>
        )}
        {estado === "Pago Confirmado - Pendiente Validación" && pagos.length > 0 && (
          <>
            <Btn variant="success" onClick={() => { setSelectedPago(pagos[0]); setModValidar(true); }}>
              ✔ Validar Pago
            </Btn>
            <Btn variant="warning" onClick={() => setModCert(true)}>
              📤 Subir Certificado
            </Btn>
          </>
        )}
        {estado === "Certificado Emitido" && (
          <a
            href={expedientesAPI.descargarCertificado(expedienteId)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-sm"
          >
            📥 Descargar Certificado
          </a>
        )}
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando pagos...</div>
      ) : pagos.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No hay pagos registrados.</p>
      ) : pagos.map(p => (
        <div key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--green)", fontSize: 18 }}>{fmtMonto(p.monto)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                <span className="mono">{p.referenciaExterna}</span> · {fmtFechaHora(p.fechaPago)}
              </div>
              {p.datosPasarela && (
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                  💳 **** {p.datosPasarela.ultimosCuatroDigitos} {p.datosPasarela.marca}
                </div>
              )}
            </div>
            <span className={`badge ${p.estadoPago === "confirmado" ? "badge-green" : p.estadoPago === "rechazado" ? "badge-red" : "badge-yellow"}`}>
              {p.estadoPago}
            </span>
          </div>
          {p.validacion && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              ✅ Validado por {p.validacion.nombreUsuario} el {fmtFecha(p.validacion.fechaValidacion)}
            </div>
          )}
        </div>
      ))}

      {/* Modales */}
      <Modal open={modOrden} onClose={() => setModOrden(false)} title="Crear Orden de Pago">
        <Alert type="info">Se creará una orden de pago por <strong>{fmtMonto(expediente?.deuda?.montoAdeudado || 0)}</strong> y se enviará al email del deudor.</Alert>
        <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="outline" onClick={() => setModOrden(false)}>Cancelar</Btn>
          <Btn variant="primary" loading={submitting} onClick={crearOrden}>Confirmar y Enviar</Btn>
        </div>
      </Modal>

      <Modal open={modValidar} onClose={() => setModValidar(false)} title="Validar Pago">
        <Alert type="info">Esta acción confirma que el pago fue verificado y emitirá el certificado automáticamente.</Alert>
        <div style={{ marginTop: 16 }}>
          <Textarea label="Observaciones" placeholder="Pago verificado correctamente..." value={obs} onChange={e => setObs(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="outline" onClick={() => setModValidar(false)}>Cancelar</Btn>
          <Btn variant="success" loading={submitting} onClick={validarPago}>Validar Pago</Btn>
        </div>
      </Modal>

      <Modal open={modCert} onClose={() => setModCert(false)} title="Subir Certificado PDF">
        <Alert type="info">Subí el PDF del certificado de libre deuda (máx. 10 MB).</Alert>
        <div
          className="file-drop"
          style={{ marginTop: 16 }}
          onClick={() => document.getElementById("cert-upload")?.click()}
        >
          <input id="cert-upload" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => subirCertificado(e.target.files[0])} />
          {uploadingCert ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span className="spinner" style={{ width: 16, height: 16 }} /><span>Subiendo...</span>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📜</div>
              <div style={{ fontWeight: 600 }}>Seleccionar PDF del certificado</div>
            </>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <Btn variant="outline" onClick={() => setModCert(false)}>Cerrar</Btn>
        </div>
      </Modal>
    </div>
  );
};

// ── Página de Detalle ─────────────────────────────────────────
export default function DetalleExpedientePage({ expedienteId, onBack }) {
  const [exp, setExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modAp, setModAp] = useState(false);
  const [modRe, setModRe] = useState(false);
  const [obs, setObs] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const cargar = useCallback(() => {
    setLoading(true);
    expedientesAPI.obtener(expedienteId)
      .then(r => setExp(r.data))
      .catch(() => setToast({ msg: "Error al cargar el expediente.", type: "error" }))
      .finally(() => setLoading(false));
  }, [expedienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  const aprobar = async () => {
    setSubmitting(true);
    try {
      await expedientesAPI.aprobar(expedienteId, obs);
      setToast({ msg: "✅ Expediente aprobado correctamente.", type: "success" });
      setModAp(false); setObs(""); cargar();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally { setSubmitting(false); }
  };

  const rechazar = async () => {
    if (!obs.trim()) { setToast({ msg: "El motivo de rechazo es obligatorio.", type: "warning" }); return; }
    setSubmitting(true);
    try {
      await expedientesAPI.rechazar(expedienteId, obs);
      setToast({ msg: "Expediente rechazado.", type: "info" });
      setModRe(false); setObs(""); cargar();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally { setSubmitting(false); }
  };

  if (loading) return <PageSpinner text="Cargando expediente..." />;
  if (!exp) return <div style={{ color: "var(--red)", padding: 32 }}>No se encontró el expediente.</div>;

  const estado = exp.estado?.actual;
  const esPendiente = estado === "Pendiente de Revisión";

  return (
    <div className="fade-in">
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999 }}>
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
        <button onClick={onBack} className="btn btn-outline btn-sm">← Volver</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{exp.deudor?.nombreCompleto}</h1>
          <span className="mono" style={{ color: "var(--text-muted)" }}>{exp.numeroExpediente}</span>
        </div>
        <Badge estado={estado} />
      </div>

      {/* Grid principal */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Datos del deudor */}
          <Card>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>Datos del Deudor</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <InfoRow label="Nombre Completo" value={exp.deudor?.nombreCompleto} />
              <InfoRow label={exp.deudor?.tipoIdentificacion || "DNI"} value={exp.deudor?.numeroIdentificacion} mono />
              <InfoRow label="Email" value={exp.deudor?.email} />
              <InfoRow label="Teléfono" value={exp.deudor?.telefono} />
              <InfoRow label="Monto Adeudado" value={fmtMonto(exp.deuda?.montoAdeudado || 0)} />
              <InfoRow label="Período" value={exp.deuda?.periodoDeuda} />
              <InfoRow label="Beneficiario" value={exp.deuda?.beneficiario?.nombre} />
              <InfoRow label="Parentesco" value={exp.deuda?.beneficiario?.parentesco} />
              <InfoRow label="Sede" value={exp.metadata?.sede} />
            </div>
            {exp.metadata?.observaciones && (
              <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)" }}>
                <strong>Observaciones:</strong> {exp.metadata.observaciones}
              </div>
            )}
          </Card>

          {/* Historial */}
          <Card>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>Historial de Estados</h2>
            <Historial expedienteId={expedienteId} />
          </Card>

          {/* Pagos */}
          <Card>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>Pagos</h2>
            <Pagos expedienteId={expedienteId} expediente={exp} setToast={setToast} onRefresh={cargar} />
          </Card>
        </div>

        {/* Columna derecha */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Acciones */}
          {esPendiente && (
            <Card>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Acciones</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Btn variant="success" style={{ justifyContent: "center" }} onClick={() => setModAp(true)}>✅ Aprobar</Btn>
                <Btn variant="danger" style={{ justifyContent: "center" }} onClick={() => setModRe(true)}>✗ Rechazar</Btn>
              </div>
            </Card>
          )}

          {/* Estado */}
          <Card>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Estado Actual</h2>
            <Badge estado={estado} />
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
              <div>Actualizado: {fmtFechaHora(exp.estado?.fechaActualizacion)}</div>
              {exp.estado?.fechaExpiracion && <div style={{ marginTop: 4, color: "var(--red)" }}>⚠️ Expira: {fmtFecha(exp.estado.fechaExpiracion)}</div>}
            </div>
          </Card>

          {/* Documentos */}
          <Card>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Documentos</h2>
            <Documentos expedienteId={expedienteId} setToast={setToast} />
          </Card>
        </div>
      </div>

      {/* Modal Aprobar */}
      <Modal open={modAp} onClose={() => setModAp(false)} title="Aprobar Expediente">
        <Alert type="info">¿Confirmás la aprobación? El deudor recibirá un link de pago por email.</Alert>
        <div style={{ marginTop: 16 }}>
          <Textarea label="Observaciones (opcional)" placeholder="Documentación completa y verificada..." value={obs} onChange={e => setObs(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="outline" onClick={() => setModAp(false)}>Cancelar</Btn>
          <Btn variant="success" loading={submitting} onClick={aprobar}>Confirmar Aprobación</Btn>
        </div>
      </Modal>

      {/* Modal Rechazar */}
      <Modal open={modRe} onClose={() => setModRe(false)} title="Rechazar Expediente">
        <Alert type="danger">⚠️ Esta acción cambiará el estado a Rechazado. Ingresá el motivo.</Alert>
        <div style={{ marginTop: 16 }}>
          <Textarea label="Motivo del Rechazo" required placeholder="Documentación incompleta..." value={obs} onChange={e => setObs(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="outline" onClick={() => setModRe(false)}>Cancelar</Btn>
          <Btn variant="danger" loading={submitting} onClick={rechazar}>Confirmar Rechazo</Btn>
        </div>
      </Modal>
    </div>
  );
}
