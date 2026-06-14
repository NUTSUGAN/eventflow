import { apiClient } from './client'
import type {
  OrganizerGuestTicketPayload,
  OrganizerGuestTicketResponse,
  OrganizerGuestTicketsResponse,
} from '../types/organizerGuestTicket'

export async function getOrganizerGuestTickets(
  eventId: number,
): Promise<OrganizerGuestTicketsResponse> {
  const response = await apiClient.get<OrganizerGuestTicketsResponse>(
    `/api/organizer/events/${eventId}/guest-tickets`,
  )

  return response.data
}

export async function createOrganizerGuestTicket(
  eventId: number,
  payload: OrganizerGuestTicketPayload,
): Promise<OrganizerGuestTicketResponse> {
  const response = await apiClient.post<OrganizerGuestTicketResponse>(
    `/api/organizer/events/${eventId}/guest-tickets`,
    {
      recipientName: payload.recipientName.trim(),
      recipientEmail: payload.recipientEmail.trim(),
      ticketTypeId: Number(payload.ticketTypeId),
    },
  )

  return response.data
}

export async function getPublicGuestTicket(
  token: string,
): Promise<OrganizerGuestTicketResponse> {
  const response = await apiClient.get<OrganizerGuestTicketResponse>(
    `/api/guest-tickets/${encodeURIComponent(token)}`,
  )

  return response.data
}
