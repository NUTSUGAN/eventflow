export type OrganizerApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type OrganizerApplication = {
  id: number
  status: OrganizerApplicationStatus
  organizationName: string
  city: string
  phone: string | null
  website: string | null
  instagramUrl: string | null
  tiktokUrl: string | null
  linkedinUrl: string | null
  otherLinks: string | null
  motivation: string
  reviewNote: string | null
  submittedAt: string | null
  reviewedAt: string | null
}

export type OrganizerApplicationPayload = {
  organizationName: string
  city: string
  phone?: string | null
  website?: string | null
  instagramUrl?: string | null
  tiktokUrl?: string | null
  linkedinUrl?: string | null
  otherLinks?: string | null
  motivation: string
}

export type OrganizerApplicationResponse = {
  message: string
  application: OrganizerApplication
}

export type OrganizerApplicationStateResponse = {
  application: OrganizerApplication | null
}

export type AdminOrganizerApplication = OrganizerApplication & {
  applicant: {
    id: number | null
    fullName: string
    email: string | null
    role: string | null
    profilePhoto: string | null
  }
}

export type OrganizerApplicationDecisionPayload = {
  reviewNote?: string | null
}
