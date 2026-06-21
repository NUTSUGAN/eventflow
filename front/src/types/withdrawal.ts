export type WithdrawalStatus =
  | 'pending'
  | 'approved'
  | 'paid'
  | 'rejected'
  | 'cancelled'

export type WithdrawalEventSummary = {
  id: number | null
  title: string | null
  startDatetime: string | null
  endDatetime: string | null
  withdrawalFeePercent: string | null
}

export type WithdrawalOrganizerSummary = {
  id: number | null
  fullName: string | null
  email: string | null
}

export type WithdrawalPayoutType = 'bank' | 'mobile_money'

export type WithdrawalPayoutSnapshot = {
  type: WithdrawalPayoutType
  label: string | null
  bank: {
    holderName: string | null
    iban: string | null
    bic: string | null
    bankName: string | null
  }
  mobileMoney: {
    name: string | null
    phone: string | null
    provider: string | null
    country: string | null
  }
}

export type WithdrawalAmounts = {
  grossAmount: string
  feePercent: string
  feeAmount: string
  netAmount: string
  currency: string
  paidOrders: number
  ticketsSold: number
}

export type WithdrawalSummary = {
  id: number
  status: WithdrawalStatus
  grossAmount: string
  feePercent: string
  feeAmount: string
  netAmount: string
  currency: string
  adminNote: string | null
  paymentReference: string | null
  payout: WithdrawalPayoutSnapshot | null
  requestedAt: string | null
  reviewedAt: string | null
  paidAt: string | null
  updatedAt: string | null
  event: WithdrawalEventSummary
  organizer: WithdrawalOrganizerSummary
}

export type OrganizerWithdrawalCandidate = {
  event: WithdrawalEventSummary
  amounts: WithdrawalAmounts
  withdrawal: WithdrawalSummary | null
  canRequest: boolean
}

export type OrganizerWithdrawalsResponse = {
  hasActivePayoutAccount: boolean
  items: OrganizerWithdrawalCandidate[]
}

export type OrganizerWithdrawalCreateResponse = {
  message: string
  withdrawal: WithdrawalSummary
}

export type OrganizerWithdrawalResponse = {
  withdrawal: WithdrawalSummary
}

export type AdminWithdrawalSettings = {
  defaultFeePercent: string
  updatedAt: string | null
}

export type AdminWithdrawalsResponse = {
  settings: AdminWithdrawalSettings
  items: WithdrawalSummary[]
}

export type AdminWithdrawalResponse = {
  withdrawal: WithdrawalSummary
}

export type AdminWithdrawalUpdatePayload = {
  status?: WithdrawalStatus
  feePercent?: string
  adminNote?: string
  paymentReference?: string
}

export type AdminWithdrawalUpdateResponse = {
  message: string
  withdrawal: WithdrawalSummary
}

export type AdminWithdrawalSettingsResponse = {
  message: string
  settings: AdminWithdrawalSettings
}
