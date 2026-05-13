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
  availableStockAfterPreparation: number
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
}

export type OrderPreparationResponse = {
  message: string
  order: PreparedOrder
}
