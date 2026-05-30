import { useEffect, useState } from 'react'

export const COMPLETED_MODULES_STORAGE_KEY = 'kotoriplanLab.completedModules'
export const LEARNING_PROGRESS_UPDATED_EVENT = 'kotoriplanLab.completedModules.updated'

export const learningModuleIdByPath: Record<string, string> = {
  '/drivers': 'driver-planning',
  '/pl/variance-drivers': 'variance-drivers',
  '/pl': 'pl-view',
  '/pl/by-dimension': 'pl-by-dimension',
  '/pl/variance': 'pl-variance',
  '/pl/bridge': 'pl-bridge',
  '/pl/ratios': 'ratio-analysis',
  '/planning/headcount': 'headcount-planning',
  '/planning/capacity': 'capacity-planning',
  '/planning/capex': 'capex-planning',
  '/forecast/rolling': 'rolling-forecast',
  '/drivers/sensitivity': 'sensitivity-analysis',
  '/drivers/break-even': 'break-even-analysis',
  '/planning/scenario-planning': 'scenario-planning',
  '/planning/investment-portfolio': 'investment-portfolio-planning',
  '/planning/long-range': 'long-range-planning',
  '/planning/strategic-initiative': 'strategic-initiative-planning',
  '/planning/strategic-driver-tree': 'strategic-driver-tree',
  '/planning/cash-flow': 'cash-flow-planning',
  '/planning/balance-sheet': 'balance-sheet-planning'
}

const normalizePathname = (pathname: string) => {
  if (pathname === '/') return pathname

  return pathname.replace(/\/+$/, '')
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const notifyProgressUpdated = () => {
  window.dispatchEvent(new Event(LEARNING_PROGRESS_UPDATED_EVENT))
}

export const getLearningModuleIdForPath = (pathname: string) =>
  learningModuleIdByPath[normalizePathname(pathname)]

export const readCompletedModules = () => {
  if (typeof window === 'undefined') return []

  try {
    const storedValue = window.localStorage.getItem(COMPLETED_MODULES_STORAGE_KEY)
    if (!storedValue) return []

    const parsedValue = JSON.parse(storedValue)

    return isStringArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

export const markModuleCompleted = (moduleId: string) => {
  const completedModules = readCompletedModules()

  if (completedModules.includes(moduleId)) return

  window.localStorage.setItem(
    COMPLETED_MODULES_STORAGE_KEY,
    JSON.stringify([...completedModules, moduleId])
  )
  notifyProgressUpdated()
}

export const resetCompletedModules = () => {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(COMPLETED_MODULES_STORAGE_KEY)
  notifyProgressUpdated()
}

export const useCompletedModules = () => {
  const [completedModules, setCompletedModules] = useState<string[]>(() => readCompletedModules())

  useEffect(() => {
    const syncCompletedModules = () => {
      setCompletedModules(readCompletedModules())
    }

    window.addEventListener('storage', syncCompletedModules)
    window.addEventListener(LEARNING_PROGRESS_UPDATED_EVENT, syncCompletedModules)

    return () => {
      window.removeEventListener('storage', syncCompletedModules)
      window.removeEventListener(LEARNING_PROGRESS_UPDATED_EVENT, syncCompletedModules)
    }
  }, [])

  return completedModules
}
