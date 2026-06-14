export type OrganizerGuestTicket = {
  id: number
  displayCode: string
  status: string | null
  source: string
  recipientEmail: string | null
  recipientName: string | null
  issuedAt: string | null
  sentAt: string | null
  usedAt: string | null
  scanResult: string | null
  hasCheckedIn: boolean
  qrToken: string | null
  guestTicketUrl: string | null
  ticketType: {
    id: number | null
    name: string | null
  }
  event: {
    id: number | null
    title: string | null
    startsAt: string | null
    endsAt: string | null
    city: string | null
    venue: string | null
    coverImageUrl: string | null
  }
  order: {
    id: number | null
    reference: string | null
  }
}

export type OrganizerGuestTicketPayload = {
  recipientName: string
  recipientEmail: string
  ticketTypeId: string
}

export type OrganizerGuestTicketsResponse = {
  guestTickets: OrganizerGuestTicket[]
}

export type OrganizerGuestTicketResponse = {
  message?: string
  guestTicket: OrganizerGuestTicket
}
