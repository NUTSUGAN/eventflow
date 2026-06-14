export type OrderPreparationPayload = {
  items: Array<{
    ticketTypeId: number
    quantity: number
  }>
}

export type PreparedOrderItem = {
  ticketTypeId: number
  ticketName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  availableStockAfterPreparation: number | null
}

export type PreparedOrder = {
  id: number
  reference: string
  status: string
  orderType: string
  currency: string
  subtotal: number
  total: number
  createdAt: string | null
  event: {
    id: number | null
    title: string | null
    startsAt?: string | null
    endsAt?: string | null
    city?: string | null
    venue?: string | null
  }
  items: PreparedOrderItem[]
  payment: OrderPayment | null
  canStartCheckout: boolean
}

export type OrderPreparationResponse = {
  message: string
  order: PreparedOrder
}

export type OrderPayment = {
  provider: string | null
  providerPaymentId: string | null
  amount: number
  currency: string | null
  status: string | null
  paidAt: string | null
}

export type OrderSummaryResponse = {
  order: PreparedOrder
}

export type PendingOrdersResponse = {
  orders: PreparedOrder[]
}

export type OrderCheckoutSessionResponse = {
  message: string
  checkoutUrl: string
  sessionId: string
}

export type OrderHistoryItem = {
  id: number
  reference: string
  status: string
  orderType: 'ticket' | 'promotion'
  total: number
  currency: string
  createdAt: string | null
  paidAt: string | null
  ticketCount: number
  event: {
    id: number | null
    title: string | null
  }
  promotionCampaignId: number | null
}

export type OrderHistoryResponse = {
  orders: OrderHistoryItem[]
}
