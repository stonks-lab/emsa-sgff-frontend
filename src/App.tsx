import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ROUTER_BASENAME } from './config/base'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { canAccess, roleHome } from './auth/roles'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import SaldoContratos from './pages/SaldoContratos'
import Licitaciones from './pages/Licitaciones'
import Solpes from './pages/Solpes'
import Alertas from './pages/Alertas'
import Proyecciones from './pages/Proyecciones'
import AnalisisProyecto from './pages/AnalisisProyecto'
import SourcingPlan from './pages/SourcingPlan'
import CargaDatos from './pages/CargaDatos'
import EstadoProyectos from './pages/EstadoProyectos'
import MetrosPerforados from './pages/MetrosPerforados'
import PresupuestoPerforacion from './pages/PresupuestoPerforacion'
import Modificaciones from './pages/Modificaciones'
import DashboardDPO from './pages/DashboardDPO'
import SolpeTiempos from './pages/SolpeTiempos'
import Simulacion from './pages/Simulacion'
import EstadosPago from './pages/EstadosPago'
import KpiContratos from './pages/KpiContratos'
import ModelosSondajes from './pages/ModelosSondajes'
import ModelosCampamento from './pages/ModelosCampamento'
import ModelosMT from './pages/ModelosMT'
import Usuarios from './pages/Usuarios'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

function RoleIndex() {
  const { user } = useAuth()
  const home = roleHome(user!.role)
  if (home !== '/') return <Navigate to={home} replace />
  return <Home />
}

function GuardedRoute({ path, element }: { path: string; element: React.ReactNode }) {
  const { user } = useAuth()
  if (!user || !canAccess(user.role, path)) return <Navigate to="/" replace />
  return <>{element}</>
}

function AppRoutes() {
  const { user } = useAuth()
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<RoleIndex />} />
        <Route path="saldo"         element={<GuardedRoute path="/saldo"         element={<SaldoContratos />} />} />
        <Route path="estados-pago"  element={<GuardedRoute path="/estados-pago"  element={<EstadosPago />} />} />
        <Route path="proyecciones"  element={<GuardedRoute path="/proyecciones"  element={<Proyecciones />} />} />
        <Route path="analisis"      element={<GuardedRoute path="/analisis"      element={<AnalisisProyecto />} />} />
        <Route path="sourcing"      element={<GuardedRoute path="/sourcing"      element={<SourcingPlan />} />} />
        <Route path="simulacion"    element={<GuardedRoute path="/simulacion"    element={<Simulacion />} />} />
        <Route path="alertas"       element={<GuardedRoute path="/alertas"       element={<Alertas />} />} />
        <Route path="licitaciones"  element={<GuardedRoute path="/licitaciones"  element={<Licitaciones />} />} />
        <Route path="solpes"        element={<GuardedRoute path="/solpes"        element={<Solpes />} />} />
        <Route path="dashboard-dab" element={<GuardedRoute path="/dashboard-dab" element={<SolpeTiempos />} />} />
        <Route path="kpi-contratos" element={<GuardedRoute path="/kpi-contratos" element={<KpiContratos />} />} />
        <Route path="modificaciones"element={<GuardedRoute path="/modificaciones"element={<Modificaciones />} />} />
        <Route path="dashboard-dpo" element={<GuardedRoute path="/dashboard-dpo" element={<DashboardDPO />} />} />
        <Route path="estado-proyectos"         element={<GuardedRoute path="/estado-proyectos"         element={<EstadoProyectos />} />} />
        <Route path="metros"                   element={<GuardedRoute path="/metros"                   element={<MetrosPerforados />} />} />
        <Route path="presupuesto-perforacion"  element={<GuardedRoute path="/presupuesto-perforacion"  element={<PresupuestoPerforacion />} />} />
        <Route path="modelos/sondajes"         element={<GuardedRoute path="/modelos/sondajes"         element={<ModelosSondajes />} />} />
        <Route path="modelos/campamento"       element={<GuardedRoute path="/modelos/campamento"       element={<ModelosCampamento />} />} />
        <Route path="modelos/mt"               element={<GuardedRoute path="/modelos/mt"               element={<ModelosMT />} />} />
        <Route path="carga"                    element={<GuardedRoute path="/carga"                    element={<CargaDatos />} />} />
        <Route path="usuarios"                 element={<GuardedRoute path="/usuarios"                 element={<Usuarios />} />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
