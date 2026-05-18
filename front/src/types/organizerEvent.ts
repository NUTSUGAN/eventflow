export type OrganizerEventOptionCategory = {
  id: number
  name: string
  description: string | null
}

export type OrganizerEventFormOptions = {
  categories: OrganizerEventOptionCategory[]
}

export type OrganizerEventSummary = {
  id: number
  title: string
  description: string
  startDatetime: string | null
  endDatetime: string | null
  capacity: number | null
  thumbnailPhoto: string | null
  coverPhoto: string | null
  status: string
  createdAt: string | null
  ticketTypesCount: number
  category: {
    id: number | null
    name: string | null
  }
  location: {
    id: number | null
    address: string | null
    city: string | null
    postalCode: string | null
    country: string | null
    latitude: string | null
    longitude: string | null
  }
}

export type OrganizerEventCreateResponse = {
  message: string
  event: OrganizerEventSummary
}

export type OrganizerEventStatus = 'draft' | 'published'

export type OrganizerEventStatusUpdateResponse = {
  message: string
  event: OrganizerEventSummary
}

export type OrganizerEventDetailResponse = {
  event: OrganizerEventSummary
}

export type OrganizerEventUpdateResponse = {
  message: string
  event: OrganizerEventSummary
}
