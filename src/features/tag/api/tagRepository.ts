import { getSupabaseClient } from '../../../infra/supabase/client'

export type Tag = { id: string; name: string; createdAt: string; updatedAt: string }
type TagRow = { id: string; name: string; created_at: string; updated_at: string }
const toTag = (row: TagRow): Tag => ({ id: row.id, name: row.name, createdAt: row.created_at, updatedAt: row.updated_at })

const requireUserId = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser()
  if (error) throw new Error(`Failed to read auth user: ${error.message}`)
  if (!data.user) throw new Error('Authentication required')
  return data.user.id
}

export async function listTags(): Promise<Tag[]> {
  const ownerUserId = await requireUserId()
  const { data, error } = await getSupabaseClient().from('tags').select('id,name,created_at,updated_at').eq('owner_user_id', ownerUserId).order('name').returns<TagRow[]>()
  if (error) throw new Error(`Failed to list tags: ${error.message}`)
  return (data ?? []).map(toTag)
}
export async function createTag(name: string): Promise<Tag> {
  const ownerUserId = await requireUserId()
  const { data, error } = await (getSupabaseClient().from('tags') as any).insert({ name, owner_user_id: ownerUserId }).select('id,name,created_at,updated_at').single()
  if (error) throw new Error(`Failed to create tag: ${error.message}`)
  return toTag(data as TagRow)
}
export async function updateTag(id: string, name: string): Promise<Tag> {
  const ownerUserId = await requireUserId()
  const { data, error } = await (getSupabaseClient().from('tags') as any).update({ name }).eq('id', id).eq('owner_user_id', ownerUserId).select('id,name,created_at,updated_at').single()
  if (error) throw new Error(`Failed to update tag: ${error.message}`)
  return toTag(data as TagRow)
}
export async function deleteTag(id: string): Promise<void> {
  const ownerUserId = await requireUserId()
  const { error } = await getSupabaseClient().from('tags').delete().eq('id', id).eq('owner_user_id', ownerUserId)
  if (error) throw new Error(`Failed to delete tag: ${error.message}`)
}
