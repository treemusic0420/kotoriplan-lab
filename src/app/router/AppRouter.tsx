import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../../shared/AppShell'
import { ScenarioListPage } from '../../pages/ScenarioListPage'
import { ScenarioEditorPage } from '../../pages/ScenarioEditorPage'
import { ScenarioDetailPage } from '../../pages/ScenarioDetailPage'
import { ScenarioComparePage } from '../../pages/ScenarioComparePage'
import { TagManagementPage } from '../../pages/TagManagementPage'

export function AppRouter() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/scenarios" replace />} />
        <Route path="/scenarios" element={<ScenarioListPage />} />
        <Route path="/scenarios/new" element={<ScenarioEditorPage />} />
        <Route path="/scenarios/:id" element={<ScenarioDetailPage />} />
        <Route path="/compare" element={<ScenarioComparePage />} />
        <Route path="/tags" element={<TagManagementPage />} />
      </Routes>
    </AppShell>
  )
}
