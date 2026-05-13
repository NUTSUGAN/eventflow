export type OrganizerEventOptionCategory = {
  id: number
  name: string
  description: string | null
}

export type OrganizerEventOptionLocation = {
  id: number
  address: string
  city: string
  postalCode: string
  country: string
}

export type OrganizerEventFormOptions = {
  categories: OrganizerEventOptionCategory[]
  locations: OrganizerEventOptionLocation[]
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
  }
}

export type OrganizerEventCreateResponse = {
  message: string
  event: OrganizerEventSummary
}
