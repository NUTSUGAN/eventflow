import { apiClient, getBackendPublicUrl } from './client'
import type {
  AuthActionResponse,
  AuthUser,
  ForgotPasswordPayload,
  GoogleFinalizePayload,
  GooglePendingAccount,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
} from '../types/auth'

let cachedCurrentUser: AuthUser | null | undefined
let currentUserRequest: Promise<AuthUser | null> | null = null

function setCachedCurrentUser(user: AuthUser | null | undefined) {
  cachedCurrentUser = user
}

function isUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: unknown } }).response?.status === 401
  )
}

async function loadCurrentUser(force = false): Promise<AuthUser | null> {
  if (!force && cachedCurrentUser !== undefined) {
    return cachedCurrentUser
  }

  if (!force && currentUserRequest) {
    return currentUserRequest
  }

  currentUserRequest = apiClient
    .get<AuthUser>('/api/me')
    .then((response) => {
      setCachedCurrentUser(response.data)
      return response.data
    })
    .catch((error: unknown) => {
      if (isUnauthorizedError(error)) {
        setCachedCurrentUser(null)
        return null
      }

      setCachedCurrentUser(undefined)
      throw error
    })
    .finally(() => {
      currentUserRequest = null
    })

  return currentUserRequest
}

export async function loginUser(payload: LoginPayload): Promise<void> {
  await apiClient.post('/api/login', {
    email: payload.email,
    password: payload.password,
    _remember_me: payload.rememberMe,
  })
  currentUserRequest = null
  setCachedCurrentUser(undefined)
}

export async function logoutUser(): Promise<void> {
  await apiClient.post('/api/logout')
  currentUserRequest = null
  setCachedCurrentUser(null)
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthActionResponse> {
  const response = await apiClient.post<AuthActionResponse>('/api/register', payload)
  currentUserRequest = null
  setCachedCurrentUser(undefined)
  return response.data
}

export function readCachedCurrentUser(): AuthUser | null | undefined {
  return cachedCurrentUser
}

export async function getCurrentUser(force = false): Promise<AuthUser> {
  const user = await loadCurrentUser(force)

  if (!user) {
    throw new Error('UNAUTHENTICATED')
  }

  return user
}

export async function updateCurrentUser(
  payload: UpdateProfilePayload,
): Promise<AuthActionResponse> {
  const response = await apiClient.patch<AuthActionResponse>('/api/me', payload)

  if (response.data.user) {
    setCachedCurrentUser(response.data.user)
  }
  currentUserRequest = null

  return response.data
}

export async function getPendingGoogleAccount(): Promise<GooglePendingAccount> {
  const response = await apiClient.get<GooglePendingAccount>('/api/auth/google/pending')
  return response.data
}

export async function finalizeGoogleAuth(
  payload: GoogleFinalizePayload,
): Promise<AuthActionResponse> {
  const response = await apiClient.post<AuthActionResponse>(
    '/api/auth/google/finalize',
    payload,
  )

  if (response.data.user) {
    setCachedCurrentUser(response.data.user)
  } else {
    setCachedCurrentUser(undefined)
  }
  currentUserRequest = null

  return response.data
}

export async function requestPasswordReset(
  payload: ForgotPasswordPayload,
): Promise<AuthActionResponse> {
  const response = await apiClient.post<AuthActionResponse>('/api/password/forgot', payload)
  return response.data
}

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<AuthActionResponse> {
  const response = await apiClient.post<AuthActionResponse>('/api/password/reset', payload)
  return response.data
}

export function buildGoogleAuthUrl(
  mode: 'login' | 'register',
  intent?: string,
): string {
  const authUrl = new URL('/api/auth/google/redirect', getBackendPublicUrl())
  authUrl.searchParams.set('mode', mode)

  if (intent) {
    authUrl.searchParams.set('intent', intent)
  }

  return authUrl.toString()
}
