export type AuthIntent = 'organizer' | 'publish' | ''

export type AuthUser = {
  id: number
  email: string
  role: string
  baseRole: string
  roles: string[]
  firstName: string
  lastName: string
  profilePhoto: string | null
  termsAcceptedAt: string | null
  privacyAcceptedAt: string | null
  newsletterSubscribed: boolean
  canManageStaff: boolean
  canAccessStaffTools: boolean
  managedStaffCount: number
  staffOrganizerCount: number
}

export type LoginPayload = {
  email: string
  password: string
  rememberMe: boolean
}

export type ForgotPasswordPayload = {
  email: string
}

export type ResetPasswordPayload = {
  token: string
  password: string
}

export type UpdateProfilePayload = {
  firstName?: string
  lastName?: string
  profilePhoto?: string | null
  subscribeToNewsletter?: boolean
}

export type RegisterPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
  acceptTerms: boolean
  acceptPrivacy: boolean
  subscribeToNewsletter: boolean
}

export type GoogleFinalizePayload = {
  acceptTerms: boolean
  acceptPrivacy: boolean
  subscribeToNewsletter: boolean
}

export type GooglePendingAccount = {
  email: string
  firstName: string
  lastName: string
  profilePhoto: string | null
  existingUser: boolean
  intent: AuthIntent
}

export type AuthActionResponse = {
  message: string
  newsletterSubscribed?: boolean
  user?: AuthUser
}
