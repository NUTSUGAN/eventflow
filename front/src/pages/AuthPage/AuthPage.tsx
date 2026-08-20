import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  buildGoogleAuthUrl,
  finalizeGoogleAuth,
  getCurrentUser,
  getPendingGoogleAccount,
  loginUser,
  readCachedCurrentUser,
  requestPasswordReset,
  registerUser,
  resetPassword,
} from '../../api/auth'
import type {
  AuthIntent,
  ForgotPasswordPayload,
  GooglePendingAccount,
  LoginPayload,
  RegisterPayload,
} from '../../types/auth'
import {
  AuthActionsRow,
  AuthCard,
  AuthCheckbox,
  AuthCheckboxLabel,
  AuthDescription,
  AuthField,
  AuthFieldLabel,
  AuthFieldRow,
  AuthFieldset,
  AuthGoogleButton,
  AuthGoogleIcon,
  AuthHelperText,
  AuthHero,
  AuthIntentBadge,
  AuthLayout,
  AuthLegalLink,
  AuthPanel,
  AuthPrimaryButton,
  AuthSecondaryButton,
  AuthStateBox,
  AuthStatusMessage,
  AuthSubtitle,
  AuthSupportButton,
  AuthTabButton,
  AuthTabs,
  AuthTextInput,
  AuthTitle,
  PendingAccountCard,
  PendingAccountIdentity,
  PendingAccountText,
} from './authPageElements'

type AuthMode =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'google-complété'

const initialLoginForm: LoginPayload = {
  email: '',
  password: '',
  rememberMe: false,
}

const initialRegisterForm: RegisterPayload = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  acceptTerms: false,
  acceptPrivacy: false,
  subscribeToNewsletter: false,
}

const initialForgotPasswordForm: ForgotPasswordPayload = {
  email: '',
}

function GoogleIcon() {
  return (
    <AuthGoogleIcon viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        fill="#4285f4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34a853"
        d="M9 18c2.43 0 4.46-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#fbbc05"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.94H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.06l3.01-2.34Z"
      />
      <path
        fill="#ea4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.67 8.67 0 0 0 9 0 9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </AuthGoogleIcon>
  )
}

function getIntentLabel(intent: AuthIntent): string | null {
  switch (intent) {
    case 'organizer':
      return 'Accès organisateur'
    case 'publish':
      return 'Publication évènement'
    default:
      return null
  }
}

function getGoogleStatusMessage(googleStatus: string): string | null {
  switch (googleStatus) {
    case 'configuration_error':
      return 'La connexion Google n’est pas encore configurée sur cet environnement.'
    case 'invalid_state':
      return 'La vérification de sécurité Google a échoué. Réessaie depuis EventFlow.'
    case 'missing_code':
      return 'Google n’a pas renvoyé de code de connexion exploitable.'
    case 'request_failed':
      return 'Impossible de finaliser la connexion Google pour le moment.'
    case 'missing_profile':
      return 'Google n’a pas fourni les informations minimales du compte.'
    default:
      return null
  }
}

function resolveAuthIntent(value: string | null): AuthIntent {
  return value === 'organizer' || value === 'publish' ? value : ''
}

function resolveAuthMode(value: string | null): AuthMode {
  if (
    value === 'register' ||
    value === 'forgot-password' ||
    value === 'reset-password' ||
    value === 'google-complété'
  ) {
    return value
  }

  return 'login'
}

function resolvePostAuthPath(intent: AuthIntent): string {
  if (intent === 'organizer' || intent === 'publish') {
    return '/organizer-access'
  }

  return '/explorer'
}

function extractApiError(error: unknown, fallbackMessage: string): string {
  const responseMessage =
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { data?: { message?: unknown; error?: unknown } } }).response
      ?.data?.message === 'string'
      ? ((error as { response?: { data?: { message?: string } } }).response?.data
          ?.message as string)
      : typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof (error as { response?: { data?: { message?: unknown; error?: unknown } } }).response
            ?.data?.error === 'string'
        ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error as string)
        : null

  const responseStatus =
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { status?: unknown } }).response?.status === 'number'
      ? ((error as { response?: { status?: number } }).response?.status as number)
      : null

  if (responseMessage) {
    return responseMessage
  }

  if (responseStatus === 401) {
    return 'Identifiants invalides.'
  }

  if (responseStatus === 403) {
    return 'Accès refusé pour cette action.'
  }

  if (responseStatus !== null && responseStatus >= 500) {
    return 'Le serveur EventFlow a rencontré une erreur temporaire. Réessaie dans un instant.'
  }

  if (error instanceof Error && error.message.trim() !== '') {
    if (
      error.message.includes('Network Error') ||
      error.message.includes('ERR_NETWORK') ||
      error.message.includes('Failed to fetch')
    ) {
      return 'Impossible de contacter le serveur EventFlow pour le moment.'
    }

    return error.message
  }

  return fallbackMessage
}

const passwordRequirementsMessage =
  'Utilise au moins 8 caracteres, une minuscule, une majuscule, un chiffre et un caractere spécial.'

function isPasswordStrong(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(
    password.trim(),
  )
}

export function AuthPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = resolveAuthMode(searchParams.get('mode'))
  const [loginForm, setLoginForm] = useState<LoginPayload>(initialLoginForm)
  const [registerForm, setRegisterForm] = useState<RegisterPayload>(initialRegisterForm)
  const [forgotPasswordForm, setForgotPasswordForm] = useState<ForgotPasswordPayload>(
    initialForgotPasswordForm,
  )
  const [resetPasswordValue, setResetPasswordValue] = useState('')
  const [googleConsent, setGoogleConsent] = useState({
    acceptTerms: false,
    acceptPrivacy: false,
    subscribeToNewsletter: false,
  })
  const [pendingGoogleAccount, setPendingGoogleAccount] =
    useState<GooglePendingAccount | null>(null)
  const [isPendingGoogleLoading, setIsPendingGoogleLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const intent = resolveAuthIntent(searchParams.get('intent'))
  const googleStatus = searchParams.get('google')?.trim() ?? ''
  const resetToken = searchParams.get('token')?.trim() ?? ''
  const intentLabel = getIntentLabel(intent)
  const shouldGuardSession = mode === 'login' || mode === 'register'
  const cachedCurrentUser = readCachedCurrentUser()
  const googleStatusMessage = useMemo(
    () => getGoogleStatusMessage(googleStatus),
    [googleStatus],
  )

  useEffect(() => {
    if (!shouldGuardSession) {
      return
    }

    let isMounted = true

    async function guardAuthenticatedUser() {
      if (cachedCurrentUser) {
        navigate(resolvePostAuthPath(intent), { replace: true })
        return
      }

      if (cachedCurrentUser === null) {
        return
      }

      try {
        await getCurrentUser()

        if (isMounted) {
          navigate(resolvePostAuthPath(intent), { replace: true })
        }
      } catch {
        if (isMounted) {
          // No blocking loader anymore: keep the auth screen usable even if
          // session verification fails or takes too long.
        }
      }
    }

    void guardAuthenticatedUser()

    return () => {
      isMounted = false
    }
  }, [cachedCurrentUser, intent, navigate, shouldGuardSession])

  useEffect(() => {
    if (googleStatus !== 'success') {
      return
    }

    let isMounted = true

    async function completeGoogleLogin() {
      setStatusMessage('Connexion Google réussie. Redirection en cours...')
      setErrorMessage(null)

      try {
        await getCurrentUser()

        if (isMounted) {
          navigate(resolvePostAuthPath(intent), { replace: true })
        }
      } catch {
        if (isMounted) {
          setStatusMessage(null)
          setErrorMessage(
            'La connexion Google a réussi, mais la session EventFlow n’a pas pu être vérifiée.',
          )
        }
      }
    }

    void completeGoogleLogin()

    return () => {
      isMounted = false
    }
  }, [googleStatus, intent, navigate])

  useEffect(() => {
    if (mode !== 'google-complété') {
      return
    }

    let isMounted = true

    async function loadPendingGoogleAccount() {
      setIsPendingGoogleLoading(true)
      setErrorMessage(null)

      try {
        const pendingAccount = await getPendingGoogleAccount()

        if (isMounted) {
          setPendingGoogleAccount(pendingAccount)
        }
      } catch (error) {
        if (isMounted) {
          setPendingGoogleAccount(null)
          setErrorMessage(
            extractApiError(
              error,
              'Impossible de récupérer la finalisation Google pour le moment.',
            ),
          )
        }
      } finally {
        if (isMounted) {
          setIsPendingGoogleLoading(false)
        }
      }
    }

    void loadPendingGoogleAccount()

    return () => {
      isMounted = false
    }
  }, [mode])

  function switchMode(nextMode: Exclude<AuthMode, 'google-complété'>) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('mode', nextMode)
    nextParams.delete('google')
    nextParams.delete('token')
    setSearchParams(nextParams)
    setPendingGoogleAccount(null)
    setErrorMessage(null)
    setStatusMessage(null)
    setResetPasswordValue('')
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      await loginUser(loginForm)
      await getCurrentUser()
      setStatusMessage('Connexion réussie.')
      navigate(resolvePostAuthPath(intent), { replace: true })
    } catch (error) {
      setErrorMessage(
        extractApiError(error, 'Impossible de te connecter pour le moment.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setStatusMessage(null)

    if (!isPasswordStrong(registerForm.password)) {
      setErrorMessage(passwordRequirementsMessage)
      setIsSubmitting(false)
      return
    }

    try {
      await registerUser(registerForm)
      await loginUser({
        email: registerForm.email,
        password: registerForm.password,
        rememberMe: false,
      })
      await getCurrentUser()
      setStatusMessage('Compte créé avec succès.')
      navigate(resolvePostAuthPath(intent), { replace: true })
    } catch (error) {
      setErrorMessage(
        extractApiError(error, 'Impossible de créer le compte pour le moment.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgotPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const response = await requestPasswordReset(forgotPasswordForm)
      setStatusMessage(response.message)
    } catch (error) {
      setErrorMessage(
        extractApiError(
          error,
          'Impossible de préparer la réinitialisation du mot de passe pour le moment.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResetPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setStatusMessage(null)

    if (!isPasswordStrong(resetPasswordValue)) {
      setErrorMessage(passwordRequirementsMessage)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await resetPassword({
        token: resetToken,
        password: resetPasswordValue,
      })
      setStatusMessage(response.message)
      setTimeout(() => {
        navigate('/auth?mode=login', { replace: true })
      }, 1000)
    } catch (error) {
      setErrorMessage(
        extractApiError(
          error,
          'Impossible de réinitialiser le mot de passe pour le moment.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleFinalizeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      await finalizeGoogleAuth(googleConsent)
      setStatusMessage('Compte Google finalisé avec succès.')
      navigate(resolvePostAuthPath(intent), { replace: true })
    } catch (error) {
      setErrorMessage(
        extractApiError(
          error,
          'Impossible de finaliser la connexion Google pour le moment.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function startGoogleAuth(targetMode: 'login' | 'register') {
    window.location.href = buildGoogleAuthUrl(targetMode, intent)
  }

  return (
    <AuthLayout>
      <AuthHero>
        {intentLabel ? <AuthIntentBadge>{intentLabel}</AuthIntentBadge> : null}
        <AuthTitle>
          {mode === 'google-complété'
            ? 'Finalise ton compte Google'
            : mode === 'forgot-password'
              ? 'Mot de passe oublié'
              : mode === 'reset-password'
                ? 'Choisis un nouveau mot de passé'
            : mode === 'register'
              ? 'Crée ton compte EventFlow'
              : 'Connecte-toi à EventFlow'}
        </AuthTitle>
        <AuthSubtitle>
          {intent === 'organizer'
            ? 'Connecte-toi ou crée ton compte pour préparer ta demande d’accès organisateur.'
            : intent === 'publish'
              ? 'Connecte-toi ou crée ton compte pour préparer la publication de ton évènement.'
              : 'Retrouve tes recherches, tes suivis organisateur et la suite du parcours EventFlow.'}
        </AuthSubtitle>
        <AuthDescription>
          L’inscription classique demande un consentement obligatoire aux
          conditions et à la politique de confidentialité. La newsletter EventFlow
          reste toujours optionnelle.
        </AuthDescription>
      </AuthHero>

      <AuthCard>
        {mode === 'login' || mode === 'register' ? (
          <AuthTabs role="tablist" aria-label="Mode dauthentification">
            <AuthTabButton
              type="button"
              $active={mode === 'login'}
              onClick={() => switchMode('login')}
            >
              Connexion
            </AuthTabButton>
            <AuthTabButton
              type="button"
              $active={mode === 'register'}
              onClick={() => switchMode('register')}
            >
              Inscription
            </AuthTabButton>
          </AuthTabs>
        ) : null}

        {statusMessage ? <AuthStatusMessage>{statusMessage}</AuthStatusMessage> : null}
        {errorMessage ?? googleStatusMessage ? (
          <AuthStateBox>{errorMessage ?? googleStatusMessage}</AuthStateBox>
        ) : null}

        {mode === 'login' ? (
          <AuthPanel as="form" onSubmit={handleLoginSubmit}>
            <AuthFieldset>
              <AuthField>
                <AuthFieldLabel htmlFor="auth-login-email">Email</AuthFieldLabel>
                <AuthTextInput
                  id="auth-login-email"
                  type="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </AuthField>

              <AuthField>
                <AuthFieldLabel htmlFor="auth-login-password">
                  Mot de passe
                </AuthFieldLabel>
                <AuthTextInput
                  id="auth-login-password"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </AuthField>

              <AuthField>
                <AuthCheckboxLabel htmlFor="auth-login-remember-me">
                  <AuthCheckbox
                    id="auth-login-remember-me"
                    type="checkbox"
                    checked={loginForm.rememberMe}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        rememberMe: event.target.checked,
                      }))
                    }
                  />
                  Se souvenir de moi pendant 14 jours sur cet appareil.
                </AuthCheckboxLabel>
                <AuthHelperText>
                  Sans cette option, la session reste liée au navigateur courant et se termine plus vite.
                </AuthHelperText>
              </AuthField>
            </AuthFieldset>

            <AuthActionsRow>
              <AuthPrimaryButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </AuthPrimaryButton>
              <AuthGoogleButton
                type="button"
                disabled={isSubmitting}
                onClick={() => startGoogleAuth('login')}
              >
                <GoogleIcon />
                Continuer avec Google
              </AuthGoogleButton>
            </AuthActionsRow>
            <AuthSupportButton
              type="button"
              onClick={() => switchMode('forgot-password')}
            >
              Mot de passe oublié ?
            </AuthSupportButton>
          </AuthPanel>
        ) : null}

        {mode === 'register' ? (
          <AuthPanel as="form" onSubmit={handleRegisterSubmit}>
            <AuthFieldset>
              <AuthFieldRow>
                <AuthField>
                  <AuthFieldLabel htmlFor="auth-register-first-name">
                    Prénom
                  </AuthFieldLabel>
                  <AuthTextInput
                    id="auth-register-first-name"
                    type="text"
                    value={registerForm.firstName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                    required
                  />
                </AuthField>

                <AuthField>
                  <AuthFieldLabel htmlFor="auth-register-last-name">
                    Nom
                  </AuthFieldLabel>
                  <AuthTextInput
                    id="auth-register-last-name"
                    type="text"
                    value={registerForm.lastName}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                    required
                  />
                </AuthField>
              </AuthFieldRow>

              <AuthField>
                <AuthFieldLabel htmlFor="auth-register-email">Email</AuthFieldLabel>
                <AuthTextInput
                  id="auth-register-email"
                  type="email"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </AuthField>

              <AuthField>
                <AuthFieldLabel htmlFor="auth-register-password">
                  Mot de passe
                </AuthFieldLabel>
                <AuthTextInput
                  id="auth-register-password"
                  type="password"
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                />
                <AuthHelperText>{passwordRequirementsMessage}</AuthHelperText>
              </AuthField>

              <AuthField>
                <AuthCheckboxLabel htmlFor="auth-register-terms">
                  <AuthCheckbox
                    id="auth-register-terms"
                    type="checkbox"
                    checked={registerForm.acceptTerms}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        acceptTerms: event.target.checked,
                      }))
                    }
                    required
                  />
                  <span>
                    J’accepte les{' '}
                    <AuthLegalLink
                      as={Link}
                      to="/documents-legaux#conditions-generales-utilisation"
                      onClick={(event) => event.stopPropagation()}
                    >
                      conditions d’utilisation EventFlow
                    </AuthLegalLink>
                    .
                  </span>
                </AuthCheckboxLabel>
              </AuthField>

              <AuthField>
                <AuthCheckboxLabel htmlFor="auth-register-privacy">
                  <AuthCheckbox
                    id="auth-register-privacy"
                    type="checkbox"
                    checked={registerForm.acceptPrivacy}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        acceptPrivacy: event.target.checked,
                      }))
                    }
                    required
                  />
                  <span>
                    J’accepte la{' '}
                    <AuthLegalLink
                      as={Link}
                      to="/documents-legaux#politique-confidentialite"
                      onClick={(event) => event.stopPropagation()}
                    >
                      politique de confidentialité EventFlow
                    </AuthLegalLink>
                    .
                  </span>
                </AuthCheckboxLabel>
              </AuthField>

              <AuthField>
                <AuthCheckboxLabel htmlFor="auth-register-newsletter">
                  <AuthCheckbox
                    id="auth-register-newsletter"
                    type="checkbox"
                    checked={registerForm.subscribeToNewsletter}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        subscribeToNewsletter: event.target.checked,
                      }))
                    }
                  />
                  Je souhaite recevoir la newsletter EventFlow, les promotions et
                  les actualités.
                </AuthCheckboxLabel>
                <AuthHelperText>
                  Optionnel. Tu pourras te désabonner plus tard.
                </AuthHelperText>
              </AuthField>
            </AuthFieldset>

            <AuthActionsRow>
              <AuthPrimaryButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Création...' : 'Créer mon compte'}
              </AuthPrimaryButton>
              <AuthGoogleButton
                type="button"
                disabled={isSubmitting}
                onClick={() => startGoogleAuth('register')}
              >
                <GoogleIcon />
                Continuer avec Google
              </AuthGoogleButton>
            </AuthActionsRow>
          </AuthPanel>
        ) : null}

        {mode === 'forgot-password' ? (
          <AuthPanel as="form" onSubmit={handleForgotPasswordSubmit}>
            <AuthFieldset>
              <AuthField>
                <AuthFieldLabel htmlFor="auth-forgot-email">Email</AuthFieldLabel>
                <AuthTextInput
                  id="auth-forgot-email"
                  type="email"
                  value={forgotPasswordForm.email}
                  onChange={(event) =>
                    setForgotPasswordForm({ email: event.target.value })
                  }
                  required
                />
                <AuthHelperText>
                  On te préparera un lien de réinitialisation si un compte existe
                  pour cet email.
                </AuthHelperText>
              </AuthField>
            </AuthFieldset>

            <AuthActionsRow>
              <AuthPrimaryButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Préparation...' : 'Recevoir un lien'}
              </AuthPrimaryButton>
              <AuthSecondaryButton
                type="button"
                disabled={isSubmitting}
                onClick={() => switchMode('login')}
              >
                Retour à la connexion
              </AuthSecondaryButton>
            </AuthActionsRow>
          </AuthPanel>
        ) : null}

        {mode === 'reset-password' ? (
          <AuthPanel as="form" onSubmit={handleResetPasswordSubmit}>
            <AuthFieldset>
              <AuthField>
                <AuthFieldLabel htmlFor="auth-reset-password">
                  Nouveau mot de passe
                </AuthFieldLabel>
                <AuthTextInput
                  id="auth-reset-password"
                  type="password"
                  value={resetPasswordValue}
                  onChange={(event) => setResetPasswordValue(event.target.value)}
                  required
                />
                <AuthHelperText>{passwordRequirementsMessage}</AuthHelperText>
              </AuthField>
            </AuthFieldset>

            <AuthActionsRow>
              <AuthPrimaryButton
                type="submit"
                disabled={isSubmitting || resetToken === ''}
              >
                {isSubmitting ? 'Réinitialisation...' : 'Mettre à jour le mot de passe'}
              </AuthPrimaryButton>
              <AuthSecondaryButton
                type="button"
                disabled={isSubmitting}
                onClick={() => switchMode('login')}
              >
                Retour à la connexion
              </AuthSecondaryButton>
            </AuthActionsRow>
          </AuthPanel>
        ) : null}

        {mode === 'google-complété' ? (
          isPendingGoogleLoading ? (
            <AuthStateBox>Préparation de ton compte Google...</AuthStateBox>
          ) : pendingGoogleAccount ? (
            <AuthPanel as="form" onSubmit={handleGoogleFinalizeSubmit}>
              <PendingAccountCard>
                <PendingAccountIdentity>
                  {pendingGoogleAccount.firstName} {pendingGoogleAccount.lastName}
                </PendingAccountIdentity>
                <PendingAccountText>{pendingGoogleAccount.email}</PendingAccountText>
                <PendingAccountText>
                  {pendingGoogleAccount.existingUser
                    ? 'Un compte EventFlow existe déjà pour cet email. Il sera relié à Google après ton consentement.'
                    : 'Ton compte EventFlow sera créé juste après ce dernier accord.'}
                </PendingAccountText>
              </PendingAccountCard>

              <AuthFieldset>
                <AuthField>
                  <AuthCheckboxLabel htmlFor="auth-google-terms">
                    <AuthCheckbox
                      id="auth-google-terms"
                      type="checkbox"
                      checked={googleConsent.acceptTerms}
                      onChange={(event) =>
                        setGoogleConsent((current) => ({
                          ...current,
                          acceptTerms: event.target.checked,
                        }))
                      }
                      required
                    />
                    <span>
                      J’accepte les{' '}
                      <AuthLegalLink
                        as={Link}
                        to="/documents-legaux#conditions-generales-utilisation"
                        onClick={(event) => event.stopPropagation()}
                      >
                        conditions d’utilisation EventFlow
                      </AuthLegalLink>
                      .
                    </span>
                  </AuthCheckboxLabel>
                </AuthField>

                <AuthField>
                  <AuthCheckboxLabel htmlFor="auth-google-privacy">
                    <AuthCheckbox
                      id="auth-google-privacy"
                      type="checkbox"
                      checked={googleConsent.acceptPrivacy}
                      onChange={(event) =>
                        setGoogleConsent((current) => ({
                          ...current,
                          acceptPrivacy: event.target.checked,
                        }))
                      }
                      required
                    />
                    <span>
                      J’accepte la{' '}
                      <AuthLegalLink
                        as={Link}
                        to="/documents-legaux#politique-confidentialite"
                        onClick={(event) => event.stopPropagation()}
                      >
                        politique de confidentialité EventFlow
                      </AuthLegalLink>
                      .
                    </span>
                  </AuthCheckboxLabel>
                </AuthField>

                <AuthField>
                  <AuthCheckboxLabel htmlFor="auth-google-newsletter">
                    <AuthCheckbox
                      id="auth-google-newsletter"
                      type="checkbox"
                      checked={googleConsent.subscribeToNewsletter}
                      onChange={(event) =>
                        setGoogleConsent((current) => ({
                          ...current,
                          subscribeToNewsletter: event.target.checked,
                        }))
                      }
                    />
                    Je souhaite recevoir la newsletter EventFlow, les promotions et
                    les actualités.
                  </AuthCheckboxLabel>
                </AuthField>
              </AuthFieldset>

              <AuthActionsRow>
                <AuthPrimaryButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Finalisation...' : 'Finaliser mon compte'}
                </AuthPrimaryButton>
                <AuthSecondaryButton
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => switchMode('login')}
                >
                  Revenir à la connexion
                </AuthSecondaryButton>
              </AuthActionsRow>
            </AuthPanel>
          ) : null
        ) : null}
      </AuthCard>
    </AuthLayout>
  )
}
