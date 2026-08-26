import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Radar,
  Building2,
  Target,
  Users,
  KanbanSquare,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoType } from '@/components/layout/Logo'
import { useSettingsStore } from '@/store/useSettingsStore'
import { Tooltip } from '@/components/ui/tooltip'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Visão Geral',
    items: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Radar',
    items: [
      { to: '/app/radar', label: 'Radar', icon: Radar },
      { to: '/app/empresas', label: 'Empresas', icon: Building2 },
      { to: '/app/icps', label: 'ICPs', icon: Target },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { to: '/app/leads', label: 'Leads', icon: Users },
      { to: '/app/funil', label: 'Funil', icon: KanbanSquare },
    ],
  },
  {
    label: 'Configurações',
    items: [{ to: '/app/configuracoes', label: 'Organização', icon: Settings }],
  },
]

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const setCollapsed = useSettingsStore((s) => s.setSidebarCollapsed)

  // No overlay mobile o menu sempre aparece expandido — o modo "ícone
  // apenas" só faz sentido como trilho fixo em telas grandes.
  const effectiveCollapsed = mobileOpen ? false : collapsed

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[1290] bg-black/30 backdrop-blur-[2px] animate-fade-in md:hidden"
          onClick={onMobileClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[1300] flex h-full w-[264px] flex-col border-r border-line bg-surface transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:z-auto md:w-auto md:translate-x-0 md:transition-[width]',
          collapsed ? 'md:w-[64px]' : 'md:w-[224px]',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center justify-between border-b border-line px-4',
            effectiveCollapsed && 'md:justify-center md:px-2',
          )}
        >
          <LogoType collapsed={effectiveCollapsed} />
          <button
            onClick={onMobileClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-faint transition-colors hover:bg-surface-3 hover:text-ink md:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-2.5" aria-label="Navegação principal">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!effectiveCollapsed && (
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-faint">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon, end }) => {
                  const link = (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                          effectiveCollapsed && 'justify-center px-0',
                          isActive
                            ? 'bg-primary-dim text-primary-strong'
                            : 'text-muted hover:bg-surface-3 hover:text-ink',
                        )
                      }
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!effectiveCollapsed && <span className="truncate">{label}</span>}
                    </NavLink>
                  )
                  return effectiveCollapsed ? (
                    <Tooltip key={to} content={label} side="bottom" className="w-full">
                      {link}
                    </Tooltip>
                  ) : (
                    link
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-line p-2.5 md:block">
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
    </>
  )
}
