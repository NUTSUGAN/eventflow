export type OrganizerTicketType = {
  id: number
  name: string
  description: string | null
  price: string
  stock: number
  reservedQuantity: number
  availableStock: number
  salesStartAt: string | null
  salesEndAt: string | null
  maxPerOrder: number | null
  isActive: boolean
  createdAt: string | null
  event: {
    id: number | null
    title: string | null
  }
}

export type OrganizerTicketTypePayload = {
  name: string
  description: string
  price: string
  stock: string
  salesStartAt: string
  salesEndAt: string
  maxPerOrder: string
  isActive: boolean
}

export type OrganizerTicketTypeResponse = {
  message: string
  ticketType: OrganizerTicketType
}
