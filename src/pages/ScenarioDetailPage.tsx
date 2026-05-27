import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { calculateCvp } from '../domain/cvp/formulas'
import { ensureScenarioLineItems, fetchScenarioLineItems } from '../features/scenario/api/scenarioLineItemRepository'
import { fetchScenarioById } from '../features/scenario/api/scenarioRepository'
import type { Scenario, ScenarioLineItem } from '../features/scenario/model/types'

const currency = (value: number | null) => (value === null ? '-' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value))
const percent = (value: number) => `${(value * 100).toFixed(2)}%`

export function ScenarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [lineItems, setLineItems] = useState<ScenarioLineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchScenarioById(id)
        setScenario(data)
        if (data) {
          await ensureScenarioLineItems(id)
          const items = await fetchScenarioLineItems(id)
          setLineItems(items)
        } else {
          setLineItems([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch scenario')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  const cvp = useMemo(() => {
    if (!scenario) return null
    return calculateCvp({
      unitPrice: scenario.unitPrice,
      quantity: scenario.quantity,
      variableCostPerUnit: scenario.variableCostPerUnit,
      fixedCost: scenario.fixedCost,
    })
  }, [scenario])

  const chartData = cvp
    ? [{ name: 'Amount', Sales: cvp.sales, 'Variable Cost': cvp.variableCost, 'Fixed Cost': scenario?.fixedCost ?? 0, 'Operating Profit': cvp.operatingProfit }]
    : []

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium">Scenario Detail / Result</h2>
      <div className="mt-2"><Link to="/scenarios" className="text-sm text-blue-600 hover:underline">Back to list</Link></div>

      {loading && <p className="mt-4 text-sm text-slate-600">Loading scenario...</p>}
      {error && <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!loading && !error && !scenario && <p className="mt-4 text-sm text-slate-600">Scenario not found.</p>}

      {!loading && !error && scenario && cvp && (
        <>
          <div className="mt-4 grid gap-2 rounded-lg bg-slate-50 p-4 text-sm">
            <p><span className="font-medium">Scenario name:</span> {scenario.name}</p>
            <p><span className="font-medium">Target month:</span> {scenario.targetYearMonth}</p>
            <p><span className="font-medium">Status:</span> {scenario.status}</p>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <Metric label="Sales" value={currency(cvp.sales)} />
            <Metric label="Variable Cost" value={currency(cvp.variableCost)} />
            <Metric label="Contribution Margin" value={currency(cvp.contributionMargin)} />
            <Metric label="Contribution Margin Ratio" value={percent(cvp.contributionMarginRatio)} />
            <Metric label="Operating Profit" value={currency(cvp.operatingProfit)} />
            <Metric label="Break-even Sales" value={currency(cvp.breakEvenSales)} />
            <Metric label="Break-even Quantity" value={cvp.breakEvenQuantity === null ? '-' : cvp.breakEvenQuantity.toFixed(2)} />
            <Metric label="Margin of Safety Ratio" value={percent(cvp.marginOfSafetyRatio)} />
          </div>

          <div className="mt-6 h-80 rounded-lg border p-3">
            <p className="mb-3 text-sm font-medium">CVP Snapshot Chart</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Sales" fill="#0f172a" />
                <Bar dataKey="Variable Cost" fill="#64748b" />
                <Bar dataKey="Fixed Cost" fill="#94a3b8" />
                <Bar dataKey="Operating Profit" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6">
            <h3 className="text-base font-medium">Line Items</h3>
            <div className="mt-2 overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Account</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2 text-left">Quantity</th>
                    <th className="px-3 py-2 text-left">Unit price</th>
                    <th className="px-3 py-2 text-left">Organization</th>
                    <th className="px-3 py-2 text-left">Version</th>
                    <th className="px-3 py-2 text-left">Target month</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2">{item.account?.name ?? item.account?.code ?? '-'}</td>
                      <td className="px-3 py-2">{currency(item.amount)}</td>
                      <td className="px-3 py-2">{item.quantity === null ? '-' : item.quantity.toFixed(2)}</td>
                      <td className="px-3 py-2">{item.unitPrice === null ? '-' : currency(item.unitPrice)}</td>
                      <td className="px-3 py-2">{item.organization?.name ?? item.organization?.code ?? '-'}</td>
                      <td className="px-3 py-2">{item.version?.name ?? '-'}</td>
                      <td className="px-3 py-2">{item.targetYearMonth}</td>
                    </tr>
                  ))}
                  {lineItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-center text-slate-500">No line items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-base font-medium">{value}</p>
    </div>
  )
}
