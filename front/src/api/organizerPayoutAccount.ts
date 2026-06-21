import { apiClient } from './client'
import type {
  OrganizerPayoutAccountPayload,
  OrganizerPayoutAccountResponse,
  OrganizerPayoutAccountUpdateResponse,
} from '../types/organizerPayoutAccount'

export async function getOrganizerPayoutAccount(): Promise<OrganizerPayoutAccountResponse> {
  const response = await apiClient.get<OrganizerPayoutAccountResponse>(
    '/api/organizer/payout-account',
    { params: { _: Date.now() } },
  )

  return response.data
}

export async function saveOrganizerPayoutAccount(
  payload: OrganizerPayoutAccountPayload,
): Promise<OrganizerPayoutAccountUpdateResponse> {
  const response = await apiClient.post<OrganizerPayoutAccountUpdateResponse>(
    '/api/organizer/payout-account',
    payload,
  )

  return response.data
}
