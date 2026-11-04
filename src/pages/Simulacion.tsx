import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import PageHeader from '../components/PageHeader'
import {
  getSimulacionLista, getSimulacionProyectos,
  getSimulacionVendorCodes, getSimulacionContratos,
  getSimulacion, guardarSimulacion, eliminarSimulacion,
} from '../api/client'

// ── tipos ─────────────────────────────────────────────────────────────────────

interface SimItem {
  id: number; nombre: string; usuario: string
  fecha_guardado: string; num_lineas: number
}
interface ProyectoOpt { codigo: string; nombre: string; id_blanco: string }

/** Una fila en la tabla = dupla (proyecto, alcance) */
interface DuplaRow {
  proyecto: string
  alcance: string
  contratos_pyc: string[]
  tipos_contrato: string[]
  saldo_pyc: number
  moneda: string
  total_proyectado: number
  periodo_inicio: string
  periodo_fin: string
  periodos: { periodo: string; monto: number }[]
}

interface SicContrato {
  codigo_ctt: string; Descripcion_ctt: string; Tipo_contrato: string
  Saldo_CLP: number; Estado_ctt: string; tipo_servicio?: string
}
interface Solpe {
  Código: string; Nombre: string; Monto: number
  Moneda: string; Estado_SOLPE: string; Grupo_Estado: string
}
interface Asignacion {
  contrato_asignado: string
  tipo_asignacion: 'SIC' | 'SOLPE'
  saldo_inicial: number
  moneda: string
  display: string
}
interface LineaGuardada {
  proyecto: string
  alcance: string
  contrato_asignado: string
  tipo_asignacion: string
  saldo_inicial: number
  moneda: string
}

// ── helpers ───────────────────────────────────────────────────────────────────

const COLORS = ['#1e3a5f', '#c4a84f', '#2a9d8f', '#e76f51', '#457b9d', '#6a4c93', '#2d6a4f']

const MESES  = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const fmtPeriodo = (p: string) => {
  const [y, m] = p.split('-')
  return `${MESES[parseInt(m)] ?? m} ${y?.slice(2)}`
}

const fmtMoney = (n: number, moneda = 'CLP') => {
  const abs = Math.abs(n), sign = n < 0 ? '-' : ''
  if (moneda === 'CLP') {
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}k`
    return `${sign}$${Math.round(abs)}`
  }
  return `${sign}${abs.toFixed(0)} ${moneda}`
}

const encodeOpt = (tipo: string, codigo: string, saldo: number, moneda: string, display: string) =>
  `${tipo}||${codigo}||${saldo}||${moneda}||${display}`

const decodeOpt = (v: string): Asignacion | null => {
  const parts = v.split('||')
  if (parts.length < 5) return null
  return {
    tipo_asignacion:   parts[0] as 'SIC' | 'SOLPE',
    contrato_asignado: parts[1],
    saldo_inicial:     parseFloat(parts[2]) || 0,
    moneda:            parts[3],
    display:           parts.slice(4).join('||'),
  }
}

/** Clave única por dupla */
const duplaKey = (proyecto: string, alcance: string) => `${proyecto}::${alcance}`

// ── ContractSelect ────────────────────────────────────────────────────────────

type ContractSource = 'sic' | 'solpe'

function ContractSelect({ sic, solpes, value, onChange }: {
  sic: SicContrato[]; solpes: Solpe[]; value: string; onChange: (v: string) => void
}) {
  const [open,   setOpen]  = useState(false)
  const [q,      setQ]     = useState('')
  const [source, setSource] = useState<ContractSource>('sic')
  const ref      = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const decoded  = value ? decodeOpt(value) : null

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const ql    = q.toLowerCase()
  const fSic  = sic.filter(c =>
    !ql || c.codigo_ctt.toLowerCase().includes(ql) || (c.Descripcion_ctt ?? '').toLowerCase().includes(ql))
  const fSolpe = solpes.filter(s =>
    !ql || s['Código'].toLowerCase().includes(ql) || (s.Nombre ?? '').toLowerCase().includes(ql))

  const label = decoded ? `${decoded.contrato_asignado} — ${decoded.display.slice(0, 38)}` : ''
  const select = (v: string) => { onChange(v); setQ(''); setOpen(false) }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '4px 0', fontSize: 11, fontWeight: active ? 700 : 400,
    border: 'none', borderRadius: 3, cursor: 'pointer',
    background: active ? 'var(--navy-500)' : '#f3f4f6',
    color: active ? '#fff' : 'var(--color-text-muted)',
  })

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 260 }}>
      {/* Trigger */}
      <div onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          border: '1px solid var(--color-border)', borderRadius: 4,
          background: '#fff', padding: '3px 8px', cursor: 'text', minHeight: 28,
        }}>
        <input ref={inputRef} value={open ? q : ''} onChange={e => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={label || '— Sin asignar —'}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, background: 'transparent', minWidth: 0 }} />
        {decoded && (
          <span style={{ cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 15, lineHeight: 1, flexShrink: 0 }}
            onMouseDown={e => { e.stopPropagation(); select('') }}>×</span>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0,
          minWidth: '100%', width: 'max-content', maxWidth: 500, zIndex: 300,
          background: '#fff', border: '1px solid var(--color-border)',
          borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,.12)',
        }}>
          {/* Selector de fuente */}
          <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--color-border)' }}>
            <button type="button" style={btnStyle(source === 'sic')}
              onMouseDown={e => { e.preventDefault(); setSource('sic'); setQ('') }}>
              SIC ({sic.length})
            </button>
            <button type="button" style={btnStyle(source === 'solpe')}
              onMouseDown={e => { e.preventDefault(); setSource('solpe'); setQ('') }}>
              Licitaciones ({solpes.length})
            </button>
          </div>

          {/* Lista */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            <div onMouseDown={e => { e.preventDefault(); select('') }}
              style={{ padding: '5px 10px', fontSize: 12, color: 'var(--color-text-muted)', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
              — Sin asignar —
            </div>

            {source === 'sic' && (
              fSic.length === 0
                ? <div style={{ padding: '12px 10px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin resultados</div>
                : fSic.map(c => {
                    const v = encodeOpt('SIC', c.codigo_ctt, c.Saldo_CLP ?? 0, 'CLP', c.Descripcion_ctt ?? c.codigo_ctt)
                    return (
                      <div key={c.codigo_ctt} onMouseDown={e => { e.preventDefault(); select(v) }}
                        style={{ padding: '6px 10px', fontSize: 12, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'baseline',
                          background: value === v ? '#f0f4ff' : 'transparent' }}>
                        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--navy-500)' }}>{c.codigo_ctt}</span>
                        <span style={{ color: '#374151', flex: 1 }}>{(c.Descripcion_ctt ?? '').slice(0, 50)}</span>
                        <span style={{ whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(c.Saldo_CLP ?? 0)}</span>
                      </div>
                    )
                  })
            )}

            {source === 'solpe' && (
              fSolpe.length === 0
                ? <div style={{ padding: '12px 10px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin resultados</div>
                : fSolpe.map(s => {
                    const v = encodeOpt('SOLPE', s['Código'], s.Monto ?? 0, s.Moneda ?? 'CLP', s.Nombre ?? s['Código'])
                    return (
                      <div key={s['Código']} onMouseDown={e => { e.preventDefault(); select(v) }}
                        style={{ padding: '6px 10px', fontSize: 12, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'baseline',
                          background: value === v ? '#f0f4ff' : 'transparent' }}>
                        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--navy-500)' }}>{s['Código']}</span>
                        <span style={{ color: '#374151', flex: 1 }}>{(s.Nombre ?? '').slice(0, 50)}</span>
                        <span style={{ whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(s.Monto ?? 0, s.Moneda)}</span>
                      </div>
                    )
                  })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── InlineContractSelect ──────────────────────────────────────────────────────

function InlineContractSelect({ sic, solpes, value, onChange }: {
  sic: SicContrato[]; solpes: Solpe[]; value: string; onChange: (v: string) => void
}) {
  const [q,       setQ]      = useState('')
  const [source,  setSource] = useState<ContractSource>('sic')
  const [sortAsc, setSortAsc] = useState(false)

  const ql    = q.toLowerCase()
  const fSic  = useMemo(() => {
    const filtered = sic.filter(c =>
      !ql || c.codigo_ctt.toLowerCase().includes(ql) || (c.Descripcion_ctt ?? '').toLowerCase().includes(ql))
    return [...filtered].sort((a, b) => sortAsc
      ? (a.Saldo_CLP ?? 0) - (b.Saldo_CLP ?? 0)
      : (b.Saldo_CLP ?? 0) - (a.Saldo_CLP ?? 0))
  }, [sic, ql, sortAsc])
  const fSolpe = useMemo(() => {
    const filtered = solpes.filter(s =>
      !ql || s['Código'].toLowerCase().includes(ql) || (s.Nombre ?? '').toLowerCase().includes(ql))
    return [...filtered].sort((a, b) => sortAsc
      ? (a.Monto ?? 0) - (b.Monto ?? 0)
      : (b.Monto ?? 0) - (a.Monto ?? 0))
  }, [solpes, ql, sortAsc])

  const select = (v: string) => { onChange(v); setQ('') }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px', fontSize: 11, fontWeight: active ? 700 : 400,
    border: 'none', borderRadius: 3, cursor: 'pointer',
    background: active ? 'var(--navy-500)' : '#e5e7eb',
    color: active ? '#fff' : 'var(--color-text-muted)',
  })

  return (
    <div style={{ padding: '10px 14px', background: '#f8fafc', borderTop: '2px solid var(--navy-500)' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" style={btnStyle(source === 'sic')}
            onClick={() => { setSource('sic'); setQ('') }}>
            SIC ({sic.length})
          </button>
          <button type="button" style={btnStyle(source === 'solpe')}
            onClick={() => { setSource('solpe'); setQ('') }}>
            Licitaciones ({solpes.length})
          </button>
        </div>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          autoFocus
          placeholder="Buscar por código o descripción…"
          style={{
            flex: 1, border: '1px solid var(--color-border)', borderRadius: 4,
            padding: '4px 10px', fontSize: 12, outline: 'none', background: '#fff',
          }}
        />
        <button type="button" onClick={() => setSortAsc(v => !v)}
          title={sortAsc ? 'Saldo: menor primero' : 'Saldo: mayor primero'}
          style={{
            padding: '4px 10px', fontSize: 11, borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap',
            border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-text-muted)',
          }}>
          Saldo {sortAsc ? '↑' : '↓'}
        </button>
        {value && (
          <button type="button" onClick={() => select('')}
            style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ✕ Quitar
          </button>
        )}
      </div>

      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 4, background: '#fff' }}>
        {source === 'sic' && (
          fSic.length === 0
            ? <div style={{ padding: '12px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin resultados</div>
            : fSic.map(c => {
                const v = encodeOpt('SIC', c.codigo_ctt, c.Saldo_CLP ?? 0, 'CLP', c.Descripcion_ctt ?? c.codigo_ctt)
                return (
                  <div key={c.codigo_ctt} onClick={() => select(v)}
                    style={{
                      padding: '7px 12px', fontSize: 12, cursor: 'pointer',
                      display: 'flex', gap: 10, alignItems: 'baseline',
                      background: value === v ? '#e8f0fe' : 'transparent',
                      borderBottom: '1px solid #f3f4f6',
                    }}>
                    <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--navy-500)', minWidth: 90 }}>{c.codigo_ctt}</span>
                    <span style={{ color: '#374151', flex: 1 }}>{c.Descripcion_ctt ?? ''}</span>
                    <span style={{ whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(c.Saldo_CLP ?? 0)}</span>
                  </div>
                )
              })
        )}
        {source === 'solpe' && (
          fSolpe.length === 0
            ? <div style={{ padding: '12px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>Sin resultados</div>
            : fSolpe.map(s => {
                const v = encodeOpt('SOLPE', s['Código'], s.Monto ?? 0, s.Moneda ?? 'CLP', s.Nombre ?? s['Código'])
                return (
                  <div key={s['Código']} onClick={() => select(v)}
                    style={{
                      padding: '7px 12px', fontSize: 12, cursor: 'pointer',
                      display: 'flex', gap: 10, alignItems: 'baseline',
                      background: value === v ? '#e8f0fe' : 'transparent',
                      borderBottom: '1px solid #f3f4f6',
                    }}>
                    <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--navy-500)', minWidth: 90 }}>{s['Código']}</span>
                    <span style={{ color: '#374151', flex: 1 }}>{s.Nombre ?? ''}</span>
                    <span style={{ whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(s.Monto ?? 0, s.Moneda)}</span>
                  </div>
                )
              })
        )}
      </div>
    </div>
  )
}

// ── MultiSelectSearch ─────────────────────────────────────────────────────────

interface MSOption { value: string; label: string; sublabel?: string }
interface SearchMode { key: 'value' | 'label'; label: string; placeholder: string }

function MultiSelectSearch({ options, value, onChange, placeholder = 'Buscar…', searchModes }: {
  options: MSOption[]; value: string[]; onChange: (v: string[]) => void
  placeholder?: string; searchModes?: SearchMode[]
}) {
  const [open, setOpen]       = useState(false)
  const [q, setQ]             = useState('')
  const [modeIdx, setModeIdx] = useState(0)
  const ref                   = useRef<HTMLDivElement>(null)
  const inputRef              = useRef<HTMLInputElement>(null)
  const activeMode            = searchModes?.[modeIdx]

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = useMemo(() => {
    const ql = q.toLowerCase()
    if (!ql) return options
    if (activeMode?.key === 'value') return options.filter(o => o.value.toLowerCase().includes(ql))
    if (activeMode?.key === 'label') return options.filter(o => o.label.toLowerCase().includes(ql))
    return options.filter(o =>
      o.label.toLowerCase().includes(ql) ||
      o.sublabel?.toLowerCase().includes(ql) ||
      o.value.toLowerCase().includes(ql))
  }, [options, q, activeMode])

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {searchModes && (
        <div style={{ display: 'flex', gap: 2, marginBottom: 5 }}>
          {searchModes.map((m, i) => (
            <button key={m.key} type="button"
              onMouseDown={e => { e.preventDefault(); setModeIdx(i); setQ('') }}
              style={{
                padding: '2px 10px', fontSize: 11, borderRadius: 3, cursor: 'pointer',
                border: '1px solid var(--color-border)',
                background: modeIdx === i ? 'var(--navy-500)' : '#fff',
                color:      modeIdx === i ? '#fff' : 'var(--color-text-muted)',
                fontWeight: modeIdx === i ? 600 : 400,
              }}
            >{m.label}</button>
          ))}
        </div>
      )}
      <div
        style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4,
          border: '1px solid var(--color-border)', borderRadius: 4,
          background: '#fff', padding: '4px 8px', cursor: 'text', minHeight: 36,
        }}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        {value.map(v => {
          const opt = options.find(o => o.value === v)
          return (
            <span key={v} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '1px 8px', background: 'var(--navy-500)', color: '#fff',
              borderRadius: 99, fontSize: 11, lineHeight: '18px', whiteSpace: 'nowrap',
            }}>
              {opt?.label || v}
              <span style={{ cursor: 'pointer', marginLeft: 2, opacity: 0.75, fontSize: 14, lineHeight: 1 }}
                onMouseDown={e => { e.stopPropagation(); toggle(v) }}>×</span>
            </span>
          )
        })}
        <input
          ref={inputRef}
          style={{ flex: '1 1 80px', border: 'none', outline: 'none', fontSize: 13, padding: '2px 0', minWidth: 60, background: 'transparent' }}
          placeholder={value.length === 0 ? (activeMode?.placeholder ?? placeholder) : ''}
          value={q} onChange={e => setQ(e.target.value)} onFocus={() => setOpen(true)}
        />
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
          style={{ flexShrink: 0, color: 'var(--color-text-muted)' }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, zIndex: 200,
          background: '#fff', border: '1px solid var(--color-border)', borderRadius: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,.12)', maxHeight: 260, overflowY: 'auto',
        }}>
          {filtered.length === 0
            ? <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>Sin resultados</div>
            : filtered.map(o => (
                <label key={o.value} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '7px 12px', cursor: 'pointer', fontSize: 13,
                  background: value.includes(o.value) ? '#f0f4ff' : 'transparent',
                }}
                  onMouseDown={e => { e.preventDefault(); toggle(o.value) }}
                >
                  <input type="checkbox" checked={value.includes(o.value)} onChange={() => {}} style={{ marginTop: 2 }} />
                  <div style={{ fontWeight: value.includes(o.value) ? 600 : 400 }}>
                    {activeMode?.key === 'value' ? o.value
                      : activeMode?.key === 'label' ? o.label
                      : <>{o.label}{o.sublabel && <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 6 }}>{o.sublabel}</span>}</>
                    }
                  </div>
                </label>
              ))
          }
        </div>
      )}
    </div>
  )
}

// ── Excel export ──────────────────────────────────────────────────────────────

function exportarExcel(
  nombre: string,
  proyeccion: ReturnType<typeof calcProyeccion>,
  allPeriods: string[],
) {
  const wb = XLSX.utils.book_new()

  // Hoja 1: resumen por contrato
  const resumen = proyeccion.map(c => ({
    'Contrato':      c.codigo,
    'Descripción':   c.display,
    'Moneda':        c.moneda,
    'Saldo Inicial': c.saldo_inicial,
    'Gasto Total':   c.timeline.reduce((s, t) => s + t.gasto, 0),
    'Saldo Final':   c.timeline.at(-1)?.saldo ?? c.saldo_inicial,
    'Alerta':        c.timeline.find(t => t.saldo <= 0) ? 'AGOTAMIENTO' : '',
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen')

  // Hoja 2: timeline mensual (pivot)
  const pivot = allPeriods.map(p => {
    const row: Record<string, any> = { Período: fmtPeriodo(p) }
    proyeccion.forEach(c => {
      const pt = c.timeline.find(t => t.periodo === p)
      row[`${c.codigo} Gasto`] = pt?.gasto ?? 0
      row[`${c.codigo} Saldo`] = pt?.saldo ?? ''
    })
    return row
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pivot), 'Timeline')

  XLSX.writeFile(wb, `simulacion_${nombre || 'sin_nombre'}.xlsx`)
}

// ── cálculo de proyección ─────────────────────────────────────────────────────

interface ReemplazoConfig { enabled: boolean; desde: string; hasta: string }
type ReemplazosMap = Record<string, ReemplazoConfig>

/** true si el período p debe ir al nuevo contrato */
const goesToNew = (cfg: ReemplazoConfig | undefined, periodo: string) =>
  !!(cfg?.enabled) &&
  (!cfg.desde || periodo >= cfg.desde) &&
  (!cfg.hasta || periodo <= cfg.hasta)

function calcProyeccion(
  duplas: DuplaRow[],
  asignaciones: Record<string, Asignacion>,
  reemplazos: ReemplazosMap,
) {
  const byC: Record<string, {
    saldo_inicial: number; moneda: string; display: string
    gasto: Record<string, number>; isPyc: boolean
  }> = {}

  duplas.forEach(d => {
    const dKey = duplaKey(d.proyecto, d.alcance)
    const asig = asignaciones[dKey]
    const cfg  = reemplazos[dKey]

    // ── línea P&C ─────────────────────────────────────────
    if (d.saldo_pyc > 0) {
      const pycKey   = `pyc::${dKey}`
      const pycLabel = d.alcance || d.contratos_pyc[0] || 'P&C'
      if (!byC[pycKey]) byC[pycKey] = {
        saldo_inicial: d.saldo_pyc, moneda: 'CLP',
        display: `${pycLabel} (P&C)`, gasto: {}, isPyc: true,
      }
      d.periodos.forEach(p => {
        const toNew = goesToNew(cfg, p.periodo)
        byC[pycKey].gasto[p.periodo] =
          (byC[pycKey].gasto[p.periodo] ?? 0) + (toNew ? 0 : p.monto)
      })
    }

    // ── línea nuevo contrato asignado ──────────────────────
    if (asig && cfg?.enabled) {
      const ckey = asig.contrato_asignado
      if (!byC[ckey]) byC[ckey] = {
        saldo_inicial: asig.saldo_inicial, moneda: asig.moneda,
        display: asig.display, gasto: {}, isPyc: false,
      }
      // Incluir todos los períodos: 0 fuera del rango → línea plana antes/después
      d.periodos.forEach(p => {
        byC[ckey].gasto[p.periodo] =
          (byC[ckey].gasto[p.periodo] ?? 0) + (goesToNew(cfg, p.periodo) ? p.monto : 0)
      })
    }
  })

  return Object.entries(byC).map(([codigo, data]) => {
    const periodos = Object.keys(data.gasto).sort()
    let saldo = data.saldo_inicial
    return {
      codigo, display: data.display, moneda: data.moneda,
      saldo_inicial: data.saldo_inicial, isPyc: data.isPyc,
      timeline: periodos.map(p => {
        saldo -= data.gasto[p]
        return { periodo: p, gasto: data.gasto[p], saldo }
      }),
    }
  })
}

// ── detalle por alcance ───────────────────────────────────────────────────────

interface DetalleItem {
  codigo: string; display: string; isPyc: boolean
  saldo_inicial: number; moneda: string
  timeline: { periodo: string; gasto: number; saldo: number }[]
}
interface DetalleGrupo { key: string; alcance: string; items: DetalleItem[] }

function calcDetalle(
  duplas: DuplaRow[],
  asignaciones: Record<string, Asignacion>,
  reemplazos: ReemplazosMap,
): DetalleGrupo[] {
  return duplas.map(d => {
    const dKey = duplaKey(d.proyecto, d.alcance)
    const asig = asignaciones[dKey]
    const cfg  = reemplazos[dKey]
    const items: DetalleItem[] = []

    if (d.saldo_pyc > 0) {
      let saldo = d.saldo_pyc
      items.push({
        codigo:        d.contratos_pyc.join(', '),
        display:       `Contratos P&C actuales (${d.contratos_pyc.join(', ')})`,
        isPyc:         true,
        saldo_inicial: d.saldo_pyc,
        moneda:        'CLP',
        timeline:      d.periodos.map(p => {
          const gasto = goesToNew(cfg, p.periodo) ? 0 : p.monto
          saldo -= gasto
          return { periodo: p.periodo, gasto, saldo }
        }),
      })
    }

    if (asig && cfg?.enabled) {
      let saldo = asig.saldo_inicial
      items.push({
        codigo:        asig.contrato_asignado,
        display:       asig.display,
        isPyc:         false,
        saldo_inicial: asig.saldo_inicial,
        moneda:        asig.moneda,
        timeline:      d.periodos.map(p => {
          const gasto = goesToNew(cfg, p.periodo) ? p.monto : 0
          saldo -= gasto
          return { periodo: p.periodo, gasto, saldo }
        }),
      })
    }

    return { key: dKey, alcance: d.alcance || '(sin alcance)', items }
  }).filter(g => g.items.length > 0)
}

// ── componente principal ──────────────────────────────────────────────────────

export default function Simulacion() {
  const [view, setView]           = useState<'lista' | 'workspace'>('lista')

  // lista
  const [simsList,   setSimsList]   = useState<SimItem[]>([])
  const [delConfirm, setDelConfirm] = useState<number | null>(null)

  // workspace meta
  const [simId,    setSimId]    = useState<number | null>(null)
  const [nombre,   setNombre]   = useState('')
  const [usuario,  setUsuario]  = useState(() => localStorage.getItem('carga_responsable') ?? '')
  const [saving,   setSaving]   = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  // workspace datos
  const [proyectosList,     setProyectosList]     = useState<ProyectoOpt[]>([])
  const [hasNombres,        setHasNombres]         = useState(false)
  const [selectedProyectos, setSelectedProyectos] = useState<string[]>([])
  const [duplas,            setDuplas]             = useState<DuplaRow[]>([])
  const [contratos,         setContratos]         = useState<{ sic: SicContrato[]; solpes: Solpe[] }>({ sic: [], solpes: [] })
  const [asignaciones,      setAsignaciones]      = useState<Record<string, Asignacion>>({})
  const [loadingDuplas,     setLoadingDuplas]     = useState(false)
  const [pendingLineas,     setPendingLineas]      = useState<LineaGuardada[] | null>(null)
  const [expandedKeys,      setExpandedKeys]      = useState<Set<string>>(new Set())
  const [reemplazos,        setReemplazos]        = useState<ReemplazosMap>({})
  const [detalleAbiertos,   setDetalleAbiertos]   = useState<Set<string>>(new Set())
  const [sortCol,           setSortCol]           = useState<string | null>(null)
  const [sortDir,           setSortDir]           = useState<'asc' | 'desc'>('asc')

  const tableWrapRef  = useRef<HTMLDivElement>(null)
  const topScrollRef  = useRef<HTMLDivElement>(null)
  const phantomRef    = useRef<HTMLDivElement>(null)

  // Sincroniza la barra de scroll superior con el wrapper de la tabla
  useEffect(() => {
    const wrap    = tableWrapRef.current
    const top     = topScrollRef.current
    const phantom = phantomRef.current
    if (!wrap || !top || !phantom) return

    const updatePhantom = () => { phantom.style.width = wrap.scrollWidth + 'px' }
    updatePhantom()

    const fromWrap = () => { top.scrollLeft = wrap.scrollLeft }
    const fromTop  = () => { wrap.scrollLeft = top.scrollLeft }

    wrap.addEventListener('scroll', fromWrap)
    top.addEventListener('scroll', fromTop)
    const ro = new ResizeObserver(updatePhantom)
    ro.observe(wrap)
    return () => {
      wrap.removeEventListener('scroll', fromWrap)
      top.removeEventListener('scroll', fromTop)
      ro.disconnect()
    }
  }, [duplas])

  // carga inicial
  useEffect(() => {
    getSimulacionLista().then(setSimsList).catch(() => {})
    getSimulacionProyectos().then(r => { setProyectosList(r.proyectos); setHasNombres(r.has_nombres) }).catch(() => {})
    getSimulacionContratos().then(setContratos).catch(() => {})
  }, [])

  // carga duplas al cambiar proyectos
  useEffect(() => {
    if (selectedProyectos.length === 0) { setDuplas([]); return }
    setLoadingDuplas(true)
    getSimulacionVendorCodes(selectedProyectos)
      .then(setDuplas)
      .catch(() => setDuplas([]))
      .finally(() => setLoadingDuplas(false))
  }, [selectedProyectos])

  // aplica lineas guardadas cuando se cargan duplas
  useEffect(() => {
    if (!pendingLineas || duplas.length === 0) return
    const asig: Record<string, Asignacion> = {}
    pendingLineas.forEach(l => {
      const sic  = contratos.sic.find(c => c.codigo_ctt === l.contrato_asignado)
      const solp = contratos.solpes.find(s => s['Código'] === l.contrato_asignado)
      const key  = duplaKey(l.proyecto, l.alcance)
      asig[key] = {
        contrato_asignado: l.contrato_asignado,
        tipo_asignacion:   l.tipo_asignacion as 'SIC' | 'SOLPE',
        saldo_inicial:     Number(l.saldo_inicial) || 0,
        moneda:            l.moneda || 'CLP',
        display:           sic?.Descripcion_ctt ?? solp?.Nombre ?? l.contrato_asignado,
      }
    })
    setAsignaciones(asig)
    setPendingLineas(null)
  }, [duplas, pendingLineas, contratos])

  // proyección calculada
  const proyeccion = useMemo(
    () => calcProyeccion(duplas, asignaciones, reemplazos),
    [duplas, asignaciones, reemplazos],
  )

  const detalleGrupos = useMemo(
    () => calcDetalle(duplas, asignaciones, reemplazos),
    [duplas, asignaciones, reemplazos],
  )

  const allPeriods = useMemo(() =>
    [...new Set(proyeccion.flatMap(c => c.timeline.map(t => t.periodo)))].sort(),
  [proyeccion])

  const chartData = useMemo(() =>
    allPeriods.map(p => {
      const row: Record<string, any> = { periodo: p, label: fmtPeriodo(p) }
      proyeccion.forEach(c => {
        const pt = c.timeline.find(t => t.periodo === p)
        if (pt) row[c.codigo] = pt.saldo
      })
      return row
    }),
  [allPeriods, proyeccion])

  const sortedDuplas = useMemo(() => {
    if (!sortCol) return duplas
    const dir = sortDir === 'asc' ? 1 : -1
    return [...duplas].sort((a, b) => {
      const aAsig = asignaciones[duplaKey(a.proyecto, a.alcance)]
      const bAsig = asignaciones[duplaKey(b.proyecto, b.alcance)]
      let av: string | number = 0
      let bv: string | number = 0
      switch (sortCol) {
        case 'proyecto':         av = a.proyecto;                              bv = b.proyecto;                              break
        case 'alcance':          av = a.alcance;                               bv = b.alcance;                               break
        case 'contratos_pyc':    av = a.contratos_pyc.join(', ');              bv = b.contratos_pyc.join(', ');              break
        case 'periodo':          av = a.periodo_inicio;                        bv = b.periodo_inicio;                        break
        case 'total_proyectado': av = a.total_proyectado;                      bv = b.total_proyectado;                      break
        case 'saldo_ini_pyc':    av = a.saldo_pyc;                             bv = b.saldo_pyc;                             break
        case 'saldo_fin_pyc':    av = a.saldo_pyc - a.total_proyectado;        bv = b.saldo_pyc - b.total_proyectado;        break
        case 'contrato_asig':    av = aAsig?.contrato_asignado ?? '';          bv = bAsig?.contrato_asignado ?? '';          break
        case 'saldo_inicial':    av = aAsig?.saldo_inicial ?? 0;               bv = bAsig?.saldo_inicial ?? 0;               break
        case 'saldo_final':      av = aAsig ? aAsig.saldo_inicial - a.total_proyectado : 0;
                                 bv = bAsig ? bAsig.saldo_inicial - b.total_proyectado : 0;                                  break
      }
      if (typeof av === 'string') return dir * av.localeCompare(bv as string)
      return dir * (av - (bv as number))
    })
  }, [duplas, asignaciones, sortCol, sortDir])

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }
  const sortInd = (col: string) =>
    sortCol === col
      ? <span style={{ marginLeft: 4, fontSize: 9 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
      : <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.25 }}>↕</span>
  const thS = (col: string, align?: 'right' | 'center', extra?: React.CSSProperties): React.CSSProperties => ({
    cursor: 'pointer', userSelect: 'none', textAlign: align,
    background: sortCol === col ? '#f0f4ff' : undefined, ...extra,
  })

  // opciones de proyectos para el selector
  const proyectosOpts = useMemo<MSOption[]>(() =>
    proyectosList.map(p => ({
      value:    p.codigo,
      label:    p.nombre || p.codigo,
      sublabel: p.nombre && p.nombre !== p.codigo ? p.codigo : undefined,
    })),
  [proyectosList])

  const multiProyecto = selectedProyectos.length > 1

  // ── handlers ─────────────────────────────────────────────────────────────────

  const handleNueva = () => {
    setSimId(null); setNombre(''); setSelectedProyectos([])
    setDuplas([]); setAsignaciones([]); setView('workspace')
  }

  const handleAbrir = async (sim: SimItem) => {
    const data = await getSimulacion(sim.id)
    setSimId(sim.id); setNombre(sim.nombre); setUsuario(sim.usuario ?? '')
    setAsignaciones({})
    if (data.lineas?.length > 0) {
      const uniqueProys = [...new Set<string>(data.lineas.map((l: LineaGuardada) => l.proyecto))]
      setSelectedProyectos(uniqueProys)
      setPendingLineas(data.lineas)
    }
    setView('workspace')
  }

  const handleEliminar = async (id: number) => {
    await eliminarSimulacion(id)
    setSimsList(prev => prev.filter(s => s.id !== id))
    setDelConfirm(null)
  }

  const handleAssign = (d: DuplaRow, val: string) => {
    const key = duplaKey(d.proyecto, d.alcance)
    if (!val) {
      setAsignaciones(prev => { const n = { ...prev }; delete n[key]; return n })
      return
    }
    const decoded = decodeOpt(val)
    if (decoded) setAsignaciones(prev => ({ ...prev, [key]: decoded }))
  }

  const handleGuardar = async () => {
    if (!nombre.trim()) { alert('Ingresa un nombre para la simulación'); return }
    const lineas = duplas
      .filter(d => asignaciones[duplaKey(d.proyecto, d.alcance)])
      .map(d => {
        const a = asignaciones[duplaKey(d.proyecto, d.alcance)]
        return {
          proyecto: d.proyecto, alcance: d.alcance,
          contrato_asignado: a.contrato_asignado,
          tipo_asignacion: a.tipo_asignacion,
          saldo_inicial: a.saldo_inicial, moneda: a.moneda,
        }
      })
    if (lineas.length === 0) { alert('Asigna al menos un contrato antes de guardar'); return }
    setSaving(true)
    try {
      const result = await guardarSimulacion({ nombre, usuario, lineas, sim_id: simId ?? undefined })
      setSimId(result.id)
      getSimulacionLista().then(setSimsList)
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleVolver = () => {
    getSimulacionLista().then(setSimsList)
    setView('lista')
  }

  // ── render lista ─────────────────────────────────────────────────────────────
  if (view === 'lista') return (
    <>
      <PageHeader title="Simulación What-If" />
      <div className="page">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="panel-title" style={{ marginBottom: 0 }}>Simulaciones guardadas</div>
            <button className="btn" onClick={handleNueva}>+ Nueva simulación</button>
          </div>
          {simsList.length === 0
            ? <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                No hay simulaciones guardadas. Crea una nueva.
              </p>
            : <table className="data-table">
                <thead><tr>
                  <th>Nombre</th><th>Usuario</th><th>Guardado</th>
                  <th style={{ textAlign: 'right' }}>Duplas</th><th></th>
                </tr></thead>
                <tbody>
                  {simsList.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                      <td>{s.usuario || '—'}</td>
                      <td style={{ fontSize: 12 }}>{s.fecha_guardado}</td>
                      <td style={{ textAlign: 'right' }}>{s.num_lineas}</td>
                      <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={() => handleAbrir(s)}>Abrir</button>
                        {delConfirm === s.id
                          ? <>
                              <button className="btn" style={{ background: '#dc2626', color: '#fff', fontSize: 12 }}
                                onClick={() => handleEliminar(s.id)}>Confirmar</button>
                              <button className="btn btn-ghost" onClick={() => setDelConfirm(null)}>Cancelar</button>
                            </>
                          : <button className="btn btn-ghost" style={{ color: '#dc2626' }}
                              onClick={() => setDelConfirm(s.id)}>Eliminar</button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>
      </div>
    </>
  )

  // ── render workspace ──────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader title="Simulación What-If" />
      <div className="page">

        {/* Barra superior */}
        <div className="panel" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={handleVolver}>← Volver</button>
          <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              style={{ flex: '2 1 200px', fontSize: 13, padding: '5px 8px', border: '1px solid var(--color-border)', borderRadius: 4 }}
              placeholder="Nombre de la simulación…"
              value={nombre} onChange={e => setNombre(e.target.value)}
            />
            <input
              style={{ flex: '1 1 140px', fontSize: 13, padding: '5px 8px', border: '1px solid var(--color-border)', borderRadius: 4 }}
              placeholder="Usuario"
              value={usuario} onChange={e => setUsuario(e.target.value)}
            />
          </div>
          {proyeccion.length > 0 && (
            <button className="btn btn-ghost"
              onClick={() => exportarExcel(nombre, proyeccion, allPeriods)}>
              ↓ Excel
            </button>
          )}
          <button className="btn" onClick={handleGuardar} disabled={saving}>
            {saving ? 'Guardando…' : simId ? 'Guardar cambios' : 'Guardar simulación'}
          </button>
          {savedMsg && <span style={{ fontSize: 12, color: 'var(--color-navy)', fontWeight: 600 }}>✓ Guardado</span>}
        </div>

        {/* Selector de proyectos */}
        <div className="panel">
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Proyectos
          </div>
          <MultiSelectSearch
            options={proyectosOpts}
            value={selectedProyectos}
            onChange={v => { setSelectedProyectos(v); setAsignaciones({}) }}
            searchModes={[
              { key: 'label',  label: 'Nombre',    placeholder: 'Buscar por nombre de proyecto…' },
              { key: 'value',  label: 'ID Blanco',  placeholder: 'Buscar por ID Blanco…' },
              ...(hasNombres ? [] : []),
            ]}
          />
          {selectedProyectos.length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
              {loadingDuplas ? 'Cargando proyecciones P&C…' : `${duplas.length} duplas proyecto·alcance encontradas`}
            </p>
          )}
        </div>

        {/* Tabla de asignaciones por dupla */}
        {selectedProyectos.length > 0 && !loadingDuplas && (
          <div className="panel">
            <div className="panel-title" style={{ marginBottom: 10 }}>
              Asignación de contratos por dupla Proyecto · Alcance
            </div>
            {duplas.length === 0
              ? <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin proyecciones P&C para los proyectos seleccionados.</p>
              : <>
                  <div ref={tableWrapRef} style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr>
                      {multiProyecto && <th style={thS('proyecto')} onClick={() => handleSort('proyecto')}>Proyecto{sortInd('proyecto')}</th>}
                      <th style={thS('alcance')} onClick={() => handleSort('alcance')}>Alcance de servicio{sortInd('alcance')}</th>
                      <th style={thS('contratos_pyc')} onClick={() => handleSort('contratos_pyc')}>Contratos P&amp;C{sortInd('contratos_pyc')}</th>
                      <th style={thS('periodo')} onClick={() => handleSort('periodo')}>Período{sortInd('periodo')}</th>
                      <th style={thS('total_proyectado', 'right')} onClick={() => handleSort('total_proyectado')}>Total proyectado (CLP){sortInd('total_proyectado')}</th>
                      <th style={thS('saldo_ini_pyc', 'right')} onClick={() => handleSort('saldo_ini_pyc')}>Saldo ini P&amp;C{sortInd('saldo_ini_pyc')}</th>
                      <th style={thS('saldo_fin_pyc', 'right')} onClick={() => handleSort('saldo_fin_pyc')}>Saldo fin P&amp;C{sortInd('saldo_fin_pyc')}</th>
                      <th style={thS('contrato_asig')} onClick={() => handleSort('contrato_asig')}>Contrato asignado{sortInd('contrato_asig')}</th>
                      <th style={thS('saldo_inicial', 'right')} onClick={() => handleSort('saldo_inicial')}>Saldo inicial{sortInd('saldo_inicial')}</th>
                      <th style={thS('saldo_final', 'right')} onClick={() => handleSort('saldo_final')}>Saldo final{sortInd('saldo_final')}</th>
                      <th style={{ textAlign: 'center' }}>Reemplazar</th>
                      <th style={{ width: 32 }}></th>
                    </tr></thead>
                    <tbody>
                      {sortedDuplas.map(d => {
                        const key      = duplaKey(d.proyecto, d.alcance)
                        const asig     = asignaciones[key]
                        const optVal   = asig
                          ? encodeOpt(asig.tipo_asignacion, asig.contrato_asignado, asig.saldo_inicial, asig.moneda, asig.display)
                          : ''
                        const isOpen        = expandedKeys.has(key)
                        const colCount      = (multiProyecto ? 1 : 0) + 11
                        const saldoFinPyc   = d.saldo_pyc - d.total_proyectado
                        const saldoFinal    = asig && asig.moneda === 'CLP'
                          ? asig.saldo_inicial - d.total_proyectado
                          : null
                        const tipos    = new Set(d.tipos_contrato ?? [])
                        const sicOpts  = tipos.size > 0
                          ? contratos.sic.filter(c => c.Tipo_contrato && tipos.has(c.Tipo_contrato))
                          : contratos.sic

                        const toggleRow = () =>
                          setExpandedKeys(prev => {
                            const next = new Set(prev)
                            if (next.has(key)) next.delete(key); else next.add(key)
                            return next
                          })

                        return (
                          <>
                            <tr key={key} style={{ cursor: 'pointer' }} onClick={toggleRow}>
                              {multiProyecto && (
                                <td style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                  {d.proyecto}
                                </td>
                              )}
                              <td style={{ fontWeight: d.alcance ? 600 : 400, color: d.alcance ? 'inherit' : 'var(--color-text-muted)' }}>
                                {d.alcance || '(sin alcance)'}
                              </td>
                              <td style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                {d.contratos_pyc.join(', ')}
                              </td>
                              <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                                {d.periodo_inicio && d.periodo_fin
                                  ? `${fmtPeriodo(d.periodo_inicio)} → ${fmtPeriodo(d.periodo_fin)}`
                                  : '—'}
                              </td>
                              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                                {fmtMoney(d.total_proyectado)}
                              </td>
                              <td style={{ textAlign: 'right', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                                {d.saldo_pyc > 0 ? fmtMoney(d.saldo_pyc) : '—'}
                              </td>
                              <td style={{
                                textAlign: 'right', fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                                background: d.saldo_pyc > 0 && saldoFinPyc < 0 ? '#fef2f2' : undefined,
                                color:      d.saldo_pyc > 0 && saldoFinPyc < 0 ? '#dc2626'  : undefined,
                              }}>
                                {d.saldo_pyc > 0
                                  ? <>{saldoFinPyc < 0 && <span style={{ marginRight: 4 }}>⚠</span>}{fmtMoney(saldoFinPyc)}</>
                                  : '—'}
                              </td>
                              <td style={{ fontSize: 12 }}>
                                {asig
                                  ? <span style={{ color: 'var(--navy-500)', fontWeight: 600 }}>{asig.contrato_asignado}</span>
                                  : <span style={{ color: 'var(--color-text-muted)' }}>— Sin asignar —</span>}
                              </td>
                              <td style={{ textAlign: 'right', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                                {asig ? fmtMoney(asig.saldo_inicial, asig.moneda) : '—'}
                              </td>
                              <td style={{
                                textAlign: 'right', fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                                background: saldoFinal !== null && saldoFinal < 0 ? '#fef2f2' : undefined,
                                color:      saldoFinal !== null && saldoFinal < 0 ? '#dc2626' : undefined,
                              }}>
                                {saldoFinal !== null
                                  ? <>{saldoFinal < 0 && <span style={{ marginRight: 4 }}>⚠</span>}{fmtMoney(saldoFinal)}</>
                                  : '—'}
                              </td>
                              <td style={{ verticalAlign: 'middle' }} onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <input
                                    type="checkbox"
                                    disabled={!asig}
                                    checked={reemplazos[key]?.enabled ?? false}
                                    onChange={e => setReemplazos(prev => ({
                                      ...prev,
                                      [key]: { enabled: e.target.checked, desde: prev[key]?.desde ?? '', hasta: prev[key]?.hasta ?? '' }
                                    }))}
                                    title={asig ? 'Activar reemplazo' : 'Asigna un contrato primero'}
                                    style={{ cursor: asig ? 'pointer' : 'not-allowed', width: 14, height: 14, flexShrink: 0 }}
                                  />
                                  {reemplazos[key]?.enabled && (() => {
                                    const cfg = reemplazos[key]
                                    const selStyle: React.CSSProperties = {
                                      fontSize: 11, border: '1px solid var(--color-border)',
                                      borderRadius: 3, padding: '2px 4px', maxWidth: 80,
                                    }
                                    const update = (patch: Partial<ReemplazoConfig>) =>
                                      setReemplazos(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
                                    return (
                                      <>
                                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Desde</span>
                                        <select value={cfg.desde} onChange={e => update({ desde: e.target.value })} style={selStyle}>
                                          <option value="">Inicio</option>
                                          {d.periodos.map(p => (
                                            <option key={p.periodo} value={p.periodo}>{fmtPeriodo(p.periodo)}</option>
                                          ))}
                                        </select>
                                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Hasta</span>
                                        <select value={cfg.hasta} onChange={e => update({ hasta: e.target.value })} style={selStyle}>
                                          <option value="">Fin</option>
                                          {d.periodos.map(p => (
                                            <option key={p.periodo} value={p.periodo}>{fmtPeriodo(p.periodo)}</option>
                                          ))}
                                        </select>
                                      </>
                                    )
                                  })()}
                                </div>
                              </td>
                              <td style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 11, userSelect: 'none' }}>
                                {isOpen ? '▲' : '▼'}
                              </td>
                            </tr>
                            {isOpen && (
                              <tr key={key + '-expand'}>
                                <td colSpan={colCount} style={{ padding: 0, border: 'none' }}>
                                  <InlineContractSelect
                                    sic={sicOpts}
                                    solpes={contratos.solpes}
                                    value={optVal}
                                    onChange={v => {
                                      handleAssign(d, v)
                                      setExpandedKeys(prev => { const n = new Set(prev); n.delete(key); return n })
                                    }}
                                  />
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })}
                    </tbody>
                  </table>
                  </div>
                  {/* Barra de scroll espejo — sticky en la parte inferior */}
                  <div ref={topScrollRef} style={{
                    overflowX: 'auto', overflowY: 'hidden', height: 14,
                    position: 'sticky', bottom: 0, zIndex: 10,
                    background: '#fff', marginTop: 2,
                  }}>
                    <div ref={phantomRef} style={{ height: 1 }} />
                  </div>
                </>
            }
          </div>
        )}

        {/* Proyección */}
        {proyeccion.length > 0 && (
          <>
            {/* Gráfico */}
            <div className="panel">
              <div className="panel-title">Proyección de saldos por contrato</div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                Evolución mensual del saldo — la línea roja marca el agotamiento
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 40, left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtMoney(v, proyeccion[0]?.moneda)} width={72} />
                  <Tooltip
                    formatter={(v: number, name: string) => {
                      const c = proyeccion.find(p => p.codigo === name)
                      return [fmtMoney(v, c?.moneda), c?.display || name]
                    }}
                    labelFormatter={l => `Período: ${l}`}
                  />
                  <Legend formatter={value => proyeccion.find(p => p.codigo === value)?.display || value}
                    wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="4 4" strokeWidth={1.5} />
                  {proyeccion.map((c, i) => (
                    <Line key={c.codigo} dataKey={c.codigo}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={c.isPyc ? 1.5 : 2}
                      strokeDasharray={c.isPyc ? '6 3' : undefined}
                      dot={c.isPyc ? false : { r: 3 }}
                      connectNulls activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Detalle mensual por alcance */}
            <div className="panel">
              <div className="panel-title" style={{ marginBottom: 10 }}>
                Detalle mensual por alcance de servicio
              </div>
              {detalleGrupos.map(g => {
                const isOpen = detalleAbiertos.has(g.key)
                const toggle = () => setDetalleAbiertos(prev => {
                  const next = new Set(prev)
                  if (next.has(g.key)) next.delete(g.key); else next.add(g.key)
                  return next
                })
                return (
                  <div key={g.key} style={{ marginBottom: 4, border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}>
                    {/* Header colapsable */}
                    <div onClick={toggle} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 14px', cursor: 'pointer', userSelect: 'none',
                      background: isOpen ? '#f0f4ff' : '#f8f9fb',
                    }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', width: 10 }}>{isOpen ? '▼' : '▶'}</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{g.alcance}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {g.items.map(it =>
                          it.isPyc
                            ? `P&C: ${fmtMoney(it.saldo_inicial)}`
                            : `${it.codigo}: ${fmtMoney(it.saldo_inicial, it.moneda)}`
                        ).join(' · ')}
                      </span>
                    </div>

                    {/* Contenido expandido */}
                    {isOpen && (
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {g.items.map((c, ci) => {
                          const accentColor = c.isPyc ? '#6b7280' : COLORS[ci % COLORS.length]
                          const agota = c.timeline.find(t => t.saldo <= 0)
                          const last  = c.timeline.at(-1)
                          return (
                            <div key={c.codigo}>
                              <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginBottom: 8, paddingBottom: 6,
                                borderBottom: `2px solid ${accentColor}`,
                              }}>
                                <div>
                                  <span style={{ fontWeight: 700, fontSize: 12, color: accentColor }}>{c.display}</span>
                                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 10 }}>
                                    Saldo inicial: <strong>{fmtMoney(c.saldo_inicial, c.moneda)}</strong>
                                  </span>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: 12 }}>
                                  Saldo final:{' '}
                                  <strong style={{ color: (last?.saldo ?? 0) <= 0 ? '#dc2626' : '#059669' }}>
                                    {last ? fmtMoney(last.saldo, c.moneda) : fmtMoney(c.saldo_inicial, c.moneda)}
                                  </strong>
                                  {agota && (
                                    <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, marginLeft: 10 }}>
                                      ⚠ Agota en {fmtPeriodo(agota.periodo)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {c.timeline.length > 0 && (
                                <div style={{ overflowX: 'auto' }}>
                                  <table className="data-table" style={{ minWidth: 360 }}>
                                    <thead><tr>
                                      <th>Período</th>
                                      <th style={{ textAlign: 'right' }}>Gasto proyectado</th>
                                      <th style={{ textAlign: 'right' }}>Saldo restante</th>
                                    </tr></thead>
                                    <tbody>
                                      {c.timeline.map(t => (
                                        <tr key={t.periodo} style={{ background: t.saldo <= 0 ? '#fef2f2' : undefined }}>
                                          <td style={{ fontWeight: 500 }}>{fmtPeriodo(t.periodo)}</td>
                                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                            {fmtMoney(t.gasto, c.moneda)}
                                          </td>
                                          <td style={{
                                            textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600,
                                            color: t.saldo <= 0 ? '#dc2626' : t.saldo < c.saldo_inicial * 0.1 ? '#d97706' : 'inherit',
                                          }}>
                                            {fmtMoney(t.saldo, c.moneda)}
                                            {t.saldo <= 0 && <span style={{ marginLeft: 4, fontSize: 11 }}>⚠</span>}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>
    </>
  )
}
