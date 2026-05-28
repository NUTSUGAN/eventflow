export type OrganizerStaffMemberSummary = {
  id: number
  createdAt: string | null
  status: string | null
  isActive: boolean
  statusChangedAt: string | null
  staffUser: {
    id: number
    email: string | null
    firstName: string | null
    lastName: string | null
    displayName: string
  }
}

export type OrganizerStaffListResponse = {
  staffMembers: OrganizerStaffMemberSummary[]
  count: number
  totalCount: number
  limit: number
}

export type AddOrganizerStaffPayload = {
  email: string
}

export type AddOrganizerStaffResponse = {
  message: string
  staffMember: OrganizerStaffMemberSummary
  count: number
  totalCount: number
  limit: number
}

export type DeactivateOrganizerStaffResponse = {
  message: string
  staffMember: OrganizerStaffMemberSummary
  count: number
  totalCount: number
  limit: number
}

export type StaffScanEventSummary = {
  id: number
  title: string | null
  status: string | null
  startsAt: string | null
  city: string | null
  venue: string | null
  organizer: {
    id: number | null
    displayName: string
  }
}

export type StaffScanEventsResponse = {
  events: StaffScanEventSummary[]
}

export type StaffScanResult = 'valid' | 'invalid' | 'already_used'

export type StaffScanTicket = {
  id: number
  displayCode: string
  status: string | null
  issuedAt: string | null
  usedAt: string | null
  ticketType: {
    id: number | null
    name: string | null
  }
  event: {
    id: number | null
    title: string | null
    startsAt: string | null
    city: string | null
    venue: string | null
  }
  order: {
    id: number | null
    reference: string | null
    status: string | null
  }
  customer: {
    id: number | null
    displayName: string
    email: string | null
  }
}

export type StaffScanCheckinResponse = {
  result: StaffScanResult
  message: string
  checkin: {
    id: number | null
    scannedAt: string | null
  }
  ticket: StaffScanTicket | null
}
