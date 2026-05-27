import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ensureMasterData } from '../features/master/api/masterRepository'
import { fetchScenarios } from '../features/scenario/api/scenarioRepository'
import type { ScenarioListItem } from '../features/scenario/model/types'

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
const formatDateTime = (value: string) => new Date(value).toLocaleString('en-US')

export function ScenarioListPage() {
  const [items, setItems] = useState<ScenarioListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        await ensureMasterData()
        setItems(await fetchScenarios())
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('[scenario] list failed', message)
        setError(`Failed to load scenarios: ${message}`)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Scenario List</h2>
        <Link to="/scenarios/new" className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">New Scenario</Link>
      </div>

      {loading && <p className="text-sm text-slate-600">Loading scenarios...</p>}
      {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="text-sm text-slate-600">No scenarios found.</p>}

      {!loading && !error && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-slate-600">
                <th className="py-2">Scenario name</th><th>Target month</th><th>Unit price</th><th>Quantity</th><th>Fixed cost</th><th>Status</th><th>Created at</th><th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.name}</td>
                  <td>{item.targetYearMonth}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.fixedCost)}</td>
                  <td>{item.status}</td>
                  <td>{formatDateTime(item.createdAt)}</td>
                  <td><Link className="text-blue-600 hover:underline" to={`/scenarios/${item.id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
