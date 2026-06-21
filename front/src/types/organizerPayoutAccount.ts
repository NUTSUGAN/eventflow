export type OrganizerPayoutType = 'bank' | 'mobile_money'

export type OrganizerPayoutBank = {
  holderName: string | null
  iban: string | null
  bic: string | null
  bankName: string | null
}

export type OrganizerPayoutMobileMoney = {
  name: string | null
  phone: string | null
  provider: string | null
  country: string | null
}

export type OrganizerPayoutAccount = {
  id: number
  type: OrganizerPayoutType
  label: string | null
  isActive: boolean
  createdAt: string | null
  replacedAt: string | null
  bank: OrganizerPayoutBank
  mobileMoney: OrganizerPayoutMobileMoney
}

export type OrganizerPayoutAccountPayload =
  | {
      type: 'bank'
      label?: string
      holderName: string
      iban: string
      bic: string
      bankName?: string
    }
  | {
      type: 'mobile_money'
      label?: string
      mobileMoneyName: string
      mobileMoneyPhone: string
      mobileMoneyProvider: string
      mobileMoneyCountry: string
    }

export type OrganizerPayoutAccountResponse = {
  active: OrganizerPayoutAccount | null
  history: OrganizerPayoutAccount[]
}

export type OrganizerPayoutAccountUpdateResponse = OrganizerPayoutAccountResponse & {
  message: string
}
