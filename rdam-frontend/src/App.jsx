import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import PortalCiudadano from "./pages/portal/PortalCiudadano.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import Sidebar from "./components/Sidebar.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import ExpedientesPage from "./pages/expedientes/ExpedientesPage.jsx";
import DetalleExpedientePage from "./pages/expedientes/DetalleExpedientePage.jsx";
import PagosPage from "./pages/pagos/PagosPage.jsx";
import UsuariosPage from "./pages/usuarios/UsuariosPage.jsx";
import AuditoriaPage from "./pages/auditoria/AuditoriaPage.jsx";
import "./index.css";

// ── Inner App (has auth context available) ────────────────────
function InnerApp() {
  const { user, loading, isAuthenticated } = useAuth();
  const [pantalla, setPantalla] = useState("portal"); // "portal" | "login" | "sistema"
  const [vista, setVista] = useState("dashboard");
  const [expedienteDetalleId, setExpedienteDetalleId] = useState(null);

  // While checking auth (loading), show minimal spinner
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Iniciando sesión...</p>
        </div>
      </div>
    );
  }

  // If user just authenticated via context, force "sistema"
  if (isAuthenticated && pantalla !== "sistema") {
    setPantalla("sistema");
  }

  // ── Portal público ──────────────────────────────────────────
  if (pantalla === "portal") {
    return <PortalCiudadano onLoginInterno={() => setPantalla("login")} />;
  }

  // ── Login ───────────────────────────────────────────────────
  if (pantalla === "login") {
    if (isAuthenticated) {
      // Login successful via context
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

  // ── Sistema interno ─────────────────────────────────────────
  if (!isAuthenticated) {
    setPantalla("portal");
    return null;
  }

  const handleVerDetalle = (id) => {
    setExpedienteDetalleId(id);
    setVista("expediente-detalle");
  };

  const handleVolverLista = () => {
    setExpedienteDetalleId(null);
    setVista("expedientes");
  };

  const handleVista = (v) => {
    setExpedienteDetalleId(null);
    setVista(v);
  };

  return (
    <div className="app-layout">
      <Sidebar vista={vista} onVista={handleVista} />
      <main className="main-content">
        {vista === "dashboard" && (
          <DashboardPage usuario={user} />
        )}
        {vista === "expedientes" && (
          <ExpedientesPage onVerDetalle={handleVerDetalle} />
        )}
        {vista === "expediente-detalle" && expedienteDetalleId && (
          <DetalleExpedientePage expedienteId={expedienteDetalleId} onBack={handleVolverLista} />
        )}
        {vista === "pagos" && <PagosPage />}
        {vista === "usuarios" && user?.rol === "Administrador" && <UsuariosPage />}
        {vista === "auditoria" && user?.rol === "Administrador" && <AuditoriaPage />}
      </main>
    </div>
  );
}

// ── Root App with Provider ────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}
