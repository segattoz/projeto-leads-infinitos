import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  // Fecha o menu mobile sempre que a rota muda (ex.: navegação pelo teclado
  // ou botão voltar do navegador, além do clique direto no item do menu).
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
