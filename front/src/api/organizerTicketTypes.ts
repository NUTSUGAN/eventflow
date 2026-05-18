import { apiClient } from './client'
import type {
  OrganizerTicketType,
  OrganizerTicketTypePayload,
  OrganizerTicketTypeResponse,
} from '../types/organizerTicketType'

function buildTicketTypePayload(payload: OrganizerTicketTypePayload) {
  return {
    name: payload.name,
    description: payload.description,
    price: payload.price,
    stock: Number(payload.stock),
    salesStartAt: payload.salesStartAt,
    salesEndAt: payload.salesEndAt,
    maxPerOrder:
      payload.maxPerOrder.trim() === '' ? null : Number(payload.maxPerOrder),
    isActive: payload.isActive,
  }
}

export async function getOrganizerTicketTypes(
  eventId: number,
): Promise<OrganizerTicketType[]> {
  const response = await apiClient.get<OrganizerTicketType[]>(
    `/api/organizer/events/${eventId}/ticket-types`,
  )

  return response.data
}

export async function createOrganizerTicketType(
  eventId: number,
  payload: OrganizerTicketTypePayload,
): Promise<OrganizerTicketTypeResponse> {
  const response = await apiClient.post<OrganizerTicketTypeResponse>(
    `/api/organizer/events/${eventId}/ticket-types`,
    buildTicketTypePayload(payload),
  )

  return response.data
}

export async function updateOrganizerTicketType(
  ticketTypeId: number,
  payload: OrganizerTicketTypePayload,
): Promise<OrganizerTicketTypeResponse> {
  const response = await apiClient.patch<OrganizerTicketTypeResponse>(
    `/api/organizer/ticket-types/${ticketTypeId}`,
    buildTicketTypePayload(payload),
  )

  return response.data
}

export async function deleteOrganizerTicketType(
  ticketTypeId: number,
): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    `/api/organizer/ticket-types/${ticketTypeId}`,
  )

  return response.data
}
