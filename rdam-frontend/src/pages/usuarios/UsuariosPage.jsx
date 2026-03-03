import { useState, useEffect, useCallback } from "react";
import { usuariosAPI } from "../../api/api.js";
import { Btn, Card, Modal, Inp, Sel, PageSpinner, EmptyState, Pagination, fmtFechaHora } from "../../components/ui.jsx";

const ROLES = ["Operador", "Administrador"];
const SEDES = ["Santa Fe", "Rosario", "Venado Tuerto", "Rafaela", "Reconquista"];

const FormUsuario = ({ inicial, onClose, onGuardado, setToast }) => {
  const [form, setForm] = useState(inicial || { username: "", nombre: "", email: "", telefono: "", password: "", rol: "Operador", departamento: "Santa Fe", activo: true });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const esEdicion = !!inicial?.id;

  const handleSubmit = async () => {
    if (!form.nombre || !form.email || (!esEdicion && !form.password)) {
      setToast({ msg: "Complete todos los campos obligatorios.", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      if (esEdicion) {
        const { password, username, ...body } = form;
        await usuariosAPI.actualizar(inicial.id, body);
        setToast({ msg: "✅ Usuario actualizado.", type: "success" });
      } else {
        await usuariosAPI.crear(form);
        setToast({ msg: "✅ Usuario creado.", type: "success" });
      }
      onGuardado();
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
        {!esEdicion && <Inp label="Nombre de usuario" required placeholder="jperez" value={form.username} onChange={e => set("username", e.target.value)} />}
        <Inp label="Nombre Completo" required placeholder="Juan Pérez" value={form.nombre} onChange={e => set("nombre", e.target.value)} />
        <Inp label="Email" required type="email" placeholder="juan@rdam.gob.ar" value={form.email} onChange={e => set("email", e.target.value)} />
        <Inp label="Teléfono" placeholder="+54 11 1234-5678" value={form.telefono} onChange={e => set("telefono", e.target.value)} />
        {!esEdicion && <Inp label="Contraseña" required type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} />}
        <Sel label="Rol" required value={form.rol} onChange={e => set("rol", e.target.value)}>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </Sel>
        <Sel label="Sede" required value={form.departamento} onChange={e => set("departamento", e.target.value)}>
          {SEDES.map(s => <option key={s}>{s}</option>)}
        </Sel>
        {esEdicion && (
          <Sel label="Estado" value={String(form.activo)} onChange={e => set("activo", e.target.value === "true")}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </Sel>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" loading={loading} onClick={handleSubmit}>{esEdicion ? "Guardar Cambios" : "Crear Usuario"}</Btn>
      </div>
    </>
  );
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rolF, setRolF] = useState("");
  const [page, setPage] = useState(1);
  const [modNuevo, setModNuevo] = useState(false);
  const [editando, setEditando] = useState(null);
  const [toast, setToast] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usuariosAPI.listar({ search, rol: rolF, page, limit: 20 });
      setUsuarios(res.data?.usuarios || []);
      setPagination(res.data?.pagination || { page, limit: 20, total: 0 });
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, rolF, page]);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = async (id, nombre) => {
    if (!window.confirm(`¿Desactivar al usuario "${nombre}"?`)) return;
    try {
      await usuariosAPI.eliminar(id);
      setToast({ msg: "Usuario desactivado.", type: "info" });
      cargar();
    } catch (err) {
      setToast({ msg: `Error: ${err.message}`, type: "error" });
    }
  };

  return (
    <div className="fade-in">
      {toast && <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999 }}><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">{pagination.total} usuarios registrados</p>
        </div>
        <Btn variant="primary" onClick={() => setModNuevo(true)}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Usuario
        </Btn>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div className="filters-row">
          <input className="form-input" placeholder="Buscar por nombre, email o usuario..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: "2 1 220px" }} />
          <select className="form-select" value={rolF} onChange={e => { setRolF(e.target.value); setPage(1); }} style={{ flex: "1 1 160px" }}>
            <option value="">Todos los roles</option>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </Card>

      {loading ? <PageSpinner /> : usuarios.length === 0 ? (
        <EmptyState icon="👥" title="No se encontraron usuarios" />
      ) : (
        <Card>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Sede</th><th>Último Acceso</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td className="mono">{u.username}</td>
                    <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{u.email}</td>
                    <td>
                      <span className={`badge ${u.rol === "Administrador" ? "badge-blue" : "badge-green"}`}>{u.rol}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{u.departamento}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{fmtFechaHora(u.ultimoAcceso) || "Nunca"}</td>
                    <td>
                      <span className={`badge ${u.activo ? "badge-green" : "badge-red"}`}>{u.activo ? "Activo" : "Inactivo"}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn variant="outline" size="sm" onClick={() => setEditando(u)}>Editar</Btn>
                        {u.activo && <Btn variant="danger" size="sm" onClick={() => eliminar(u.id, u.nombre)}>Desactivar</Btn>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={pagination.total} limit={20} onPage={setPage} />
        </Card>
      )}

      <Modal open={modNuevo} onClose={() => setModNuevo(false)} title="Nuevo Usuario" width={600}>
        <FormUsuario onClose={() => setModNuevo(false)} onGuardado={cargar} setToast={setToast} />
      </Modal>

      <Modal open={!!editando} onClose={() => setEditando(null)} title="Editar Usuario" width={600}>
        {editando && <FormUsuario inicial={editando} onClose={() => setEditando(null)} onGuardado={cargar} setToast={setToast} />}
      </Modal>
    </div>
  );
}
