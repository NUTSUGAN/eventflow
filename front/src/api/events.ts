import { apiClient } from './client'
import type {
  EventDetail,
  EventFiltersResponse,
  OrganizerProfile,
  SearchSuggestionsResponse,
  EventSummary,
  OrganizerFollowResponse,
} from '../types/event'

type PublicEventFilters = {
  search?: string
  type?: string
  city?: string
  date?: string
  limit?: number
}

export async function getPublicEvents(
  filters: PublicEventFilters = {},
): Promise<EventSummary[]> {
  const response = await apiClient.get<EventSummary[]>('/api/events', {
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
