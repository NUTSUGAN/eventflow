import { apiClient } from './client'
import type {
  AdminOrganizerApplication,
  OrganizerApplicationDecisionPayload,
  OrganizerApplicationPayload,
  OrganizerApplicationResponse,
  OrganizerApplicationStateResponse,
} from '../types/organizerApplication'

export async function getMyOrganizerApplication(): Promise<OrganizerApplicationStateResponse> {
  const response = await apiClient.get<OrganizerApplicationStateResponse>(
    '/api/organizer-application/me',
  )
  return response.data
}

export async function submitOrganizerApplication(
  payload: OrganizerApplicationPayload,
): Promise<OrganizerApplicationResponse> {
  const response = await apiClient.post<OrganizerApplicationResponse>(
    '/api/organizer-application',
    payload,
  )
  return response.data
}

export async function getAdminOrganizerApplications(): Promise<
  AdminOrganizerApplication[]
> {
  const response = await apiClient.get<AdminOrganizerApplication[]>(
    '/api/admin/organizer-applications',
  )
  return response.data
}

export async function approveOrganizerApplication(
  applicationId: number,
  payload: OrganizerApplicationDecisionPayload,
): Promise<OrganizerApplicationResponse> {
  const response = await apiClient.post<OrganizerApplicationResponse>(
    `/api/admin/organizer-applications/${applicationId}/approve`,
    payload,
  )
  return response.data
}

export async function rejectOrganizerApplication(
  applicationId: number,
  payload: OrganizerApplicationDecisionPayload,
): Promise<OrganizerApplicationResponse> {
  const response = await apiClient.post<OrganizerApplicationResponse>(
    `/api/admin/organizer-applications/${applicationId}/reject`,
    payload,
  )
  return response.data
}
