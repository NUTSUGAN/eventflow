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

export type OrderCheckoutSessionResponse = {
  message: string
  checkoutUrl: string
  sessionId: string
}
