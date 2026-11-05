import { useEffect, useState } from 'react'
import axios from 'axios'
import PageHeader from '../components/PageHeader'
import { ROLE_LABELS } from '../auth/roles'
import { api } from '../api/client'

type UserRow = { username: string; name: string; role: string }

const ROLES = Object.entries(ROLE_LABELS).filter(([k]) => k !== 'admin')

const ROLE_COLOR: Record<string, { bg: string; color: string }> = {
  admin:                  { bg: '#eef2ff', color: '#4338ca' },
  dab:                    { bg: '#eff6ff', color: '#1d4ed8' },
  dpo:                    { bg: '#f0fdf4', color: '#15803d' },
  estrategico:            { bg: '#fefce8', color: '#a16207' },
  excelencia_operacional: { bg: '#fff7ed', color: '#c2410c' },
  evaluador:              { bg: '#fdf4ff', color: '#7e22ce' },
  pyc:                    { bg: '#f0f9ff', color: '#0369a1' },
  admin_contrato:         { bg: '#fff1f2', color: '#be123c' },
}

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_COLOR[role] ?? { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.color}22`,
      borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
    }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

const EMPTY_FORM = { username: '', name: '', role: 'dab', password: '', password2: '' }

export default function Usuarios() {
  const [users,   setUsers]   = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [modal,   setModal]   = useState<'create' | 'edit' | 'pwd' | null>(null)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [form,    setForm]    = useState({ ...EMPTY_FORM })
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setLoadError('')
    api.get('/auth/users')
      .then(r => setUsers(r.data))
      .catch(e => {
        const detail = axios.isAxiosError(e) ? e.response?.data?.detail : undefined
        const status = axios.isAxiosError(e) ? e.response?.status : undefined
        setUsers([])
        setLoadError(detail ?? `No se pudo cargar la lista de usuarios${status ? ` (error ${status})` : ''}`)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null); setForm({ ...EMPTY_FORM }); setError(''); setModal('create')
  }

  const openEdit = (u: UserRow) => {
    setEditing(u); setForm({ ...EMPTY_FORM, username: u.username, name: u.name, role: u.role }); setError(''); setModal('edit')
  }

  const openPwd = (u: UserRow) => {
    setEditing(u); setForm({ ...EMPTY_FORM }); setError(''); setModal('pwd')
  }

  const closeModal = () => { setModal(null); setEditing(null); setError('') }

  const handleSave = async () => {
    setError('')
    if (modal === 'create') {
      if (!form.username.trim() || !form.name.trim() || !form.password) { setError('Completa todos los campos'); return }
      if (form.password !== form.password2) { setError('Las contraseñas no coinciden'); return }
      setSaving(true)
      try {
        await api.post('/auth/users', { username: form.username.trim(), name: form.name.trim(), role: form.role, password: form.password })
        load(); closeModal()
      } catch (e: any) {
        setError(e.response?.data?.detail ?? 'Error al crear usuario')
      } finally { setSaving(false) }
    } else if (modal === 'edit') {
      if (!form.name.trim()) { setError('El nombre no puede estar vacío'); return }
      setSaving(true)
      try {
        await api.put(`/auth/users/${editing!.username}`, { name: form.name.trim(), role: form.role })
        load(); closeModal()
      } catch (e: any) {
        setError(e.response?.data?.detail ?? 'Error al actualizar')
      } finally { setSaving(false) }
    } else if (modal === 'pwd') {
      if (!form.password) { setError('Ingresa la nueva contraseña'); return }
      if (form.password !== form.password2) { setError('Las contraseñas no coinciden'); return }
      setSaving(true)
      try {
        await api.put(`/auth/users/${editing!.username}`, { password: form.password })
        load(); closeModal()
      } catch (e: any) {
        setError(e.response?.data?.detail ?? 'Error al cambiar contraseña')
      } finally { setSaving(false) }
    }
  }

  const handleDelete = async (username: string) => {
    if (!confirm(`¿Eliminar el usuario "${username}"?`)) return
    setDeleting(username)
    try {
      await api.delete(`/auth/users/${username}`)
      load()
    } finally { setDeleting(null) }
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const INPUT = {
    padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: 7,
    fontSize: 14, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
    outline: 'none',
  }
  const LABEL = {
    fontSize: 11, fontWeight: 700 as const, color: 'var(--gray-600)',
    textTransform: 'uppercase' as const, letterSpacing: '.5px', marginBottom: 5, display: 'block' as const,
  }

  return (
    <>
      <PageHeader title="Usuarios" subtitle="Gestión de acceso a la plataforma" icon="👥" />

      <div className="page">
        <div className="panel" style={{ maxWidth: 860 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {loading ? 'Cargando…' : loadError ? 'Sin datos' : `${users.length} usuario${users.length !== 1 ? 's' : ''}`}
            </div>
            <button
              onClick={openCreate}
              style={{
                background: 'var(--navy-700)', color: '#fff', border: 'none',
                borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Nuevo usuario
            </button>
          </div>

          {loadError && (
            <div role="alert" style={{ background: 'var(--error-50, #fef2f2)', border: '1px solid var(--error-200, #fecaca)', color: 'var(--error-700, #b91c1c)', borderRadius: 7, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {loadError}
            </div>
          )}

          {/* Tabla */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-100)' }}>
                {['Usuario', 'Nombre', 'Rol', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.username} style={{ borderBottom: '1px solid var(--gray-50)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--navy-700)', fontFamily: 'monospace', fontSize: 12 }}>{u.username}</td>
                  <td style={{ padding: '10px 12px' }}>{u.name}</td>
                  <td style={{ padding: '10px 12px' }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(u)}
                        style={{ padding: '4px 10px', fontSize: 12, border: '1px solid var(--gray-200)', borderRadius: 5, cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>
                        Editar
                      </button>
                      <button onClick={() => openPwd(u)}
                        style={{ padding: '4px 10px', fontSize: 12, border: '1px solid var(--gray-200)', borderRadius: 5, cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>
                        Contraseña
                      </button>
                      <button onClick={() => handleDelete(u.username)} disabled={deleting === u.username}
                        style={{ padding: '4px 10px', fontSize: 12, border: '1px solid var(--error-200, #fecaca)', borderRadius: 5, cursor: 'pointer', background: 'var(--error-50, #fef2f2)', color: 'var(--error-700, #b91c1c)', fontFamily: 'inherit' }}>
                        {deleting === u.username ? '…' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 17, fontWeight: 700, color: 'var(--navy-800)' }}>
              {modal === 'create' ? 'Nuevo usuario' : modal === 'edit' ? 'Editar usuario' : 'Cambiar contraseña'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {modal === 'create' && (
                <div>
                  <label style={LABEL}>Usuario</label>
                  <input style={INPUT} value={form.username} onChange={e => set('username', e.target.value)}
                    placeholder="ej: juan.perez" autoFocus />
                </div>
              )}

              {modal !== 'pwd' && (
                <>
                  <div>
                    <label style={LABEL}>Nombre completo</label>
                    <input style={INPUT} value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="ej: Juan Pérez" autoFocus={modal === 'edit'} />
                  </div>
                  <div>
                    <label style={LABEL}>Rol</label>
                    <select style={{ ...INPUT, appearance: 'auto' }} value={form.role} onChange={e => set('role', e.target.value)}>
                      <option value="admin">Administrador</option>
                      {ROLES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                    </select>
                  </div>
                </>
              )}

              {(modal === 'create' || modal === 'pwd') && (
                <>
                  <div>
                    <label style={LABEL}>{modal === 'pwd' ? 'Nueva contraseña' : 'Contraseña'}</label>
                    <input style={INPUT} type="password" value={form.password} onChange={e => set('password', e.target.value)}
                      autoFocus={modal === 'pwd'} />
                  </div>
                  <div>
                    <label style={LABEL}>Confirmar contraseña</label>
                    <input style={INPUT} type="password" value={form.password2} onChange={e => set('password2', e.target.value)} />
                  </div>
                </>
              )}

              {error && (
                <div style={{ background: 'var(--error-50, #fef2f2)', border: '1px solid var(--error-200, #fecaca)', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: 'var(--error-700, #b91c1c)' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={closeModal}
                  style={{ padding: '9px 18px', border: '1px solid var(--gray-200)', borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: '9px 18px', background: 'var(--navy-700)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1, fontFamily: 'inherit' }}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
