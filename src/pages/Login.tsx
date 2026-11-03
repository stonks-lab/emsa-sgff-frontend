import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login }  = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--navy-900, #0f172a)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '40px 44px', width: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,.35)',
      }}>
        {/* Logo + título */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo-emsa-dark.svg" alt="EMSA" style={{ height: 36, marginBottom: 16 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy-900, #0f172a)' }}>
            Tablero DAB-DPO
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-500, #6b7280)', marginTop: 4 }}>
            Ingresa con tus credenciales
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700, #374151)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Usuario
            </label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              autoComplete="username" required
              style={{
                padding: '9px 12px', border: '1px solid var(--gray-200, #e5e7eb)',
                borderRadius: 7, fontSize: 14, fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700, #374151)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Contraseña
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password" required
              style={{
                padding: '9px 12px', border: '1px solid var(--gray-200, #e5e7eb)',
                borderRadius: 7, fontSize: 14, fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--error-50, #fef2f2)', border: '1px solid var(--error-200, #fecaca)',
              borderRadius: 7, padding: '8px 12px', fontSize: 13, color: 'var(--error-700, #b91c1c)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              marginTop: 4, padding: '10px 0', background: 'var(--navy-700, #1e3a5f)',
              color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
