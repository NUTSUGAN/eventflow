import { apiClient } from './client'
import type {
  EventDetail,
  EventFiltersResponse,
  EventReportPayload,
  EventReportResponse,
  OrganizerProfile,
  SearchSuggestionsResponse,
  OrganizerFollowResponse,
  PublicEventsResponse,
} from '../types/event'

type PublicEventFilters = {
  search?: string
  type?: string
  city?: string
  date?: string
  scope?: 'upcoming' | 'archive'
  limit?: number
  page?: number
}

export async function getPublicEvents(
  filters: PublicEventFilters = {},
): Promise<PublicEventsResponse> {
  const response = await apiClient.get<PublicEventsResponse>('/api/events', {
    params: filters,
  })
  return response.data
}

export async function getPublicEventFilters(): Promise<EventFiltersResponse> {
  const response = await apiClient.get<EventFiltersResponse>('/api/events/filters')
  return response.data
}

export async function getPublicEventById(eventId: string): Promise<EventDetail> {
  const response = await apiClient.get<EventDetail>(`/api/events/${eventId}`)
  return response.data
}

export async function reportPublicEvent(
  eventId: number,
  payload: EventReportPayload,
): Promise<EventReportResponse> {
  const response = await apiClient.post<EventReportResponse>(
    `/api/events/${eventId}/report`,
    payload,
  )

  return response.data
}

export async function getSearchSuggestions(
  query: string,
): Promise<SearchSuggestionsResponse> {
  const response = await apiClient.get<SearchSuggestionsResponse>(
    '/api/search/suggestions',
    {
      params: { q: query },
    },
  )

  return response.data
}

export async function getOrganizerProfile(
  organizerId: string,
): Promise<OrganizerProfile> {
  const response = await apiClient.get<OrganizerProfile>(
    `/api/organizers/${organizerId}`,
  )

  return response.data
}

export async function followOrganizer(
  organizerId: number,
): Promise<OrganizerFollowResponse> {
  const response = await apiClient.post<OrganizerFollowResponse>(
    `/api/organizers/${organizerId}/follow`,
  )
  return response.data
}

export async function unfollowOrganizer(
  organizerId: number,
): Promise<OrganizerFollowResponse> {
  const response = await apiClient.delete<OrganizerFollowResponse>(
    `/api/organizers/${organizerId}/follow`,
  )
  return response.data
}
