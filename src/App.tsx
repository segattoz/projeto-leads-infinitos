import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { SplashPage } from '@/pages/SplashPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { RadarListPage } from '@/pages/RadarListPage'
import { RadarWizardPage } from '@/pages/RadarWizardPage'
import { RadarJobDetailPage } from '@/pages/RadarJobDetailPage'
import { CompaniesPage } from '@/pages/CompaniesPage'
import { IcpListPage } from '@/pages/IcpListPage'
import { IcpEditorPage } from '@/pages/IcpEditorPage'
import { LeadsListPage } from '@/pages/LeadsListPage'
import { Lead360Page } from '@/pages/Lead360Page'
import { FunilPage } from '@/pages/FunilPage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          <Route path="radar" element={<RadarListPage />} />
          <Route path="radar/novo" element={<RadarWizardPage />} />
          <Route path="radar/:jobId" element={<RadarJobDetailPage />} />

          <Route path="empresas" element={<CompaniesPage />} />

          <Route path="icps" element={<IcpListPage />} />
          <Route path="icps/novo" element={<IcpEditorPage />} />
          <Route path="icps/:id" element={<IcpEditorPage />} />

          <Route path="leads" element={<LeadsListPage />} />
          <Route path="leads/:id" element={<Lead360Page />} />

          <Route path="funil" element={<FunilPage />} />

          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="bottom-right"
        theme="light"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            border: '1px solid var(--color-line-strong)',
            color: 'var(--color-ink)',
          },
        }}
      />
    </BrowserRouter>
  )
}
