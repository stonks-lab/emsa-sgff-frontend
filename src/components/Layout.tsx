import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect, Component } from 'react'
import { useAuth } from '../auth/AuthContext'
import { canAccess, ROLE_LABELS } from '../auth/roles'
import { api } from '../api/client'

import type { ReactElement, ReactNode, ErrorInfo } from 'react'

class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[RouteErrorBoundary]', error, info) }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <div style={{ padding: 24 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '16px 20px', color: '#b91c1c' }}>
            <strong style={{ display: 'block', marginBottom: 6 }}>Error en esta página</strong>
            <code style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{err.message}</code>
            <br />
            <button onClick={() => this.setState({ error: null })} style={{ marginTop: 12, padding: '6px 14px', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              Reintentar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

type Section = { section: string }
type Item    = { to: string; label: string; icon: ReactElement }
type Entry   = Section | Item

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
)
const IconWallet = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
  </svg>
)
const IconTrend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
  </svg>
)
const IconMicroscope = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h.01"/><path d="M9 6l.5 6"/><path d="M13 6l-.5 6"/>
  </svg>
)
const IconMap = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
)
const IconWarning = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconDrill = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
)
const IconList = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const IconUpload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconMonday = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
)
const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
  </svg>
)
const IconCpu = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
)
const IconTarget = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IconTent = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 21L12 3l8.5 18"/><path d="M12 3L7 21"/><path d="M12 3l5 18"/>
  </svg>
)
const IconMountain = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3l4 8 5-5 5 15H2L8 3z"/>
  </svg>
)
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconBarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const IconReceipt = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/>
    <line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/>
    <line x1="8" y1="16" x2="12" y2="16"/>
  </svg>
)

const NAV: Entry[] = [
  { section: 'Home' },
  { to: '/',             label: 'Resumen Ejecutivo',  icon: <IconGrid /> },
  { section: 'Estrategia' },
  { to: '/saldo',        label: 'Saldo Contratos',    icon: <IconWallet /> },
  { to: '/estados-pago', label: 'Estados de Pago',   icon: <IconReceipt /> },
  { to: '/proyecciones', label: 'Proyecciones',        icon: <IconTrend /> },
  { to: '/analisis',     label: 'Por Proyecto',       icon: <IconMicroscope /> },
  { to: '/sourcing',     label: 'Sourcing Plan',      icon: <IconMap /> },
  { to: '/simulacion',   label: 'Simulación',         icon: <IconSettings /> },
  { section: 'Operatividad' },
  { to: '/estado-proyectos', label: 'Estado Proyectos',  icon: <IconWarning /> },
  { to: '/metros',                    label: 'Metros Perforados',      icon: <IconDrill /> },
  { to: '/presupuesto-perforacion',  label: 'Presupuesto Perforación', icon: <IconDrill /> },
  { section: 'Modelos Productivos' },
  { to: '/modelos/sondajes',         label: 'Sondajes',                icon: <IconTarget /> },
  { to: '/modelos/campamento',       label: 'Campamento',              icon: <IconTent /> },
  { to: '/modelos/mt',               label: 'Mov. de Tierra',          icon: <IconMountain /> },
  { section: 'DAB' },
  { to: '/alertas',                  label: 'Alertas',                 icon: <IconBell /> },
  { to: '/licitaciones',   label: 'Licitaciones',    icon: <IconList /> },
  { to: '/solpes',         label: 'SOLPEs',          icon: <IconList /> },
  { to: '/dashboard-dab',  label: 'Dashboard DAB',   icon: <IconClock /> },
  { to: '/kpi-contratos',  label: 'KPI Contratos',   icon: <IconBarChart /> },
  { to: '/modificaciones', label: 'Modificaciones',  icon: <IconMonday /> },
  { section: 'DPO' },
  { to: '/dashboard-dpo',  label: 'Dashboard DPO',   icon: <IconDashboard /> },
  { section: 'Administración' },
  { to: '/carga',          label: 'Carga de Datos',  icon: <IconUpload /> },
  { to: '/usuarios',       label: 'Usuarios',        icon: <IconUsers /> },
]

// Agrupa el NAV en secciones: [{ section, items }]
function buildSections() {
  const sections: { section: string; items: Item[] }[] = []
  let current: { section: string; items: Item[] } | null = null
  for (const entry of NAV) {
    if ('section' in entry) {
      current = { section: entry.section, items: [] }
      sections.push(current)
    } else if (current) {
      current.items.push(entry as Item)
    }
  }
  return sections
}

const SECTIONS = buildSections()

function activeSection(pathname: string): string {
  for (const s of SECTIONS) {
    if (s.items.some(it => it.to === '/' ? pathname === '/' : pathname.startsWith(it.to))) {
      return s.section
    }
  }
  return ''
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current,  setCurrent]  = useState('')
  const [next,     setNext]     = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)

  const INPUT = {
    padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: 7,
    fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const, outline: 'none',
  }
  const LABEL = {
    fontSize: 11, fontWeight: 700 as const, color: 'var(--gray-600)',
    textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: 5, display: 'block' as const,
  }

  const handleSave = async () => {
    setError('')
    if (!current || !next) { setError('Completa todos los campos'); return }
    if (next.length < 6)   { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (next !== confirm)  { setError('Las contraseñas no coinciden'); return }
    setSaving(true)
    try {
      await api.put('/auth/password', { current_password: current, new_password: next })
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Error al cambiar la contraseña')
    } finally { setSaving(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', width: 380, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
        <h3 style={{ margin: '0 0 24px', fontSize: 17, fontWeight: 700, color: 'var(--navy-800)' }}>
          Cambiar contraseña
        </h3>
        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--navy-700)', fontWeight: 600 }}>
            ✓ Contraseña actualizada
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={LABEL}>Contraseña actual</label>
              <input style={INPUT} type="password" value={current} onChange={e => setCurrent(e.target.value)} autoFocus />
            </div>
            <div>
              <label style={LABEL}>Nueva contraseña</label>
              <input style={INPUT} type="password" value={next} onChange={e => setNext(e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Confirmar nueva contraseña</label>
              <input style={INPUT} type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }} />
            </div>
            {error && (
              <div style={{ background: 'var(--error-50, #fef2f2)', border: '1px solid var(--error-200, #fecaca)', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: 'var(--error-700, #b91c1c)' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={onClose}
                style={{ padding: '9px 18px', border: '1px solid var(--gray-200)', borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '9px 18px', background: 'var(--navy-700)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, fontFamily: 'inherit' }}>
                {saving ? 'Guardando…' : 'Cambiar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [showPwd, setShowPwd] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const active = activeSection(location.pathname)
    return Object.fromEntries(SECTIONS.map(s => [s.section, s.section === active]))
  })

  // Abre automáticamente la sección activa al navegar
  useEffect(() => {
    const active = activeSection(location.pathname)
    if (active) setOpen(prev => ({ ...prev, [active]: true }))
  }, [location.pathname])

  const toggle = (section: string) =>
    setOpen(prev => ({ ...prev, [section]: !prev[section] }))

  return (
    <div className="app">
      {/* Topbar */}
      <header className="topbar">
        <img src="/logo-emsa-light.svg" className="topbar-logo" alt="EMSA" />
        <div className="topbar-divider" />
        <div>
          <div className="topbar-title">Tablero DAB-DPO</div>
          <div className="topbar-subtitle">Contratos &amp; Proyectos · EMSA</div>
        </div>
        <div style={{ flex: 1 }} />
        <span className="topbar-badge">DAB-DPO</span>
        <div className="topbar-status">
          <span className="topbar-dot" />
          En línea
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
            <button
              onClick={() => setShowPwd(true)}
              title="Cambiar contraseña"
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', lineHeight: 1.3, padding: '2px 4px' }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy-100, #dbeafe)' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--navy-300, #93c5fd)' }}>{ROLE_LABELS[user.role] ?? user.role}</div>
            </button>
            <button
              onClick={logout}
              title="Cerrar sesión"
              style={{
                background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
                borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#fff',
                fontSize: 12, fontFamily: 'inherit',
              }}
            >
              Salir
            </button>
          </div>
        )}
        {showPwd && <ChangePasswordModal onClose={() => setShowPwd(false)} />}
      </header>

      {/* Body */}
      <div className="app-body">
        {/* Sidebar */}
        <nav className="sidebar">
          {SECTIONS.map(({ section, items }) => {
            const visibleItems = items.filter(it => !user || canAccess(user.role, it.to))
            if (!visibleItems.length) return null
            return (
              <div key={section}>
                <button
                  onClick={() => toggle(section)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '6px 12px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                  className="sidebar-label"
                >
                  <span>{section}</span>
                  <svg
                    width="10" height="10" viewBox="0 0 10 10" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                    style={{
                      transition: 'transform 0.2s',
                      transform: open[section] ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="2 3 5 7 8 3" />
                  </svg>
                </button>

                {open[section] && visibleItems.map(({ to, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    {icon}
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        {/* Content */}
        <main className="main-content">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  )
}
