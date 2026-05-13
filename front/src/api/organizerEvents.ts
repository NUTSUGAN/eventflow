import { apiClient } from './client'
import type {
  OrganizerEventCreateResponse,
  OrganizerEventFormOptions,
  OrganizerEventSummary,
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

export async function createOrganizerEvent(
  payload: FormData,
): Promise<OrganizerEventCreateResponse> {
  const response = await apiClient.post<OrganizerEventCreateResponse>(
    '/api/organizer/events',
    payload,
  )

  return response.data
}
