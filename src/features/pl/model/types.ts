import type { AccountType } from '../../master/model/types'

export type PLViewFilters = {
  organizationId: string
  versionId: string
  year: number
}

export type PLCell = {
  yearMonth: string
  amount: number | null
}

export type PLRow = {
  accountId: string
  accountCode: string
  accountName: string
  accountType: AccountType
  cells: PLCell[]
}

