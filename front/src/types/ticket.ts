export type TicketPaymentSummary = {
  provider: string | null
  providerPaymentId: string | null
  amount: number
  currency: string | null
  status: string | null
  paidAt: string | null
}

export type TicketOrderSummary = {
  id: number | null
  reference: string | null
  status: string | null
  createdAt: string | null
  total: number
  currency: string
  payment: TicketPaymentSummary | null
}

export type TicketEventSummary = {
  id: number | null
  title: string | null
  startsAt: string | null
  endsAt: string | null
  city: string | null
  venue: string | null
  coverImageUrl: string | null
}

export type TicketTypeSummary = {
  id: number | null
  name: string | null
  description: string | null
}

export type TicketRecord = {
  id: number
  displayCode: string
  status: string | null
  issuedAt: string | null
  qrToken: string | null
  ticketType: TicketTypeSummary
  order: TicketOrderSummary
  event: TicketEventSummary
}

export type MyTicketsResponse = {
  tickets: TicketRecord[]
}

export type MyTicketResponse = {
  ticket: TicketRecord
}
