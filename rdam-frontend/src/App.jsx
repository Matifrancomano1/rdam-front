import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { tienePermiso } from "./components/Sidebar.jsx";
import PortalCiudadano from "./pages/portal/PortalCiudadano.jsx";
import PagarPage from "./pages/portal/PagarPage.jsx";
import ConfirmacionPagoPage from "./pages/portal/ConfirmacionPagoPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import Sidebar from "./components/Sidebar.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import ExpedientesPage from "./pages/expedientes/ExpedientesPage.jsx";
import DetalleExpedientePage from "./pages/expedientes/DetalleExpedientePage.jsx";
import PagosPage from "./pages/pagos/PagosPage.jsx";
import UsuariosPage from "./pages/usuarios/UsuariosPage.jsx";
import AuditoriaPage from "./pages/auditoria/AuditoriaPage.jsx";
import "./index.css";

/* ── Detectar retorno de pasarela de pago ───────────────────
   PlusPagos devuelve al return_url con query params:
   ?estado=aprobado|rechazado|pendiente&pagoId=...&expedienteId=...&monto=...&referencia=...
   También acepta: ?pago_estado=... (variación de la pasarela)
*/
function detectRetornoPasarela() {
  const params = new URLSearchParams(window.location.search);
  // Intentar diferentes convenciones de nombre de parámetro
  const estado = params.get("estado") || params.get("pago_estado") || params.get("status") || params.get("result");
  if (!estado) return null;

  // Normalizar estado
  const estadoNorm = estado.toLowerCase();
  let estadoFinal = "pendiente";
  if (["aprobado", "approved", "success", "ok"].includes(estadoNorm)) estadoFinal = "aprobado";
  else if (["rechazado", "rejected", "failed", "error"].includes(estadoNorm)) estadoFinal = "rechazado";

  return {
    estado: estadoFinal,
    pagoId: params.get("pagoId") || params.get("pago_id") || params.get("payment_id"),
    expedienteId: params.get("expedienteId") || params.get("expediente_id"),
    monto: params.get("monto") || params.get("amount"),
    referencia: params.get("referencia") || params.get("merchant_order_id") || params.get("ref"),
    numeroExpediente: params.get("numeroExpediente") || params.get("numero"),
  };
}

/* ── Pantalla de acceso denegado ─────────────────────────── */
const Denegado = ({ onVolver }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", gap: 16 }}>
    <div style={{ fontSize: 56 }}>🔒</div>
    <h2 style={{ fontSize: 22, fontWeight: 800 }}>Acceso restringido</h2>
    <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 320 }}>
      No tenés permisos para acceder a esta sección.
    </p>
    <button className="btn btn-outline" onClick={onVolver}>← Volver al Dashboard</button>
  </div>
);

/* ── App interna ─────────────────────────────────────────── */
function InnerApp() {
  const { user, loading, isAuthenticated } = useAuth();

  // Pantallas posibles:
  // "portal" | "pagar" | "confirmacion" | "login" | "sistema"
  const [pantalla, setPantalla] = useState(() => {
    // Detectar retorno de pasarela ANTES de setear pantalla inicial
    const retorno = detectRetornoPasarela();
    if (retorno) return "confirmacion";
    return "portal";
  });

  const [expedientePagar, setExpedientePagar] = useState(null);
  const [paymentParams, setPaymentParams] = useState(() => detectRetornoPasarela());

  const [vista, setVista] = useState("dashboard");
  const [expedienteDetalleId, setExpedienteDetalleId] = useState(null);

  // Si ya tiene sesión activa al cargar, ir al sistema
  useEffect(() => {
    if (!loading && isAuthenticated && pantalla === "portal") {
      setPantalla("sistema");
    }
  }, [loading, isAuthenticated]);

  // Limpiar query params de la URL después de detectarlos (sin recargar la página)
  useEffect(() => {
    if (paymentParams) {
      const clean = window.location.pathname;
      window.history.replaceState({}, document.title, clean);
    }
  }, [paymentParams]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3.5, margin: "0 auto 14px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  /* ── Retorno de pasarela de pago ── */
  if (pantalla === "confirmacion") {
    return (
      <ConfirmacionPagoPage
        params={paymentParams || {}}
        onVolver={() => {
          setPaymentParams(null);
          setExpedientePagar(null);
          setPantalla("portal");
        }}
      />
    );
  }

  /* ── Resumen previo al pago ── */
  if (pantalla === "pagar" && expedientePagar) {
    return (
      <PagarPage
        expediente={expedientePagar}
        onVolver={() => setPantalla("portal")}
      />
    );
  }

  /* ── Portal público ── */
  if (pantalla === "portal") {
    return (
      <PortalCiudadano
        onLoginInterno={() => setPantalla("login")}
        onPagar={(exp) => {
          setExpedientePagar(exp);
          setPantalla("pagar");
        }}
      />
    );
  }

  /* ── Login ── */
  if (pantalla === "login") {
    if (isAuthenticated) {
      setPantalla("sistema");
      return null;
    }
    return (
      <LoginPage
        onBack={() => setPantalla("portal")}
        onSuccess={() => setPantalla("sistema")}
      />
    );
  }

  /* ── Sistema interno ── */
  if (!isAuthenticated) {
    setPantalla("portal");
    return null;
  }

  const rol = user?.rol || "Operador";

  const handleVerDetalle = (id) => {
    setExpedienteDetalleId(id);
    setVista("expediente-detalle");
  };

  const handleVista = (v) => {
    setExpedienteDetalleId(null);
    setVista(v);
  };

  const renderVista = () => {
    if (vista === "expediente-detalle" && expedienteDetalleId) {
      if (!tienePermiso(rol, "expedientes")) return <Denegado onVolver={() => handleVista("dashboard")} />;
      return (
        <DetalleExpedientePage
          expedienteId={expedienteDetalleId}
          onBack={() => { setExpedienteDetalleId(null); setVista("expedientes"); }}
        />
      );
    }

    if (!tienePermiso(rol, vista)) {
      return <Denegado onVolver={() => handleVista("dashboard")} />;
    }

    switch (vista) {
      case "dashboard":   return <DashboardPage usuario={user} />;
      case "expedientes": return <ExpedientesPage onVerDetalle={handleVerDetalle} />;
      case "pagos":       return <PagosPage />;
      case "usuarios":    return <UsuariosPage />;
      case "auditoria":   return <AuditoriaPage />;
      default:            return <DashboardPage usuario={user} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar vista={vista} onVista={handleVista} />
      <main className="main-content">{renderVista()}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}
