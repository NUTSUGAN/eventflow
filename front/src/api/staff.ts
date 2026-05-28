import { apiClient } from './client'
import type {
  AddOrganizerStaffPayload,
  AddOrganizerStaffResponse,
  DeactivateOrganizerStaffResponse,
  OrganizerStaffListResponse,
  StaffScanCheckinResponse,
  StaffScanEventsResponse,
} from '../types/staff'

export async function getOrganizerStaffMembers(): Promise<OrganizerStaffListResponse> {
  const response = await apiClient.get<OrganizerStaffListResponse>('/api/organizer/staff')
  return response.data
}

export async function addOrganizerStaffMember(
  payload: AddOrganizerStaffPayload,
): Promise<AddOrganizerStaffResponse> {
  const response = await apiClient.post<AddOrganizerStaffResponse>(
    '/api/organizer/staff',
    payload,
  )

  return response.data
}

export async function deactivateOrganizerStaffMember(
  membershipId: number,
): Promise<DeactivateOrganizerStaffResponse> {
  const response = await apiClient.patch<DeactivateOrganizerStaffResponse>(
    `/api/organizer/staff/${membershipId}/out-of-service`,
  )

  return response.data
}

export async function getStaffScanEvents(): Promise<StaffScanEventsResponse> {
  const response = await apiClient.get<StaffScanEventsResponse>('/api/staff/scan/events')
  return response.data
}

export async function submitStaffScanCheckin(
  eventId: number,
  scanPayload: string,
): Promise<StaffScanCheckinResponse> {
  const response = await apiClient.post<StaffScanCheckinResponse>(
    '/api/staff/scan/checkins',
    {
      eventId,
      scanPayload,
    },
  )

  return response.data
}
