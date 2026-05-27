import { useEffect, useMemo, useState } from 'react'
import { ensureMasterData } from '../features/master/api/masterRepository'
import { fetchPLBaseData, fetchPLRows } from '../features/pl/api/plRepository'
import { listDimensions, listDimensionValues } from '../features/dimension/api/dimensionRepository'
import { accountMeta, aggregateMonthlyPl, orderedAccountKeys } from '../features/pl/api/plFactRepository'

const fmt=(n:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n)
const bold=(key:string)=>{const m=accountMeta(key);return Boolean(m?.isTotal||m?.isProfitLine)}

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
  {rows.length===0?<p className='mt-3 text-sm text-slate-600'>No PL facts found. Load sample PL data to start analysis.</p>:<div className='mt-3 overflow-x-auto'><table className='min-w-[1000px] text-sm'><thead><tr><th>Account</th>{months.map(m=><th key={m}>{m}</th>)}</tr></thead><tbody>{rows.map((r:any)=><tr key={r.accountCode} className={bold(r.accountCode)?'font-semibold':''}><td>{r.accountName}</td>{r.cells.map((c:any)=>{const v=Number(c.amount??0);return <td key={c.yearMonth} className={v<0?'text-rose-600':''}>{fmt(v)}</td>})}</tr>)}</tbody></table></div>}
  </section>
}
