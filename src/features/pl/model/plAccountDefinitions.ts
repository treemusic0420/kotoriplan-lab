export type PlAccountType =
  | 'revenue'
  | 'contra_revenue'
  | 'variable_cost'
  | 'gross_profit'
  | 'contribution_margin'
  | 'fixed_cost'
  | 'sga'
  | 'operating_profit'

export type PlAccountDefinition = {
  accountKey: string
  accountName: string
  accountType: PlAccountType
  sortOrder: number
  isTotal: boolean
  isProfitLine: boolean
}

export const STANDARD_PL_ACCOUNTS: PlAccountDefinition[] = [
  { accountKey: 'net_sales', accountName: 'Net Sales', accountType: 'revenue', sortOrder: 1, isTotal: false, isProfitLine: false },
  { accountKey: 'sales_returns_discounts', accountName: 'Sales Returns / Discounts', accountType: 'contra_revenue', sortOrder: 2, isTotal: false, isProfitLine: false },
  { accountKey: 'total_revenue', accountName: 'Total Revenue', accountType: 'revenue', sortOrder: 3, isTotal: true, isProfitLine: false },
  { accountKey: 'material_cost', accountName: 'Material Cost', accountType: 'variable_cost', sortOrder: 4, isTotal: false, isProfitLine: false },
  { accountKey: 'purchase_cost', accountName: 'Purchase Cost', accountType: 'variable_cost', sortOrder: 5, isTotal: false, isProfitLine: false },
  { accountKey: 'direct_labor_cost', accountName: 'Direct Labor Cost', accountType: 'variable_cost', sortOrder: 6, isTotal: false, isProfitLine: false },
  { accountKey: 'outsourcing_cost', accountName: 'Outsourcing Cost', accountType: 'variable_cost', sortOrder: 7, isTotal: false, isProfitLine: false },
  { accountKey: 'payment_processing_fee', accountName: 'Payment Processing Fee', accountType: 'variable_cost', sortOrder: 8, isTotal: false, isProfitLine: false },
  { accountKey: 'shipping_fulfillment_cost', accountName: 'Shipping / Fulfillment Cost', accountType: 'variable_cost', sortOrder: 9, isTotal: false, isProfitLine: false },
  { accountKey: 'total_variable_cost', accountName: 'Total Variable Cost', accountType: 'variable_cost', sortOrder: 10, isTotal: true, isProfitLine: false },
  { accountKey: 'gross_profit', accountName: 'Gross Profit', accountType: 'gross_profit', sortOrder: 11, isTotal: true, isProfitLine: true },
  { accountKey: 'contribution_margin', accountName: 'Contribution Margin', accountType: 'contribution_margin', sortOrder: 12, isTotal: true, isProfitLine: true },
  { accountKey: 'salaries_wages', accountName: 'Salaries and Wages', accountType: 'fixed_cost', sortOrder: 13, isTotal: false, isProfitLine: false },
  { accountKey: 'rent', accountName: 'Rent', accountType: 'fixed_cost', sortOrder: 14, isTotal: false, isProfitLine: false },
  { accountKey: 'utilities', accountName: 'Utilities', accountType: 'fixed_cost', sortOrder: 15, isTotal: false, isProfitLine: false },
  { accountKey: 'software_subscription', accountName: 'Software Subscription', accountType: 'fixed_cost', sortOrder: 16, isTotal: false, isProfitLine: false },
  { accountKey: 'advertising_promotion', accountName: 'Advertising and Promotion', accountType: 'sga', sortOrder: 17, isTotal: false, isProfitLine: false },
  { accountKey: 'travel_transportation', accountName: 'Travel and Transportation', accountType: 'sga', sortOrder: 18, isTotal: false, isProfitLine: false },
  { accountKey: 'communication_expense', accountName: 'Communication Expense', accountType: 'sga', sortOrder: 19, isTotal: false, isProfitLine: false },
  { accountKey: 'professional_fees', accountName: 'Professional Fees', accountType: 'sga', sortOrder: 20, isTotal: false, isProfitLine: false },
  { accountKey: 'depreciation', accountName: 'Depreciation', accountType: 'fixed_cost', sortOrder: 21, isTotal: false, isProfitLine: false },
  { accountKey: 'other_sga', accountName: 'Other SG&A', accountType: 'sga', sortOrder: 22, isTotal: false, isProfitLine: false },
  { accountKey: 'total_fixed_cost', accountName: 'Total Fixed Cost', accountType: 'fixed_cost', sortOrder: 23, isTotal: true, isProfitLine: false },
  { accountKey: 'total_sga', accountName: 'Total SG&A', accountType: 'sga', sortOrder: 24, isTotal: true, isProfitLine: false },
  { accountKey: 'operating_profit', accountName: 'Operating Profit', accountType: 'operating_profit', sortOrder: 25, isTotal: true, isProfitLine: true }
]

export const PL_ACCOUNT_BY_KEY = new Map(STANDARD_PL_ACCOUNTS.map((v) => [v.accountKey, v]))
