export type Role = 'admin' | 'dab' | 'dpo' | 'estrategico' | 'excelencia_operacional' | 'evaluador' | 'pyc' | 'admin_contrato'
export type CargaTab = 'dab' | 'dpo' | 'registro'

export const ROLE_LABELS: Record<string, string> = {
  admin:                  'Administrador',
  dab:                    'DAB',
  dpo:                    'DPO',
  estrategico:            'Estratégico',
  excelencia_operacional: 'Excelencia Operacional',
  evaluador:              'Evaluador',
  pyc:                    'P&C',
  admin_contrato:         'Administrador de Contrato',
}

// '*' significa acceso total
export const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  admin:                  ['*'],
  dab:                    ['/', '/alertas', '/licitaciones', '/solpes', '/dashboard-dab', '/kpi-contratos', '/modificaciones'],
  dpo:                    ['/', '/dashboard-dpo'],
  estrategico:            ['/', '/saldo', '/estados-pago', '/proyecciones', '/analisis', '/sourcing', '/simulacion'],
  excelencia_operacional: ['/', '/estado-proyectos', '/metros', '/presupuesto-perforacion'],
  evaluador:              ['/', '/modelos/sondajes', '/modelos/campamento', '/modelos/mt'],
  pyc:                    ['/', '/carga'],
  admin_contrato:         ['/', '/alertas', '/licitaciones', '/solpes', '/dashboard-dab', '/kpi-contratos', '/modificaciones', '/carga'],
  // /usuarios solo accesible para admin (que tiene '*')

}

export const ROLE_CARGA_TABS: Record<string, CargaTab[]> = {
  admin:          ['dab', 'dpo', 'registro'],
  pyc:            ['dpo', 'registro'],
  admin_contrato: ['dab', 'registro'],
}

export function canAccess(role: string, path: string): boolean {
  const allowed = ROLE_ALLOWED_PATHS[role] ?? []
  if (allowed.includes('*')) return true
  return allowed.some(p => path === p || path.startsWith(p + '/'))
}

export function allowedCargaTabs(role: string): CargaTab[] {
  return ROLE_CARGA_TABS[role] ?? []
}

export const ROLE_HOME: Record<string, string> = {
  admin:                  '/',
  dab:                    '/',
  dpo:                    '/',
  estrategico:            '/',
  excelencia_operacional: '/',
  evaluador:              '/',
  pyc:                    '/carga',
  admin_contrato:         '/carga',
}

export function roleHome(role: string): string {
  return ROLE_HOME[role] ?? '/'
}
