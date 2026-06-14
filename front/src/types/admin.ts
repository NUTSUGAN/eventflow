export type AdminEventStatus = 'draft' | 'published' | 'cancelled'

export type AdminEventSummary = {
  id: number
  title: string
  description: string
  startDatetime: string | null
  endDatetime: string | null
  capacity: number | null
  thumbnailPhoto: string | null
  coverPhoto: string | null
  status: AdminEventStatus | string
  createdAt: string | null
  organizer: {
    id: number | null
    email: string | null
    firstName: string | null
    lastName: string | null
  }
  category: {
    id: number | null
    name: string | null
  }
  location: {
    id: number | null
    address: string | null
    city: string | null
    postalCode: string | null
    country: string | null
    latitude: string | null
    longitude: string | null
  }
}

export type AdminCategory = {
  id: number
  name: string
  description: string | null
}

export type AdminCategoryPayload = {
  name: string
  description: string
}

export type AdminCategoryResponse = {
  message: string
  category: AdminCategory
}

export type AdminEventUpdateResponse = {
  message: string
  event: AdminEventSummary
}

export type AdminUserRole = 'ROLE_CLIENT' | 'ROLE_ORGANIZER' | 'ROLE_ADMIN'
export type AdminAccountStatus = 'active' | 'disabled' | 'blocked'

export type AdminUserSummary = {
  id: number
  email: string | null
  firstName: string | null
  lastName: string | null
  fullName: string
  role: AdminUserRole | string
  accountStatus: AdminAccountStatus | string
  effectiveRole: string
  roles: string[]
  profilePhoto: string | null
  createdAt: string | null
  termsAcceptedAt: string | null
  privacyAcceptedAt: string | null
  newsletterSubscribed: boolean
  eventflowSubscriptionsCount: number
  eventflowSubscriptions: Array<{
    id: number | null
    organizerId: number | null
    organizerName: string
    organizerEmail: string | null
    createdAt: string | null
  }>
  organizedEventsCount: number
  ordersCount: number
  ticketsCount: number
  staffCheckinsCount: number
  managedStaffCount: number
  staffOrganizerCount: number
  organizerApplication: {
    id: number | null
    status: string | null
    organizationName: string | null
    city: string | null
    submittedAt: string | null
    reviewedAt: string | null
  } | null
}

export type AdminUserFilters = {
  search?: string
  role?: AdminUserRole | 'all'
}

export type AdminUserRoleUpdateResponse = {
  message: string
  user: AdminUserSummary
}

export type AdminUserStatusUpdateResponse = {
  message: string
  user: AdminUserSummary
}

export type AdminPlatformStats = {
  orders: {
    total: number
    paid: number
    pendingPayment: number
    cancelled: number
    expired: number
  }
  revenue: {
    total: string
    currency: string
  }
  tickets: {
    sold: number
  }
  scans: {
    total: number
    valid: number
    invalid: number
    alreadyUsed: number
  }
}

export type AdminOrderSummary = {
  id: number
  reference: string | null
  status: string | null
  orderType: string | null
  totalAmount: string | null
  currency: string | null
  createdAt: string | null
  client: {
    id: number | null
    fullName: string | null
    email: string | null
  }
  payment: {
    id: number | null
    provider: string | null
    providerPaymentId: string | null
    amount: string | null
    currency: string | null
    status: string | null
    paidAt: string | null
  } | null
  ticketsCount: number
  promotion: {
    campaignId: number | null
    eventId: number | null
    eventTitle: string | null
  } | null
  tickets: Array<{
    id: number | null
    status: string | null
    issuedAt: string | null
  }>
  items: Array<{
    id: number | null
    quantity: number | null
    unitPriceAtPurchase: string | null
    ticketType: {
      id: number | null
      name: string | null
    }
    event: {
      id: number | null
      title: string | null
    }
  }>
}

export type AdminTicketSummary = {
  id: number
  status: string | null
  issuedAt: string | null
  qrTokenMasked: string
  order: {
    id: number | null
    reference: string | null
    status: string | null
  }
  client: {
    id: number | null
    fullName: string | null
    email: string | null
  }
  ticketType: {
    id: number | null
    name: string | null
  }
  event: {
    id: number | null
    title: string | null
    startDatetime: string | null
    location: {
      city: string | null
    }
  }
  latestCheckin: {
    id: number | null
    result: string | null
    scannedAt: string | null
    staff: {
      id: number | null
      fullName: string | null
      email: string | null
    }
  } | null
}
