import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../../shared/AppShell'
import { ScenarioListPage } from '../../pages/ScenarioListPage'
import { ScenarioEditorPage } from '../../pages/ScenarioEditorPage'
import { ScenarioDetailPage } from '../../pages/ScenarioDetailPage'
import { ScenarioComparePage } from '../../pages/ScenarioComparePage'
import { TagManagementPage } from '../../pages/TagManagementPage'
import { PLViewPage } from '../../pages/PLViewPage'
import { AuthPage } from '../../pages/AuthPage'
import { RequireAuth } from '../../features/auth/RequireAuth'

export function AppRouter() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/scenarios" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/scenarios" element={<RequireAuth><ScenarioListPage /></RequireAuth>} />
        <Route path="/scenarios/new" element={<RequireAuth><ScenarioEditorPage /></RequireAuth>} />
        <Route path="/scenarios/:id/edit" element={<RequireAuth><ScenarioEditorPage /></RequireAuth>} />
        <Route path="/scenarios/:id" element={<RequireAuth><ScenarioDetailPage /></RequireAuth>} />
        <Route path="/scenarios/compare" element={<RequireAuth><ScenarioComparePage /></RequireAuth>} />
        <Route path="/compare" element={<RequireAuth><ScenarioComparePage /></RequireAuth>} />
        <Route path="/tags" element={<RequireAuth><TagManagementPage /></RequireAuth>} />
        <Route path="/pl" element={<RequireAuth><PLViewPage /></RequireAuth>} />
      </Routes>
    </AppShell>
  )
}
