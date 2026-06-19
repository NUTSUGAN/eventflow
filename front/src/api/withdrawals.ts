import { apiClient } from './client'
import type {
  AdminWithdrawalSettingsResponse,
  AdminWithdrawalsResponse,
  AdminWithdrawalUpdatePayload,
  AdminWithdrawalUpdateResponse,
  OrganizerWithdrawalCreateResponse,
  OrganizerWithdrawalResponse,
  OrganizerWithdrawalsResponse,
  WithdrawalStatus,
} from '../types/withdrawal'

export async function getOrganizerWithdrawals(): Promise<OrganizerWithdrawalsResponse> {
  const response = await apiClient.get<OrganizerWithdrawalsResponse>(
    '/api/organizer/withdrawals',
    { params: { _: Date.now() } },
  )

  return response.data
}

export async function createOrganizerWithdrawal(
  eventId: number,
): Promise<OrganizerWithdrawalCreateResponse> {
  const response = await apiClient.post<OrganizerWithdrawalCreateResponse>(
    '/api/organizer/withdrawals',
    { eventId },
  )

  return response.data
}

export async function getOrganizerWithdrawal(
  withdrawalId: number,
): Promise<OrganizerWithdrawalResponse> {
  const response = await apiClient.get<OrganizerWithdrawalResponse>(
    `/api/organizer/withdrawals/${withdrawalId}`,
    { params: { _: Date.now() } },
  )

  return response.data
}

export async function getAdminWithdrawals(
  status?: WithdrawalStatus,
): Promise<AdminWithdrawalsResponse> {
  const response = await apiClient.get<AdminWithdrawalsResponse>(
    '/api/admin/withdrawals',
    { params: { status, _: Date.now() } },
  )

  return response.data
}

export async function updateAdminWithdrawal(
  withdrawalId: number,
  payload: AdminWithdrawalUpdatePayload,
): Promise<AdminWithdrawalUpdateResponse> {
  const response = await apiClient.patch<AdminWithdrawalUpdateResponse>(
    `/api/admin/withdrawals/${withdrawalId}`,
    payload,
  )

  return response.data
}

export async function updateAdminWithdrawalSettings(
  defaultFeePercent: string,
): Promise<AdminWithdrawalSettingsResponse> {
  const response = await apiClient.patch<AdminWithdrawalSettingsResponse>(
    '/api/admin/withdrawals/settings',
    { defaultFeePercent },
  )

  return response.data
}
