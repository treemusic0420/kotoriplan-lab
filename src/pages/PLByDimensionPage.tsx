import { useEffect, useMemo, useState } from 'react'
import { listDimensions, listDimensionValues } from '../features/dimension/api/dimensionRepository'
import { aggregatePlByDimension } from '../features/pl/api/plFactRepository'
const accounts=['sales','variable_cost','contribution_margin','fixed_cost','operating_profit']
export function PLByDimensionPage(){const [dims,setDims]=useState<any[]>([]); const [dimId,setDimId]=useState(''); const [rows,setRows]=useState<any[]>([])
useEffect(()=>{void listDimensions().then(d=>{setDims(d); setDimId(d[0]?.id??'')})},[])
useEffect(()=>{if(!dimId)return; void aggregatePlByDimension({analysisDimensionId:dimId,version:'actual',year:2026,month:1,organizationKey:'all'}).then(setRows)},[dimId])
const cols=useMemo(()=>{const m=new Map<string,string>(); rows.forEach((r:any)=>m.set(r.analysis_dimension_value_id,r.analysis_dimension_values?.name??'')); return Array.from(m.entries())},[rows])
return <section className='rounded-xl bg-white p-6 shadow-sm'><h2 className='text-lg font-medium'>PL by Dimension</h2><select className='mt-2 rounded border px-2 py-1' value={dimId} onChange={e=>setDimId(e.target.value)}>{dims.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select><div className='mt-4 overflow-x-auto'><table className='min-w-[800px] text-sm'><thead><tr><th>Account</th>{cols.map(([id,n])=><th key={id}>{n}</th>)}<th>Total</th></tr></thead><tbody>{accounts.map(a=>{const by=cols.map(([id])=>rows.filter((r:any)=>r.analysis_dimension_value_id===id&&r.pl_facts.account_key===a).reduce((s:number,r:any)=>s+Number(r.pl_facts.amount),0)); const total=by.reduce((s,n)=>s+n,0); return <tr key={a}><td>{a}</td>{by.map((n,i)=><td key={i}>{n.toLocaleString()}</td>)}<td>{total.toLocaleString()}</td></tr>})}</tbody></table></div></section>}
