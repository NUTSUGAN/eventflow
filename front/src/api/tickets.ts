import { apiClient } from './client'
import type { MyTicketResponse, MyTicketsResponse } from '../types/ticket'

export async function getMyTickets(): Promise<MyTicketsResponse> {
  const response = await apiClient.get<MyTicketsResponse>('/api/me/tickets')
  return response.data
}

export async function getMyTicket(ticketId: number): Promise<MyTicketResponse> {
  const response = await apiClient.get<MyTicketResponse>(`/api/me/tickets/${ticketId}`)
  return response.data
}
