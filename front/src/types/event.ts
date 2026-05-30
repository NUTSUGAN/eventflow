export type EventIdentifier = number

export type TicketTypeSummary = {
  id: EventIdentifier
  name: string
  price: number
  currency: string
  availableQuantity: number | null
}

export type EventSummary = {
  id: EventIdentifier
  title: string
  shortDescription: string
  city: string
  venue: string
  startsAt: string
  category: string
  coverImageUrl: string | null
  minPrice: number | null
  currency: string
}

export type EventFilterCategory = {
  id: number
  name: string
}

export type EventFiltersResponse = {
  categories: EventFilterCategory[]
  cities: string[]
}

export type PublicEventsResponse = {
  items: EventSummary[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export type EventCategory = {
  id: number | null
  name: string | null
  description: string | null
}

export type EventMedia = {
  thumbnailUrl: string | null
  coverUrl: string | null
}

export type EventLocation = {
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
}

export type EventOrganizer = {
  id: number
  firstName: string
  lastName: string
  fullName: string
  role: string
  profilePhoto: string | null
}

export type OrganizerIdentity = {
  id: number
  firstName: string
  lastName: string
  fullName: string
  profilePhoto: string | null
}

export type EventSubscription = {
  canFollow: boolean
  isFollowing: boolean
  status: string | null
  requiresAuth: boolean
  isOwnOrganizer: boolean
}

export type EventTicketType = {
  id: number
  name: string
  description: string | null
  basePrice: number | null
  stock: number | null
  reservedQuantity: number | null
  availableStock: number | null
  saleStartAt: string | null
  saleEndAt: string | null
  maxPerOrder: number | null
  isActive: boolean
}

export type EventDetail = {
  id: number
  title: string
  description: string
  status: string
  startsAt: string | null
  endsAt: string | null
  capacity: number | null
  createdAt: string | null
  category: EventCategory | null
  media: EventMedia
  location: EventLocation | null
  organizer: EventOrganizer | null
  subscription: EventSubscription
  ticketTypes: EventTicketType[]
}

export type OrganizerFollowResponse = {
  message: string
  subscription: EventSubscription
  organizer: EventOrganizer | null
}

export type SearchSuggestionEvent = {
  id: number
  title: string
  category: string | null
  city: string | null
  startsAt: string | null
  coverImageUrl: string | null
}

export type SearchSuggestionOrganizer = OrganizerIdentity

export type SearchSuggestionsResponse = {
  query: string
  events: SearchSuggestionEvent[]
  organizers: SearchSuggestionOrganizer[]
}

export type OrganizerProfileOrganizer = OrganizerIdentity & {
  createdAt: string | null
  publishedEventCount: number
}

export type OrganizerProfile = {
  organizer: OrganizerProfileOrganizer
  subscription: EventSubscription
  events: EventSummary[]
}

export type EventReportPayload = {
  reason: string
  details: string
}

export type EventReportResponse = {
  message: string
}
