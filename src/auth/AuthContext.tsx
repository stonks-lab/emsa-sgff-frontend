import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE } from '../config/base'

export type User = { username: string; name: string; role: string }

type AuthCtx = {
  user:    User | null
  login:   (username: string, password: string) => Promise<void>
  logout:  () => void
}

const AuthContext = createContext<AuthCtx>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const r = await axios.post(`${API_BASE}/auth/login`, { username, password })
    localStorage.setItem('token', r.data.token)
    setUser(r.data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--navy-900, #0f172a)' }}>
      <div style={{ color: '#fff', fontSize: 14 }}>Cargando…</div>
    </div>
  )

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
