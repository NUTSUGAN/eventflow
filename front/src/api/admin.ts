import { apiClient } from './client'
import type {
  AdminCategory,
  AdminCategoryPayload,
  AdminCategoryResponse,
  AdminEventStatus,
  AdminEventSummary,
  AdminEventUpdateResponse,
  AdminOrderSummary,
  AdminPlatformStats,
  AdminAccountStatus,
  AdminTicketSummary,
  AdminUserFilters,
  AdminUserRole,
  AdminUserRoleUpdateResponse,
  AdminUserStatusUpdateResponse,
  AdminUserSummary,
} from '../types/admin'

export async function getAdminEvents(): Promise<AdminEventSummary[]> {
  const response = await apiClient.get<AdminEventSummary[]>('/api/admin/events')
  return response.data
}

export async function updateAdminEventStatus(
  eventId: number,
  status: AdminEventStatus,
): Promise<AdminEventUpdateResponse> {
  const response = await apiClient.patch<AdminEventUpdateResponse>(
    `/api/admin/events/${eventId}`,
    { status },
  )

  return response.data
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const response = await apiClient.get<AdminCategory[]>('/api/admin/categories')
  return response.data
}

export async function createAdminCategory(
  payload: AdminCategoryPayload,
): Promise<AdminCategoryResponse> {
  const response = await apiClient.post<AdminCategoryResponse>(
    '/api/admin/categories',
    payload,
  )

  return response.data
}

export async function getAdminStats(): Promise<AdminPlatformStats> {
  const response = await apiClient.get<AdminPlatformStats>('/api/admin/stats')
  return response.data
}

export async function getAdminOrders(): Promise<AdminOrderSummary[]> {
  const response = await apiClient.get<AdminOrderSummary[]>('/api/admin/orders')
  return response.data
}

export async function getAdminTickets(): Promise<AdminTicketSummary[]> {
  const response = await apiClient.get<AdminTicketSummary[]>('/api/admin/tickets')
  return response.data
}

export async function getAdminUsers(
  filters: AdminUserFilters = {},
): Promise<AdminUserSummary[]> {
  const response = await apiClient.get<AdminUserSummary[]>('/api/admin/users', {
    params: {
      search: filters.search?.trim() || undefined,
      role: filters.role && filters.role !== 'all' ? filters.role : undefined,
    },
  })

  return response.data
}

export async function updateAdminUserRole(
  userId: number,
  role: AdminUserRole,
): Promise<AdminUserRoleUpdateResponse> {
  const response = await apiClient.patch<AdminUserRoleUpdateResponse>(
    `/api/admin/users/${userId}/role`,
    { role },
  )

  return response.data
}

export async function updateAdminUserAccountStatus(
  userId: number,
  accountStatus: AdminAccountStatus,
): Promise<AdminUserStatusUpdateResponse> {
  const response = await apiClient.patch<AdminUserStatusUpdateResponse>(
    `/api/admin/users/${userId}/status`,
    { accountStatus },
  )

  return response.data
}
