import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  AuthHelperText,
  AuthHero,
  AuthIntentBadge,
  AuthLayout,
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
  | 'google-complete'

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

function getIntentLabel(intent: AuthIntent): string | null {
  switch (intent) {
    case 'organizer':
      return 'Acces organisateur'
    case 'publish':
      return 'Publication evenement'
    default:
      return null
  }
}

function getGoogleStatusMessage(googleStatus: string): string | null {
  switch (googleStatus) {
    case 'configuration_error':
      return 'La connexion Google n est pas encore configuree sur cet environnement.'
    case 'invalid_state':
      return 'La verification de securite Google a echoue. Reessaie depuis EventFlow.'
    case 'missing_code':
      return 'Google n a pas renvoye de code de connexion exploitable.'
    case 'request_failed':
      return 'Impossible de finaliser la connexion Google pour le moment.'
    case 'missing_profile':
      return 'Google n a pas fourni les informations minimales du compte.'
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
    value === 'google-complete'
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
    return 'Acces refuse pour cette action.'
  }

  if (responseStatus !== null && responseStatus >= 500) {
    return 'Le serveur EventFlow a rencontre une erreur temporaire. Reessaie dans un instant.'
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
  'Utilise au moins 8 caracteres, une minuscule, une majuscule, un chiffre et un caractere special.'

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
      setStatusMessage('Connexion Google reussie. Redirection en cours...')
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
            'La connexion Google a reussi, mais la session EventFlow n a pas pu etre verifiee.',
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
    if (mode !== 'google-complete') {
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
              'Impossible de recuperer la finalisation Google pour le moment.',
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

  function switchMode(nextMode: Exclude<AuthMode, 'google-complete'>) {
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
      setStatusMessage('Connexion reussie.')
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
      setStatusMessage('Compte cree avec succes.')
      navigate(resolvePostAuthPath(intent), { replace: true })
    } catch (error) {
      setErrorMessage(
        extractApiError(error, 'Impossible de creer le compte pour le moment.'),
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
          'Impossible de preparer la reinitialisation du mot de passe pour le moment.',
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
          'Impossible de reinitialiser le mot de passe pour le moment.',
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
      setStatusMessage('Compte Google finalise avec succes.')
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
          {mode === 'google-complete'
            ? 'Finalise ton compte Google'
            : mode === 'forgot-password'
              ? 'Mot de passe oublie'
              : mode === 'reset-password'
                ? 'Choisis un nouveau mot de passe'
            : mode === 'register'
              ? 'Cree ton compte EventFlow'
              : 'Connecte-toi a EventFlow'}
        </AuthTitle>
        <AuthSubtitle>
          {intent === 'organizer'
            ? 'Connecte-toi ou cree ton compte pour preparer ta demande d acces organisateur.'
            : intent === 'publish'
              ? 'Connecte-toi ou cree ton compte pour preparer la publication de ton evenement.'
              : 'Retrouve tes recherches, tes suivis organisateur et la suite du parcours EventFlow.'}
        </AuthSubtitle>
        <AuthDescription>
          L inscription classique demande un consentement obligatoire aux
          conditions et a la politique de confidentialite. La newsletter EventFlow
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
                  Sans cette option, la session reste liee au navigateur courant et se termine plus vite.
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
                Continuer avec Google
              </AuthGoogleButton>
            </AuthActionsRow>
            <AuthSupportButton
              type="button"
              onClick={() => switchMode('forgot-password')}
            >
              Mot de passe oublie ?
            </AuthSupportButton>
          </AuthPanel>
        ) : null}

        {mode === 'register' ? (
          <AuthPanel as="form" onSubmit={handleRegisterSubmit}>
            <AuthFieldset>
              <AuthFieldRow>
                <AuthField>
                  <AuthFieldLabel htmlFor="auth-register-first-name">
                    Prenom
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
                  J accepte les conditions d utilisation EventFlow.
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
                  J accepte la politique de confidentialite EventFlow.
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
                  les actualites.
                </AuthCheckboxLabel>
                <AuthHelperText>
                  Optionnel. Tu pourras te desabonner plus tard.
                </AuthHelperText>
              </AuthField>
            </AuthFieldset>

            <AuthActionsRow>
              <AuthPrimaryButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creation...' : 'Creer mon compte'}
              </AuthPrimaryButton>
              <AuthGoogleButton
                type="button"
                disabled={isSubmitting}
                onClick={() => startGoogleAuth('register')}
              >
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
                  On te preparera un lien de reinitialisation si un compte existe
                  pour cet email.
                </AuthHelperText>
              </AuthField>
            </AuthFieldset>

            <AuthActionsRow>
              <AuthPrimaryButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Preparation...' : 'Recevoir un lien'}
              </AuthPrimaryButton>
              <AuthSecondaryButton
                type="button"
                disabled={isSubmitting}
                onClick={() => switchMode('login')}
              >
                Retour a la connexion
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
                {isSubmitting ? 'Reinitialisation...' : 'Mettre a jour le mot de passe'}
              </AuthPrimaryButton>
              <AuthSecondaryButton
                type="button"
                disabled={isSubmitting}
                onClick={() => switchMode('login')}
              >
                Retour a la connexion
              </AuthSecondaryButton>
            </AuthActionsRow>
          </AuthPanel>
        ) : null}

        {mode === 'google-complete' ? (
          isPendingGoogleLoading ? (
            <AuthStateBox>Preparation de ton compte Google...</AuthStateBox>
          ) : pendingGoogleAccount ? (
            <AuthPanel as="form" onSubmit={handleGoogleFinalizeSubmit}>
              <PendingAccountCard>
                <PendingAccountIdentity>
                  {pendingGoogleAccount.firstName} {pendingGoogleAccount.lastName}
                </PendingAccountIdentity>
                <PendingAccountText>{pendingGoogleAccount.email}</PendingAccountText>
                <PendingAccountText>
                  {pendingGoogleAccount.existingUser
                    ? 'Un compte EventFlow existe deja pour cet email. Il sera relie a Google apres ton consentement.'
                    : 'Ton compte EventFlow sera cree juste apres ce dernier accord.'}
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
                    J accepte les conditions d utilisation EventFlow.
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
                    J accepte la politique de confidentialite EventFlow.
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
                    les actualites.
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
                  Revenir a la connexion
                </AuthSecondaryButton>
              </AuthActionsRow>
            </AuthPanel>
          ) : null
        ) : null}
      </AuthCard>
    </AuthLayout>
  )
}
