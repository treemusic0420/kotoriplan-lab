import { getSupabaseClient } from '../../../infra/supabase/client'
import type { Account, Organization, Version } from '../model/types'

const formatSupabaseError = (
  operation: string,
  status: number,
  error: { message: string; code?: string; details?: string | null },
) => {
  const details = [
    `operation=${operation}`,
    `status=${status}`,
    `message=${error.message}`,
    error.code ? `code=${error.code}` : null,
    error.details ? `details=${error.details}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  console.error('[supabase] request failed', details)
  return `Supabase ${operation} failed (status ${status}): ${error.message}`
}

const requireUserId = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser()
  if (error) throw new Error(`Failed to read auth user: ${error.message}`)
  if (!data.user) throw new Error('Authentication required')
  return data.user.id
}

type AccountRow = {
  id: string
  owner_user_id: string
  code: string
  name: string
  account_type: Account['accountType']
  sort_order: number
  created_at: string
  updated_at: string
}

type OrganizationRow = {
  id: string
  owner_user_id: string
  name: string
  code: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

type VersionRow = {
  id: string
  owner_user_id: string
  name: string
  version_type: Version['versionType']
  sort_order: number
  is_default: boolean
  created_at: string
  updated_at: string
}

const toAccount = (row: AccountRow): Account => ({
  id: row.id,
  ownerUserId: row.owner_user_id,
  code: row.code,
  name: row.name,
  accountType: row.account_type,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toOrganization = (row: OrganizationRow): Organization => ({
  id: row.id,
  ownerUserId: row.owner_user_id,
  name: row.name,
  code: row.code,
  sortOrder: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toVersion = (row: VersionRow): Version => ({
  id: row.id,
  ownerUserId: row.owner_user_id,
  name: row.name,
  versionType: row.version_type,
  sortOrder: row.sort_order,
  isDefault: row.is_default,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export async function fetchAccounts(): Promise<Account[]> {
  const supabase = getSupabaseClient()
  const ownerUserId = await requireUserId()
  const { data, error, status } = await supabase
    .from('accounts')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('sort_order', { ascending: true })
    .returns<AccountRow[]>()
  if (error) throw new Error(formatSupabaseError('accounts list', status, error))
  return data.map(toAccount)
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const supabase = getSupabaseClient()
  const ownerUserId = await requireUserId()
  const { data, error, status } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('sort_order', { ascending: true })
    .returns<OrganizationRow[]>()
  if (error) throw new Error(formatSupabaseError('organizations list', status, error))
  return data.map(toOrganization)
}

export async function fetchVersions(): Promise<Version[]> {
  const supabase = getSupabaseClient()
  const ownerUserId = await requireUserId()
  const { data, error, status } = await supabase
    .from('versions')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .order('sort_order', { ascending: true })
    .returns<VersionRow[]>()
  if (error) throw new Error(formatSupabaseError('versions list', status, error))
  return data.map(toVersion)
}

export async function ensureMasterData(): Promise<void> {
  const supabase = getSupabaseClient()
  const ownerUserId = await requireUserId()

  const { error: accountsError, status: accountsStatus } = await (supabase.from('accounts') as any).upsert(
    [
      { owner_user_id: ownerUserId, code: 'SALES', name: 'Sales', account_type: 'revenue', sort_order: 10 },
      { owner_user_id: ownerUserId, code: 'VARIABLE_COST', name: 'Variable Cost', account_type: 'variable_cost', sort_order: 20 },
      { owner_user_id: ownerUserId, code: 'FIXED_COST', name: 'Fixed Cost', account_type: 'fixed_cost', sort_order: 30 },
      { owner_user_id: ownerUserId, code: 'QUANTITY', name: 'Quantity', account_type: 'metric', sort_order: 40 },
      { owner_user_id: ownerUserId, code: 'UNIT_PRICE', name: 'Unit Price', account_type: 'metric', sort_order: 50 },
    ],
    { onConflict: 'owner_user_id,code', ignoreDuplicates: true },
  )
  if (accountsError) throw new Error(formatSupabaseError('accounts ensure', accountsStatus, accountsError))

  const { error: organizationsError, status: organizationsStatus } = await (supabase.from('organizations') as any).upsert(
    [{ owner_user_id: ownerUserId, code: 'ALL', name: 'All', sort_order: 10 }],
    { onConflict: 'owner_user_id,code', ignoreDuplicates: true },
  )
  if (organizationsError) throw new Error(formatSupabaseError('organizations ensure', organizationsStatus, organizationsError))

  const { error: versionsError, status: versionsStatus } = await (supabase.from('versions') as any).upsert(
    [
      { owner_user_id: ownerUserId, name: 'Actual', version_type: 'actual', sort_order: 10, is_default: true },
      { owner_user_id: ownerUserId, name: 'Budget', version_type: 'budget', sort_order: 20, is_default: false },
      { owner_user_id: ownerUserId, name: 'Forecast', version_type: 'forecast', sort_order: 30, is_default: false },
    ],
    { onConflict: 'owner_user_id,name', ignoreDuplicates: true },
  )
  if (versionsError) throw new Error(formatSupabaseError('versions ensure', versionsStatus, versionsError))
}
