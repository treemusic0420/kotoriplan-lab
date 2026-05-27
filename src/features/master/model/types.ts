export type AccountType = 'revenue' | 'variable_cost' | 'fixed_cost' | 'metric'
export type VersionType = 'actual' | 'budget' | 'forecast' | 'scenario'

export type Account = {
  id: string
  ownerUserId: string
  code: string
  name: string
  accountType: AccountType
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type Organization = {
  id: string
  ownerUserId: string
  name: string
  code: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type Version = {
  id: string
  ownerUserId: string
  name: string
  versionType: VersionType
  sortOrder: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}
