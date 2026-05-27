import { Fragment, useEffect, useMemo, useState } from 'react'
import { ensureMasterData } from '../features/master/api/masterRepository'
import { fetchPLBaseData, fetchPLRows } from '../features/pl/api/plRepository'
import { listDimensions, listDimensionValues } from '../features/dimension/api/dimensionRepository'
import { accountMeta, aggregateMonthlyPl, orderedAccountKeys } from '../features/pl/api/plFactRepository'

const fmt = (n: number) => {
  if (n === 0) return '—'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n))
}
const emphasize = (key: string) => {
  const m = accountMeta(key)
  if (!m) return ''
  if (key === 'operating_profit') return 'font-bold bg-slate-200'
  if (m.isTotal || m.isProfitLine) return 'font-semibold bg-slate-50'
  return ''
}
const SECTION_BY_ACCOUNT: Array<{ title: string, keys: string[] }> = [
  { title: 'Revenue', keys: ['net_sales', 'sales_returns_discounts', 'total_revenue'] },
  { title: 'Variable Costs', keys: ['material_cost', 'purchase_cost', 'direct_labor_cost', 'outsourcing_cost', 'payment_processing_fee', 'shipping_fulfillment_cost', 'total_variable_cost'] },
  { title: 'Gross / Contribution', keys: ['gross_profit', 'contribution_margin'] },
  { title: 'Operating Expenses', keys: ['salaries_wages', 'rent', 'utilities', 'software_subscription', 'advertising_promotion', 'travel_transportation', 'communication_expense', 'professional_fees', 'depreciation', 'other_sga', 'total_fixed_cost', 'total_sga'] },
  { title: 'Profit', keys: ['operating_profit'] }
]

export function PLViewPage(){
  const [source,setSource]=useState<'scenario_forecast'|'sample_pl_facts'>('sample_pl_facts')
  const [version,setVersion]=useState('actual'); const [year,setYear]=useState(2026); const [organization,setOrganization]=useState('all')
  const [dimensions,setDimensions]=useState<any[]>([]); const [dimensionId,setDimensionId]=useState(''); const [dimensionValueId,setDimensionValueId]=useState(''); const [values,setValues]=useState<any[]>([])
  const [rows,setRows]=useState<any[]>([]); const [error,setError]=useState<string|null>(null)
  const [orgId,setOrgId]=useState(''); const [versionId,setVersionId]=useState('')
  useEffect(()=>{void listDimensions().then(setDimensions); void ensureMasterData().then(fetchPLBaseData).then(b=>{setOrgId(b.organizations[0]?.id??''); setVersionId(b.versions[0]?.id??'')})},[])
  useEffect(()=>{if(!dimensionId){setValues([]);return} void listDimensionValues(dimensionId).then(setValues)},[dimensionId])
  useEffect(()=>{const run=async()=>{try{if(source==='scenario_forecast'){if(!orgId||!versionId)return; setRows(await fetchPLRows({organizationId:orgId,versionId,year}))} else {const data=await aggregateMonthlyPl({version,year,organizationKey:organization,analysisDimensionId:dimensionId||undefined,analysisDimensionValueId:dimensionValueId||undefined}); const months=Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`); const accounts=orderedAccountKeys(); setRows(accounts.map(a=>({accountCode:a,accountName:accountMeta(a)?.accountName??a,cells:months.map(m=>({yearMonth:m,amount:data.filter((r:any)=>r.account_key===a && String(r.target_month).slice(0,7)===m).reduce((s:number,r:any)=>s+Number(r.amount),0)}))}))) }}catch(e){setError(e instanceof Error?e.message:'Unknown error')}}; void run()},[source,version,year,organization,dimensionId,dimensionValueId,orgId,versionId])
  const months=useMemo(()=>Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`),[year])
  return <section className='rounded-xl bg-white p-6 shadow-sm'><h2 className='text-lg font-medium'>PL View</h2>
  <div className='mt-3 grid gap-3 md:grid-cols-3'><label>Data Source<select className='w-full rounded border' value={source} onChange={e=>setSource(e.target.value as any)}><option value='sample_pl_facts'>Sample PL Facts</option><option value='scenario_forecast'>Scenario Forecast</option></select></label><label>Version<select className='w-full rounded border' value={version} onChange={e=>setVersion(e.target.value)}><option>actual</option><option>budget</option><option>forecast</option></select></label><label>Year<input className='w-full rounded border' value={year} onChange={e=>setYear(Number(e.target.value))}/></label><label>Analysis Dimension<select className='w-full rounded border' value={dimensionId} onChange={e=>setDimensionId(e.target.value)}><option value=''>All</option>{dimensions.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label><label>Dimension Value<select className='w-full rounded border' value={dimensionValueId} onChange={e=>setDimensionValueId(e.target.value)}><option value=''>All</option>{values.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label></div>
  {error&&<p className='mt-3 text-rose-600'>Failed to load PL facts: {error}</p>}
  {rows.length===0?<p className='mt-3 text-sm text-slate-600'>No PL facts found. Load sample PL data to start analysis.</p>:<div className='mt-3 overflow-x-auto'><table className='min-w-[1000px] text-sm'><thead className='sticky top-0 bg-white'><tr><th className='sticky left-0 z-10 bg-white text-left'>Account</th>{months.map(m=><th key={m} className='text-right'>{m}</th>)}</tr></thead><tbody>{SECTION_BY_ACCOUNT.map((section)=><Fragment key={section.title}><tr className='bg-slate-100/80'><td colSpan={months.length+1} className='px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600'>{section.title}</td></tr>{section.keys.map((key)=>{const row=rows.find((r:any)=>r.accountCode===key); if(!row)return null; return <tr key={row.accountCode} className={emphasize(row.accountCode)}><td className='sticky left-0 bg-white pl-4'>{row.accountName}</td>{row.cells.map((c:any)=>{const v=Number(c.amount??0);return <td key={c.yearMonth} className={`text-right ${v<0?'text-rose-600':''}`}>{fmt(v)}</td>})}</tr>})}</Fragment>)}</tbody></table></div>}
  </section>
}
