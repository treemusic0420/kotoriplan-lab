import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { createScenario, fetchScenarioById, updateScenario } from '../features/scenario/api/scenarioRepository'
import { SCENARIO_STATUS_OPTIONS, type ScenarioFormValues } from '../features/scenario/model/types'
import { hasSupabaseEnv, supabaseEnvErrorMessage } from '../infra/supabase/client'

const schema = z.object({ name: z.string().trim().min(1).max(100), targetYearMonth: z.string().regex(/^\d{4}-\d{2}$/), unitPrice: z.coerce.number().finite().min(0), quantity: z.coerce.number().finite().min(0), variableCostPerUnit: z.coerce.number().finite().min(0), fixedCost: z.coerce.number().finite().min(0), note: z.string().trim().max(2000).optional().or(z.literal('')), status: z.enum(['draft', 'final']) })
const numberParser = (value: unknown) => (typeof value === 'number' ? (Number.isFinite(value) ? value : 0) : typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)) ? Number(value) : 0)

export function ScenarioEditorPage() {
  const navigate = useNavigate(); const { id } = useParams<{ id: string }>(); const isEdit = Boolean(id)
  const [submitError, setSubmitError] = useState<string | null>(null); const [loading, setLoading] = useState(false)
  const defaultMonth = useMemo(() => new Date().toISOString().slice(0, 7), [])
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ScenarioFormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', targetYearMonth: defaultMonth, unitPrice: 0, quantity: 0, variableCostPerUnit: 0, fixedCost: 0, note: '', status: 'draft' } })

  useEffect(() => { if (!id) return; void (async()=>{ setLoading(true); try { const sc = await fetchScenarioById(id); if (sc) reset(sc) } finally { setLoading(false) } })() }, [id, reset])

  const onSubmit = async (values: ScenarioFormValues) => { setSubmitError(null); try { const saved = isEdit && id ? await updateScenario(id, values) : await createScenario(values); navigate(`/scenarios/${saved.id}`) } catch (error) { setSubmitError(`${isEdit ? 'Failed to update scenario' : 'Failed to save scenario'}: ${error instanceof Error ? error.message : 'Unknown error'}`) } }

  return <section className="rounded-xl bg-white p-6 shadow-sm"><h2 className="text-lg font-medium">{isEdit ? 'Scenario Editor' : 'Scenario Editor'}</h2>{loading && <p className='mt-2 text-sm text-slate-600'>Loading scenario...</p>} {!hasSupabaseEnv && <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">{supabaseEnvErrorMessage}</p>}<form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4">{[['name','Scenario name','text'],['targetYearMonth','Target year/month','month'],['unitPrice','Unit price','number'],['quantity','Quantity','number'],['variableCostPerUnit','Variable cost per unit','number'],['fixedCost','Fixed cost','number']] .map(([field,label,type]) => <label key={field} className='grid gap-1 text-sm'><span>{label}</span><input type={type} step={type==='number'?'0.01':undefined} className='rounded-md border px-3 py-2' {...register(field as keyof ScenarioFormValues, type==='number'?{setValueAs:numberParser}:undefined)} />{errors[field as keyof ScenarioFormValues] && <span className='text-xs text-rose-600'>{String(errors[field as keyof ScenarioFormValues]?.message ?? '')}</span>}</label>)}<label className='grid gap-1 text-sm'><span>Note</span><textarea rows={4} className='rounded-md border px-3 py-2' {...register('note')} /></label><label className='grid gap-1 text-sm'><span>Status</span><select className='rounded-md border px-3 py-2' {...register('status')}>{SCENARIO_STATUS_OPTIONS.map((status)=><option key={status} value={status}>{status}</option>)}</select></label>{submitError && <p className='rounded-md bg-rose-50 p-2 text-sm text-rose-700'>{submitError}</p>}<button type='submit' disabled={isSubmitting} className='rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60'>{isSubmitting ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update scenario' : 'Save scenario')}</button></form></section>
}
