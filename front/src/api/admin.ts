import { apiClient } from './client'
import type {
  AdminCategory,
  AdminCategoryPayload,
  AdminCategoryResponse,
  AdminEventReportResponse,
  AdminEventReportsResponse,
  AdminEventReportStatus,
  AdminEventReportUpdateResponse,
  AdminEventStatus,
  AdminEventSummary,
  AdminEventUpdateResponse,
  AdminOrderSummary,
  AdminPlatformStats,
  AdminAccountStatus,
  AdminAccountSummary,
  AdminAuditLogsResponse,
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

export async function updateAdminCategory(
  categoryId: number,
  payload: AdminCategoryPayload,
): Promise<AdminCategoryResponse> {
  const response = await apiClient.patch<AdminCategoryResponse>(
    `/api/admin/categories/${categoryId}`,
    payload,
  )

  return response.data
}

export async function deleteAdminCategory(categoryId: number): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    `/api/admin/categories/${categoryId}`,
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

export async function getAdminAccounts(search = ''): Promise<AdminAccountSummary[]> {
  const response = await apiClient.get<AdminAccountSummary[]>('/api/admin/admin-users', {
    params: {
      search: search.trim() || undefined,
    },
  })

  return response.data
}

export async function getAdminAuditLogs(filters: {
  admin?: string
  role?: string
  action?: string
  resourceType?: string
  from?: string
  to?: string
} = {}): Promise<AdminAuditLogsResponse> {
  const response = await apiClient.get<AdminAuditLogsResponse>('/api/admin/logs', {
    params: {
      admin: filters.admin?.trim() || undefined,
      role: filters.role?.trim() || undefined,
      action: filters.action?.trim() || undefined,
      resourceType: filters.resourceType?.trim() || undefined,
      from: filters.from?.trim() || undefined,
      to: filters.to?.trim() || undefined,
    },
  })

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

export async function getAdminEventReports(
  status?: AdminEventReportStatus,
): Promise<AdminEventReportsResponse> {
  const response = await apiClient.get<AdminEventReportsResponse>(
    '/api/admin/event-reports',
    {
      params: {
        status,
      },
    },
  )

  return response.data
}

export async function getAdminEventReport(
  reportId: number,
): Promise<AdminEventReportResponse> {
  const response = await apiClient.get<AdminEventReportResponse>(
    `/api/admin/event-reports/${reportId}`,
  )

  return response.data
}

export async function updateAdminEventReportStatus(
  reportId: number,
  status: AdminEventReportStatus,
): Promise<AdminEventReportUpdateResponse> {
  const response = await apiClient.patch<AdminEventReportUpdateResponse>(
    `/api/admin/event-reports/${reportId}`,
    { status },
  )

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
