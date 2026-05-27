import { useEffect, useMemo, useState } from 'react'
import { calculateCvp } from '../domain/cvp/formulas'
import { fetchScenariosForCompare } from '../features/scenario/api/scenarioRepository'
import type { Scenario } from '../features/scenario/model/types'

const formatCurrency = (value: number | null) =>
  value === null
    ? '-'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(value)

const formatNumber = (value: number | null, digits = 2) =>
  value === null ? '-' : value.toFixed(digits)

const formatSignedCurrency = (value: number | null) => {
  if (value === null) return '-'
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatCurrency(value)}`
}

const formatSignedNumber = (value: number | null, digits = 2) => {
  if (value === null) return '-'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}`
}

type CompareMetric = {
  scenario: Scenario
  revenue: number
  variableCost: number
  contributionMargin: number
  profit: number
  breakEvenQuantity: number | null
}

export function ScenarioComparePage() {
  const [items, setItems] = useState<Scenario[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        setItems(await fetchScenariosForCompare())
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(`Failed to load scenarios: ${message}`)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const selectedScenarios = useMemo(() => {
    const byId = new Map(items.map((item) => [item.id, item]))
    return selectedIds.map((id) => byId.get(id)).filter((v): v is Scenario => Boolean(v))
  }, [items, selectedIds])

  const metrics = useMemo<CompareMetric[]>(() => {
    return selectedScenarios.map((scenario) => {
      const cvp = calculateCvp({
        unitPrice: scenario.unitPrice,
        quantity: scenario.quantity,
        variableCostPerUnit: scenario.variableCostPerUnit,
        fixedCost: scenario.fixedCost,
      })

      return {
        scenario,
        revenue: cvp.sales,
        variableCost: cvp.variableCost,
        contributionMargin: cvp.contributionMargin,
        profit: cvp.operatingProfit,
        breakEvenQuantity: cvp.breakEvenQuantity,
      }
    })
  }, [selectedScenarios])

  const base = metrics[0] ?? null
  const showDiff = metrics.length >= 2

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((value) => value !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  const rowClass = 'border-b align-top'
  const labelClass = 'whitespace-nowrap px-3 py-2 text-sm font-medium text-slate-700'
  const cellClass = 'whitespace-nowrap px-3 py-2 text-sm text-slate-900'

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium">Scenario Compare</h2>
      <p className="mt-2 text-sm text-slate-600">Select up to 3 scenarios and compare core CVP metrics side by side.</p>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">Select scenarios (max 3)</p>
        {loading && <p className="mt-2 text-sm text-slate-600">Loading scenarios...</p>}
        {error && <p className="mt-2 rounded-md bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}
        {!loading && !error && items.length === 0 && <p className="mt-2 text-sm text-slate-600">No scenarios found.</p>}

        {!loading && !error && items.length > 0 && (
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {items.map((item) => {
              const checked = selectedIds.includes(item.id)
              const disableUnchecked = !checked && selectedIds.length >= 3

              return (
                <label key={item.id} className={`flex cursor-pointer items-start gap-2 rounded-md border bg-white p-3 ${checked ? 'border-slate-400' : 'border-slate-200'} ${disableUnchecked ? 'opacity-60' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disableUnchecked}
                    onChange={() => toggleSelection(item.id)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    <span className="block font-medium text-slate-900">{item.name}</span>
                    <span className="block text-slate-600">{item.targetYearMonth} / {item.status}</span>
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {metrics.length === 0 && !loading && !error && (
        <p className="mt-5 text-sm text-slate-600">Choose at least one scenario to start comparing.</p>
      )}

      {metrics.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border text-left">
            <thead>
              <tr className="border-b bg-slate-100 text-sm text-slate-700">
                <th className="px-3 py-2">Metric</th>
                {metrics.map((metric, index) => (
                  <th key={metric.scenario.id} className="px-3 py-2">{index === 0 ? `${metric.scenario.name} (Base)` : metric.scenario.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className={rowClass}><th className={labelClass}>Scenario name</th>{metrics.map((m) => <td key={m.scenario.id} className={cellClass}>{m.scenario.name}</td>)}</tr>
              <tr className={rowClass}><th className={labelClass}>Target month</th>{metrics.map((m) => <td key={m.scenario.id} className={cellClass}>{m.scenario.targetYearMonth}</td>)}</tr>
              <tr className={rowClass}><th className={labelClass}>Unit price</th>{metrics.map((m) => <td key={m.scenario.id} className={cellClass}>{formatCurrency(m.scenario.unitPrice)}</td>)}</tr>
              <tr className={rowClass}><th className={labelClass}>Quantity</th>{metrics.map((m) => <td key={m.scenario.id} className={cellClass}>{formatNumber(m.scenario.quantity, 2)}</td>)}</tr>
              <tr className={rowClass}><th className={labelClass}>Variable cost per unit</th>{metrics.map((m) => <td key={m.scenario.id} className={cellClass}>{formatCurrency(m.scenario.variableCostPerUnit)}</td>)}</tr>
              <tr className={rowClass}><th className={labelClass}>Fixed cost</th>{metrics.map((m) => <td key={m.scenario.id} className={cellClass}>{formatCurrency(m.scenario.fixedCost)}</td>)}</tr>
              <tr className={rowClass}><th className={labelClass}>Revenue</th>{metrics.map((m) => <td key={m.scenario.id} className={cellClass}>{formatCurrency(m.revenue)}</td>)}</tr>
              <tr className={rowClass}><th className={labelClass}>Variable cost</th>{metrics.map((m) => <td key={m.scenario.id} className={cellClass}>{formatCurrency(m.variableCost)}</td>)}</tr>
              <tr className={rowClass}><th className={labelClass}>Contribution margin</th>{metrics.map((m) => <td key={m.scenario.id} className={cellClass}>{formatCurrency(m.contributionMargin)}</td>)}</tr>
              <tr className={rowClass}><th className={labelClass}>Profit</th>{metrics.map((m) => <td key={m.scenario.id} className={cellClass}>{formatCurrency(m.profit)}</td>)}</tr>
              <tr className={rowClass}><th className={labelClass}>Break-even quantity</th>{metrics.map((m) => <td key={m.scenario.id} className={cellClass}>{formatNumber(m.breakEvenQuantity, 2)}</td>)}</tr>

              {showDiff && base && (
                <>
                  <tr className={rowClass}>
                    <th className={labelClass}>Profit difference</th>
                    {metrics.map((m, index) => (
                      <td key={m.scenario.id} className={cellClass}>{index === 0 ? '-' : formatSignedCurrency(m.profit - base.profit)}</td>
                    ))}
                  </tr>
                  <tr className={rowClass}>
                    <th className={labelClass}>Revenue difference</th>
                    {metrics.map((m, index) => (
                      <td key={m.scenario.id} className={cellClass}>{index === 0 ? '-' : formatSignedCurrency(m.revenue - base.revenue)}</td>
                    ))}
                  </tr>
                  <tr className={rowClass}>
                    <th className={labelClass}>Break-even quantity difference</th>
                    {metrics.map((m, index) => {
                      const diff = m.breakEvenQuantity === null || base.breakEvenQuantity === null ? null : m.breakEvenQuantity - base.breakEvenQuantity
                      return <td key={m.scenario.id} className={cellClass}>{index === 0 ? '-' : formatSignedNumber(diff, 2)}</td>
                    })}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
