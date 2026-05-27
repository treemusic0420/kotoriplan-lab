import { useEffect, useMemo, useState } from 'react'
import { ensureMasterData } from '../features/master/api/masterRepository'
import { fetchPLBaseData, fetchPLRows } from '../features/pl/api/plRepository'
import type { Organization, Version } from '../features/master/model/types'
import type { PLRow } from '../features/pl/model/types'

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value)
const formatNumber = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)

export function PLViewPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [years, setYears] = useState<number[]>([])
  const [organizationId, setOrganizationId] = useState('')
  const [versionId, setVersionId] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [rows, setRows] = useState<PLRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBase = async () => {
      setLoading(true)
      setError(null)
      try {
        await ensureMasterData()
        const base = await fetchPLBaseData()
        setOrganizations(base.organizations)
        setVersions(base.versions)
        setYears(base.availableYears.length > 0 ? base.availableYears : [new Date().getFullYear()])

        const allOrg = base.organizations.find((org) => org.code === 'ALL') ?? base.organizations[0]
        const defaultVersion = base.versions.find((v) => v.isDefault) ?? base.versions[0]
        const initialYear = (base.availableYears.length > 0 ? base.availableYears[base.availableYears.length - 1] : new Date().getFullYear())

        if (!allOrg || !defaultVersion) {
          setRows([])
          return
        }

        setOrganizationId(allOrg.id)
        setVersionId(defaultVersion.id)
        setYear(initialYear)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    void loadBase()
  }, [])

  useEffect(() => {
    if (!organizationId || !versionId || !year) return
    const loadRows = async () => {
      setLoading(true)
      setError(null)
      try {
        setRows(await fetchPLRows({ organizationId, versionId, year }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    void loadRows()
  }, [organizationId, versionId, year])

  const months = useMemo(() => Array.from({ length: 12 }, (_, idx) => `${year}-${String(idx + 1).padStart(2, '0')}`), [year])

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-medium">PL View</h2>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm text-slate-700">Organization
          <select className="mt-1 w-full rounded-md border px-2 py-2" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}>
            {organizations.map((org) => <option key={org.id} value={org.id}>{org.code ? `${org.code} - ${org.name}` : org.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-700">Version
          <select className="mt-1 w-full rounded-md border px-2 py-2" value={versionId} onChange={(e) => setVersionId(e.target.value)}>
            {versions.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-700">Year
          <select className="mt-1 w-full rounded-md border px-2 py-2" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      {loading && <p className="text-sm text-slate-600">Loading PL view...</p>}
      {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">Failed to load PL view: {error}</p>}

      {!loading && !error && rows.every((row) => row.cells.every((cell) => cell.amount === null)) && (
        <p className="text-sm text-slate-600">No PL data yet. Open a scenario detail page to generate line items.</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b text-slate-600">
                <th className="py-2">Account</th>
                {months.map((month) => <th key={month}>{month}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.accountId} className="border-b">
                  <td className="py-2">{row.accountCode} - {row.accountName}</td>
                  {row.cells.map((cell) => (
                    <td key={`${row.accountId}-${cell.yearMonth}`}>
                      {cell.amount === null ? '—' : row.accountType === 'metric' ? formatNumber(cell.amount) : formatCurrency(cell.amount)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

