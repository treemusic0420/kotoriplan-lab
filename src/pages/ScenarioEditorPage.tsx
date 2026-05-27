import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { createScenario } from '../features/scenario/api/scenarioRepository'
import { SCENARIO_STATUS_OPTIONS, type ScenarioFormValues } from '../features/scenario/model/types'
import { hasSupabaseEnv, supabaseEnvErrorMessage } from '../infra/supabase/client'

const schema = z.object({
  name: z.string().trim().min(1, 'Scenario name is required').max(100),
  targetYearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Target month must be YYYY-MM'),
  unitPrice: z.coerce.number().finite().min(0, 'Unit price must be 0 or more'),
  quantity: z.coerce.number().finite().min(0, 'Quantity must be 0 or more'),
  variableCostPerUnit: z.coerce.number().finite().min(0, 'Variable cost per unit must be 0 or more'),
  fixedCost: z.coerce.number().finite().min(0, 'Fixed cost must be 0 or more'),
  note: z.string().trim().max(2000).optional().or(z.literal('')),
  status: z.enum(['draft', 'final']),
})

const numberParser = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  if (value.trim() === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function ScenarioEditorPage() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const defaultMonth = useMemo(() => new Date().toISOString().slice(0, 7), [])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ScenarioFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      targetYearMonth: defaultMonth,
      unitPrice: 0,
      quantity: 0,
      variableCostPerUnit: 0,
      fixedCost: 0,
      note: '',
      status: 'draft',
    },
  })

  const onSubmit = async (values: ScenarioFormValues) => {
    setSubmitError(null)
    try {
      const created = await createScenario(values)
      navigate(`/scenarios/${created.id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save scenario'
      console.error('[scenario] save failed', message)
      setSubmitError(`Failed to save scenario: ${message}`)
    }
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium">Scenario Editor</h2>
      <p className="mt-1 text-sm text-slate-600">Create a CVP scenario and save it to Supabase.</p>
      {!hasSupabaseEnv && (
        <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">{supabaseEnvErrorMessage}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4">
        <label className="grid gap-1 text-sm">
          <span>Scenario name</span>
          <input className="rounded-md border px-3 py-2" {...register('name')} />
          {errors.name && <span className="text-xs text-rose-600">{errors.name.message}</span>}
        </label>

        <label className="grid gap-1 text-sm">
          <span>Target year/month</span>
          <input type="month" className="rounded-md border px-3 py-2" {...register('targetYearMonth')} />
          {errors.targetYearMonth && <span className="text-xs text-rose-600">{errors.targetYearMonth.message}</span>}
        </label>

        {[
          ['unitPrice', 'Unit price'],
          ['quantity', 'Quantity'],
          ['variableCostPerUnit', 'Variable cost per unit'],
          ['fixedCost', 'Fixed cost'],
        ].map(([field, label]) => (
          <label key={field} className="grid gap-1 text-sm">
            <span>{label}</span>
            <input type="number" step="0.01" className="rounded-md border px-3 py-2" {...register(field as keyof ScenarioFormValues, { setValueAs: numberParser })} />
            {errors[field as keyof ScenarioFormValues] && (
              <span className="text-xs text-rose-600">{String(errors[field as keyof ScenarioFormValues]?.message ?? '')}</span>
            )}
          </label>
        ))}

        <label className="grid gap-1 text-sm">
          <span>Note</span>
          <textarea rows={4} className="rounded-md border px-3 py-2" {...register('note')} />
        </label>

        <label className="grid gap-1 text-sm">
          <span>Status</span>
          <select className="rounded-md border px-3 py-2" {...register('status')}>
            {SCENARIO_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        {submitError && <p className="rounded-md bg-rose-50 p-2 text-sm text-rose-700">{submitError}</p>}

        <button type="submit" disabled={isSubmitting} className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60">
          {isSubmitting ? 'Saving...' : 'Save scenario'}
        </button>
      </form>
    </section>
  )
}
