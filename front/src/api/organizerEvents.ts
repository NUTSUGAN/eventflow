import { apiClient } from './client'
import type {
  OrganizerEventCreateResponse,
  OrganizerEventDetailResponse,
  OrganizerEventFormOptions,
  OrganizerEventStatus,
  OrganizerEventStatusUpdateResponse,
  OrganizerEventSummary,
  OrganizerEventUpdateResponse,
} from '../types/organizerEvent'

export async function getOrganizerEventFormOptions(): Promise<OrganizerEventFormOptions> {
  const response = await apiClient.get<OrganizerEventFormOptions>(
    '/api/organizer/events/options',
  )

  return response.data
}

export async function getMyOrganizerEvents(): Promise<OrganizerEventSummary[]> {
  const response = await apiClient.get<OrganizerEventSummary[]>('/api/organizer/events')

  return response.data
}

export async function getOrganizerEvent(eventId: number): Promise<OrganizerEventDetailResponse> {
  const response = await apiClient.get<OrganizerEventDetailResponse>(
    `/api/organizer/events/${eventId}`,
  )

  return response.data
}

export async function createOrganizerEvent(
  payload: FormData,
): Promise<OrganizerEventCreateResponse> {
  const response = await apiClient.post<OrganizerEventCreateResponse>(
    '/api/organizer/events',
    payload,
  )

  return response.data
}

export async function updateOrganizerEventStatus(
  eventId: number,
  status: OrganizerEventStatus,
): Promise<OrganizerEventStatusUpdateResponse> {
  const response = await apiClient.patch<OrganizerEventStatusUpdateResponse>(
    `/api/organizer/events/${eventId}/status`,
    { status },
  )

  return response.data
}

export async function updateOrganizerEvent(
  eventId: number,
  payload: FormData,
): Promise<OrganizerEventUpdateResponse> {
  const response = await apiClient.post<OrganizerEventUpdateResponse>(
    `/api/organizer/events/${eventId}`,
    payload,
  )

  return response.data
}
