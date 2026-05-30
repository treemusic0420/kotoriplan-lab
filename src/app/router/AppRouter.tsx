import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '../../shared/AppShell'
import { ScenarioListPage } from '../../pages/ScenarioListPage'
import { ScenarioEditorPage } from '../../pages/ScenarioEditorPage'
import { ScenarioDetailPage } from '../../pages/ScenarioDetailPage'
import { ScenarioComparePage } from '../../pages/ScenarioComparePage'
import { TagManagementPage } from '../../pages/TagManagementPage'
import { PLViewPage } from '../../pages/PLViewPage'
import { AnalysisDimensionsPage } from '../../pages/AnalysisDimensionsPage'
import { PLByDimensionPage } from '../../pages/PLByDimensionPage'
import { AuthPage } from '../../pages/AuthPage'
import { PLVariancePage } from '../../pages/PLVariancePage'
import { PLVarianceDriversPage } from '../../pages/PLVarianceDriversPage'
import { PLBridgePage } from '../../pages/PLBridgePage'
import { PLRatioAnalysisPage } from '../../pages/PLRatioAnalysisPage'
import { LearningPathPage } from '../../pages/LearningPathPage'
import { DriverPlanningPage } from '../../pages/DriverPlanningPage'
import { SensitivityAnalysisPage } from '../../pages/SensitivityAnalysisPage'
import { BreakEvenAnalysisPage } from '../../pages/BreakEvenAnalysisPage'
import { RollingForecastPage } from '../../pages/RollingForecastPage'
import { HeadcountPlanningPage } from '../../pages/HeadcountPlanningPage'
import { CapacityPlanningPage } from '../../pages/CapacityPlanningPage'
import { CapExPlanningPage } from '../../pages/CapExPlanningPage'
import { InvestmentPortfolioPlanningPage } from '../../pages/InvestmentPortfolioPlanningPage'
import { LongRangePlanningPage } from '../../pages/LongRangePlanningPage'
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
        <Route path="/dimensions" element={<RequireAuth><AnalysisDimensionsPage /></RequireAuth>} />
        <Route path="/pl/by-dimension" element={<RequireAuth><PLByDimensionPage /></RequireAuth>} />
        <Route path="/pl/variance" element={<RequireAuth><PLVariancePage /></RequireAuth>} />
        <Route path="/pl/variance-drivers" element={<RequireAuth><PLVarianceDriversPage /></RequireAuth>} />
        <Route path="/pl/bridge" element={<RequireAuth><PLBridgePage /></RequireAuth>} />
        <Route path="/pl/ratios" element={<RequireAuth><PLRatioAnalysisPage /></RequireAuth>} />
        <Route path="/learning-path" element={<RequireAuth><LearningPathPage /></RequireAuth>} />
        <Route path="/drivers" element={<RequireAuth><DriverPlanningPage /></RequireAuth>} />
        <Route path="/drivers/sensitivity" element={<RequireAuth><SensitivityAnalysisPage /></RequireAuth>} />
        <Route path="/drivers/break-even" element={<RequireAuth><BreakEvenAnalysisPage /></RequireAuth>} />
        <Route path="/forecast/rolling" element={<RequireAuth><RollingForecastPage /></RequireAuth>} />
        <Route path="/planning/headcount" element={<RequireAuth><HeadcountPlanningPage /></RequireAuth>} />
        <Route path="/planning/capacity" element={<RequireAuth><CapacityPlanningPage /></RequireAuth>} />
        <Route path="/planning/capex" element={<RequireAuth><CapExPlanningPage /></RequireAuth>} />
        <Route path="/planning/investment-portfolio" element={<RequireAuth><InvestmentPortfolioPlanningPage /></RequireAuth>} />
        <Route path="/planning/long-range" element={<RequireAuth><LongRangePlanningPage /></RequireAuth>} />
      </Routes>
    </AppShell>
  )
}
