import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { SplashPage } from '@/pages/SplashPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { OpportunitiesPage } from '@/pages/OpportunitiesPage'
import { PipelinePage } from '@/pages/PipelinePage'
import { MonitoringPage } from '@/pages/MonitoringPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="explorar" element={<ExplorePage />} />
          <Route path="oportunidades" element={<OpportunitiesPage />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route path="monitoramentos" element={<MonitoringPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-line-strong)',
            color: 'var(--color-ink)',
          },
        }}
      />
    </BrowserRouter>
  )
}
