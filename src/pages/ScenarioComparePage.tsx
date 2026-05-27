import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { calculateCvp } from '../domain/cvp/formulas'
import { fetchScenariosForCompare } from '../features/scenario/api/scenarioRepository'
import type { Scenario } from '../features/scenario/model/types'

const c = (n: number | null) =>
  n === null || Number.isNaN(n)
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
const pct = (n: number | null) => (n === null || Number.isNaN(n) ? '—' : `${(n * 100).toFixed(2)}%`)
const qty = (n: number | null) => (n === null || Number.isNaN(n) ? '—' : n.toFixed(2))
const signed = (n: number | null, isPct = false) =>
  n === null || Number.isNaN(n) ? '—' : `${n > 0 ? '+' : ''}${isPct ? `${(n * 100).toFixed(2)}%` : c(n)}`

type CompareRow = {
  s: Scenario
  cvp: ReturnType<typeof calculateCvp>
}

export function ScenarioComparePage() {
  const [items, setItems] = useState<Scenario[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limitMsg, setLimitMsg] = useState('')
  const [productFilter, setProductFilter] = useState<'all' | string>('all')

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        setItems(await fetchScenariosForCompare())
      } catch (e) {
        setError(`Failed to load scenarios: ${e instanceof Error ? e.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const productOptions = useMemo(() => Array.from(new Set(items.map((i) => i.productName || 'General'))).sort(), [items])
  const visibleItems = useMemo(() => items.filter((i) => productFilter === 'all' || (i.productName || 'General') === productFilter), [items, productFilter])

  const selected = useMemo(
    () => selectedIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) as Scenario[],
    [items, selectedIds],
  )

  const rows: CompareRow[] = selected.map((s) => ({
    s,
    cvp: calculateCvp({
      unitPrice: s.unitPrice,
      quantity: s.quantity,
      variableCostPerUnit: s.variableCostPerUnit,
      fixedCost: s.fixedCost,
    }),
  }))

  const base = rows[0]

  const toggle = (id: string) =>
    setSelectedIds((p) => {
      if (p.includes(id)) return p.filter((v) => v !== id)
      if (p.length >= 3) {
        setLimitMsg('You can compare up to 3 scenarios.')
        return p
      }
      setLimitMsg('')
      return [...p, id]
    })

  const renderDataRow = (label: string, fn: (row: CompareRow) => string) => (
    <tr key={label} className='border-t'>
      <th className='px-3 py-2 text-left font-medium'>{label}</th>
      {rows.map((r) => (
        <td key={r.s.id} className='px-3 py-2'>
          {fn(r)}
        </td>
      ))}
    </tr>
  )

  const renderSectionRow = (label: string) => (
    <tr key={label} className='border-t bg-slate-100'>
      <th className='px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700'>{label}</th>
      <td className='px-3 py-2' colSpan={Math.max(rows.length, 1)} />
    </tr>
  )

  return (
    <section className='rounded-xl bg-white p-6 shadow-sm'>
      <h2 className='text-lg font-medium'>Scenario Compare</h2>

      <div className='mt-4 rounded-lg border bg-slate-50 p-4'>
        <p className='text-sm font-medium text-slate-800'>Select 2 to 3 scenarios to compare</p>
        <p className='mt-1 text-xs text-slate-600'>{selectedIds.length} of 3 selected</p><div className='mt-2'><select className='rounded-md border px-2 py-1 text-sm' value={productFilter} onChange={(e)=>setProductFilter(e.target.value)}><option value='all'>all products</option>{productOptions.map((p)=><option key={p} value={p}>{p}</option>)}</select></div>

        {loading && <p className='mt-3 text-sm text-slate-600'>Loading scenarios...</p>}
        {error && <p className='mt-3 rounded-md bg-rose-50 p-2 text-sm text-rose-700'>{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className='mt-3 text-sm text-slate-600'>No scenarios available. Create scenarios first to compare.</p>
        )}
        {!loading && !error && items.length === 1 && (
          <p className='mt-3 text-sm text-slate-600'>At least two scenarios are required for comparison.</p>
        )}

        <div className='mt-3 grid gap-2 md:grid-cols-2'>
          {visibleItems.map((i) => {
            const checked = selectedIds.includes(i.id)
            const cvp = calculateCvp({
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              variableCostPerUnit: i.variableCostPerUnit,
              fixedCost: i.fixedCost,
            })
            return (
              <label key={i.id} className='rounded-md border bg-white p-3'>
                <span className='flex items-start gap-2'>
                  <input type='checkbox' checked={checked} onChange={() => toggle(i.id)} />
                  <span className='text-sm'>
                    <b>{i.productName || 'General'} / {i.name}</b>
                    <br />
                    Target month: {i.targetYearMonth}
                    <br />
                    Status: {i.status}
                    <br />
                    Operating Profit: {c(cvp.operatingProfit)}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
        {limitMsg && <p className='mt-2 text-xs text-amber-700'>{limitMsg}</p>}
      </div>

      {selected.length < 2 && !loading && !error && (
        <p className='mt-4 text-sm text-slate-600'>Select at least two scenarios to show comparison.</p>
      )}

      {selected.length >= 2 && (
        <>
          <div className='mt-5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm'>
            <span className='font-semibold'>Base Scenario:</span> {base?.s.name ?? '—'}
          </div>

          <div className='mt-5 overflow-x-auto'>
            <table className='min-w-full border text-sm'>
              <thead>
                <tr className='bg-slate-100'>
                  <th className='px-3 py-2 text-left'>Metric</th>
                  {rows.map((r) => (
                    <th key={r.s.id} className='px-3 py-2 text-left'>
                      {r.s.productName || 'General'} / {r.s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renderSectionRow('Revenue & Cost')}
                {renderDataRow('Sales', (r) => c(r.cvp.sales))}
                {renderDataRow('Variable Cost', (r) => c(r.cvp.variableCost))}
                {renderDataRow('Fixed Cost', (r) => c(r.s.fixedCost))}

                {renderSectionRow('Profitability')}
                {renderDataRow('Contribution Margin', (r) => c(r.cvp.contributionMargin))}
                {renderDataRow('Contribution Margin Ratio', (r) => pct(r.cvp.contributionMarginRatio))}
                {renderDataRow('Operating Profit', (r) => c(r.cvp.operatingProfit))}

                {renderSectionRow('Break-even')}
                {renderDataRow('Break-even Sales', (r) => c(r.cvp.breakEvenSales))}
                {renderDataRow('Break-even Quantity', (r) => qty(r.cvp.breakEvenQuantity))}
                {renderDataRow('Margin of Safety Ratio', (r) => pct(r.cvp.marginOfSafetyRatio))}

                {renderSectionRow('Difference from Base (Compared with Base)')}
                {[
                  { label: 'Sales difference', fn: (r: CompareRow) => signed(r.cvp.sales - base.cvp.sales) },
                  {
                    label: 'Operating Profit difference',
                    fn: (r: CompareRow) => signed(r.cvp.operatingProfit - base.cvp.operatingProfit),
                  },
                  {
                    label: 'Contribution Margin Ratio difference',
                    fn: (r: CompareRow) =>
                      signed(r.cvp.contributionMarginRatio - base.cvp.contributionMarginRatio, true),
                  },
                  {
                    label: 'Break-even Sales difference',
                    fn: (r: CompareRow) =>
                      signed(
                        r.cvp.breakEvenSales === null || base.cvp.breakEvenSales === null
                          ? null
                          : r.cvp.breakEvenSales - base.cvp.breakEvenSales,
                      ),
                  },
                ].map((m) => (
                  <tr key={m.label} className='border-t bg-slate-50'>
                    <th className='px-3 py-2 text-left'>{m.label}</th>
                    {rows.map((r, idx) => (
                      <td key={r.s.id} className='px-3 py-2'>
                        {idx === 0 ? 'Base' : m.fn(r)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='mt-6 rounded-lg border p-3'>
            <h3 className='mb-2 text-sm font-semibold'>Operating Profit Comparison</h3>
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={rows.map((r) => ({ name: r.s.name, 'Operating Profit': r.cvp.operatingProfit }))}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey='Operating Profit' fill='#16a34a' />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className='mt-4 rounded-lg border p-3'>
            <h3 className='mb-2 text-sm font-semibold'>Scenario Breakdown</h3>
            <div className='h-72'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={rows.map((r) => ({
                    name: r.s.name,
                    Sales: r.cvp.sales,
                    'Variable Cost': r.cvp.variableCost,
                    'Fixed Cost': r.s.fixedCost,
                    'Operating Profit': r.cvp.operatingProfit,
                  }))}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey='Sales' fill='#0f172a' />
                  <Bar dataKey='Variable Cost' fill='#64748b' />
                  <Bar dataKey='Fixed Cost' fill='#94a3b8' />
                  <Bar dataKey='Operating Profit' fill='#16a34a' />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className='mt-4 rounded-lg border bg-slate-50 p-3 text-xs text-slate-700'>
            <p className='mb-1 font-semibold'>Quick Formula Guide</p>
            <ul className='grid gap-1 md:grid-cols-2'>
              <li>Sales = Unit Price × Quantity</li>
              <li>Variable Cost = Variable Cost per Unit × Quantity</li>
              <li>Contribution Margin = Sales - Variable Cost</li>
              <li>Operating Profit = Contribution Margin - Fixed Cost</li>
              <li>Break-even Sales = Fixed Cost / Contribution Margin Ratio</li>
              <li>Margin of Safety = (Sales - Break-even Sales) / Sales</li>
            </ul>
          </div>
        </>
      )}
    </section>
  )
}
