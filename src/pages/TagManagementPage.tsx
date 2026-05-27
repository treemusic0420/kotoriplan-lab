import { useEffect, useState } from 'react'
import { createTag, deleteTag, listTags, updateTag, type Tag } from '../features/tag/api/tagRepository'
import { WhenToUseCard } from '../shared/ui/WhenToUseCard'

export function TagManagementPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try { setTags(await listTags()) } catch (e) { setError(e instanceof Error ? e.message : 'Unknown error') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const onCreate = async () => {
    if (!name.trim()) return
    setSaving(true); setError(null)
    try { await createTag(name.trim()); setName(''); await load() } catch (e) { setError(e instanceof Error ? e.message : 'Unknown error') } finally { setSaving(false) }
  }

  return <section className="rounded-xl bg-white p-6 shadow-sm">
    <h2 className="text-lg font-medium">Scenario Labels</h2>
    <p className="mt-1 text-sm text-slate-600">Create, edit, and delete labels for organizing scenarios.</p>
    <WhenToUseCard bullets={[
      'Use this view to organize scenarios with simple labels.',
      'In practice, labels help separate scenarios by purpose, such as budget, forecast, pricing review, cost reduction, or management presentation.',
      'Labels are not accounting dimensions; they are mainly used to organize scenario work.'
    ]} note='For PL analysis dimensions such as Product, Customer, Channel, and Region, use Analysis Dimensions instead.' />
    <div className="mt-4 flex gap-2">
      <input className="flex-1 rounded-md border px-3 py-2" placeholder="New label name" value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => void onCreate()} disabled={saving} className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50">{saving ? 'Saving...' : 'Add Label'}</button>
    </div>
    {loading && <p className="mt-4 text-sm text-slate-600">Loading labels...</p>}
    {error && <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!loading && !error && tags.length === 0 && <p className="mt-4 text-sm text-slate-600">No labels yet.</p>}
    <div className="mt-4 space-y-2">
      {tags.map((tag) => <TagRow key={tag.id} tag={tag} onUpdated={load} onError={setError} />)}
    </div>
  </section>
}

function TagRow({ tag, onUpdated, onError }: { tag: Tag; onUpdated: () => Promise<void>; onError: (v: string | null) => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(tag.name)
  const [saving, setSaving] = useState(false)
  const save = async () => { setSaving(true); onError(null); try { await updateTag(tag.id, name.trim()); setEditing(false); await onUpdated() } catch (e) { onError(e instanceof Error ? e.message : 'Unknown error') } finally { setSaving(false) } }
  const remove = async () => { setSaving(true); onError(null); try { await deleteTag(tag.id); await onUpdated() } catch (e) { onError(e instanceof Error ? e.message : 'Unknown error') } finally { setSaving(false) } }
  return <div className="flex items-center gap-2 rounded-lg border p-3">
    {editing ? <input className="flex-1 rounded border px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} /> : <p className="flex-1 text-sm">{tag.name}</p>}
    {editing ? <button className="rounded border px-2 py-1 text-xs" disabled={saving} onClick={() => void save()}>Save</button> : <button className="rounded border px-2 py-1 text-xs" onClick={() => setEditing(true)}>Edit</button>}
    <button className="rounded border px-2 py-1 text-xs" disabled={saving} onClick={() => void remove()}>Delete</button>
  </div>
}