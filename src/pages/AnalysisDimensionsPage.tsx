import { useEffect, useState } from 'react'
import { createDimension, createDimensionValue, deleteDimension, deleteDimensionValue, listDimensions, listDimensionValues } from '../features/dimension/api/dimensionRepository'
import { getSamplePlStatus, inspectSamplePlData, loadSamplePlData, resetSamplePlData } from '../features/pl/api/plFactRepository'

export function AnalysisDimensionsPage() {
  const [dims, setDims] = useState<any[]>([])
  const [vals, setVals] = useState<Record<string, any[]>>({})
  const [name, setName] = useState('')
  const [keyValue, setKeyValue] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [status, setStatus] = useState<{ rows: number; lastLoadedAt: string | null }>({ rows: 0, lastLoadedAt: null })

  const load = async () => {
    try {
      const d = await listDimensions()
      setDims(d)
      const next: Record<string, any[]> = {}
      for (const x of d) next[x.id] = await listDimensionValues(x.id)
      setVals(next)
      setStatus(await getSamplePlStatus())
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  const handleLoadSample = async () => {
    setMsg(null)
    setErr(null)
    try {
      const result = await loadSamplePlData()
      await load()
      if (!result.loadedFacts || result.loadedFacts <= 0) throw new Error('Sample PL facts were not loaded.')
      setMsg(`Sample PL Data loaded successfully. Loaded ${result.loadedFacts} PL facts.`)
    } catch (e) {
      setMsg(null)
      setErr(`Failed to load sample PL data: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  const handleResetSample = async () => {
    setMsg(null)
    setErr(null)
    try {
      const result = await resetSamplePlData()
      await load()
      if (!result.loadedFacts || result.loadedFacts <= 0) throw new Error('Sample PL facts were not loaded after reset.')
      setMsg(`Sample PL Data reset and reloaded successfully. Loaded ${result.loadedFacts} PL facts.`)
    } catch (e) {
      setMsg(null)
      setErr(`Failed to reset sample PL data: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return <section className='rounded-xl bg-white p-6 shadow-sm'><h2 className='text-lg font-medium'>Analysis Dimensions</h2><p className='mt-1 text-sm text-slate-600'>Manage analysis axes used for PL analysis, such as Product, Customer, Channel, and Region.</p>
<div className='mt-3 flex gap-2'><input placeholder='Dimension name' className='rounded border px-2 py-1' value={name} onChange={e => setName(e.target.value)} /><input placeholder='Dimension key' className='rounded border px-2 py-1' value={keyValue} onChange={e => setKeyValue(e.target.value)} /><button className='rounded bg-slate-900 px-3 py-1 text-white' onClick={() => void createDimension({ name, key: keyValue }).then(load)}>Add Dimension</button></div>
<div className='mt-3 flex gap-2'><button className='rounded border px-3 py-1' onClick={() => void handleLoadSample()}>Load Sample PL Data</button><button className='rounded border px-3 py-1' onClick={() => void handleResetSample()}>Reset Sample PL Data</button><button className='rounded border px-3 py-1' onClick={() => void inspectSamplePlData().then((s) => { setErr(null); setMsg(`Debug checked: user=${s.userId}, sample facts=${s.factCount}, versions=${s.versions.join(',')}`) }).catch((e) => setErr(e instanceof Error ? e.message : 'Unknown error'))}>Debug Sample PL</button></div>
<p className='mt-2 text-xs text-slate-500'>Sample PL Facts loaded: {status.rows} rows{status.lastLoadedAt ? ` / Last loaded: ${new Date(status.lastLoadedAt).toLocaleString()}` : ''}</p>{msg && <p className='mt-2 text-sm text-emerald-700'>{msg}</p>}{err && <p className='mt-3 text-sm text-rose-600'>{err}</p>}{dims.length === 0 && <p className='mt-3 text-sm text-slate-600'>No analysis dimensions yet.</p>}
<div className='mt-4 space-y-3'>{dims.map(d => <div key={d.id} className='rounded border p-3'><div className='flex items-center justify-between'><strong>{d.name} ({d.key})</strong><button className='text-xs' onClick={() => void deleteDimension(d.id).then(load)}>Delete Dimension</button></div><div className='mt-2 space-y-1'>{(vals[d.id] ?? []).map(v => <div key={v.id} className='flex justify-between text-sm'><span>{v.name}</span><button onClick={() => void deleteDimensionValue(v.id).then(load)}>Delete</button></div>)}</div><AddValue dimensionId={d.id} onDone={load} /></div>)}</div></section>
}

function AddValue({ dimensionId, onDone }: { dimensionId: string; onDone: () => Promise<void> }) {
  const [name, setName] = useState('')
  return <div className='mt-2 flex gap-2'><input className='rounded border px-2 py-1' placeholder='Value name' value={name} onChange={e => setName(e.target.value)} /><button className='rounded border px-2 py-1' onClick={() => void createDimensionValue({ analysisDimensionId: dimensionId, name }).then(() => { setName(''); return onDone() })}>Add Value</button></div>
}
