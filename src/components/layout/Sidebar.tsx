import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Radar,
  Table2,
  KanbanSquare,
  SatelliteDish,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoType } from '@/components/layout/Logo'
import { useSettingsStore } from '@/store/useSettingsStore'
import { Tooltip } from '@/components/ui/tooltip'

const NAV_ITEMS = [
  { to: '/app', label: 'Visão Geral', icon: LayoutDashboard, end: true },
  { to: '/app/explorar', label: 'Explorar Território', icon: Radar },
  { to: '/app/oportunidades', label: 'Oportunidades', icon: Table2 },
  { to: '/app/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { to: '/app/monitoramentos', label: 'Monitoramentos', icon: SatelliteDish },
  { to: '/app/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const setCollapsed = useSettingsStore((s) => s.setSidebarCollapsed)

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-300',
        collapsed ? 'w-[64px]' : 'w-[232px]',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-line', collapsed ? 'justify-center px-2' : 'px-4')}>
        <LogoType collapsed={collapsed} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2.5" aria-label="Navegação principal">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
          const link = (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-primary-dim text-primary-strong'
                    : 'text-muted hover:bg-surface-3 hover:text-ink',
                )
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          )
          return collapsed ? (
            <Tooltip key={to} content={label} side="bottom" className="w-full">
              {link}
            </Tooltip>
          ) : (
            link
          )
        })}
      </nav>

      <div className="border-t border-line p-2.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-faint transition-colors hover:bg-surface-3 hover:text-ink',
            collapsed && 'justify-center px-0',
          )}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
