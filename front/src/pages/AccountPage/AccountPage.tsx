import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logoutUser, updateCurrentUser } from '../../api/auth'
import type { AuthUser, UpdateProfilePayload } from '../../types/auth'
import {
  AccountActions,
  AccountAvatar,
  AccountCard,
  AccountCheckbox,
  AccountCheckboxRow,
  AccountErrorMessage,
  AccountField,
  AccountFieldLabel,
  AccountForm,
  AccountFormGrid,
  AccountHelperText,
  AccountGrid,
  AccountHeader,
  AccountInput,
  AccountInfoCard,
  AccountLabel,
  AccountPrimaryButton,
  AccountSecondaryButton,
  AccountSection,
  AccountStatusMessage,
  AccountState,
  AccountSubtitle,
  AccountTitle,
  AccountValue,
} from './accountPageElements'

function getInitials(user: AuthUser): string {
  return `${user.firstName} ${user.lastName}`
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getFriendlyRoleLabel(role: string): string {
  switch (role) {
    case 'ROLE_ADMIN':
      return 'Administrateur'
    case 'ROLE_ORGANIZER':
      return 'Organisateur'
    case 'ROLE_STAFF':
      return 'Staff'
    default:
      return 'Client'
  }
}

export function AccountPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profileForm, setProfileForm] = useState<UpdateProfilePayload>({
    firstName: '',
    lastName: '',
    profilePhoto: '',
    subscribeToNewsletter: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const hasOrganizerAccess =
    user?.role === 'ROLE_ORGANIZER' || user?.role === 'ROLE_ADMIN'

  useEffect(() => {
    let isMounted = true

    async function loadCurrentUser() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const currentUser = await getCurrentUser()

        if (isMounted) {
          setUser(currentUser)
          setProfileForm({
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            profilePhoto: currentUser.profilePhoto ?? '',
            subscribeToNewsletter: currentUser.newsletterSubscribed,
          })
        }
      } catch {
        if (isMounted) {
          setUser(null)
          setErrorMessage('Connecte-toi pour voir ton profil EventFlow.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const response = await updateCurrentUser({
        firstName: profileForm.firstName?.trim(),
        lastName: profileForm.lastName?.trim(),
        profilePhoto: profileForm.profilePhoto?.trim() || null,
        subscribeToNewsletter: Boolean(profileForm.subscribeToNewsletter),
      })

      if (response.user) {
        setUser(response.user)
        setProfileForm({
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          profilePhoto: response.user.profilePhoto ?? '',
          subscribeToNewsletter: response.user.newsletterSubscribed,
        })
      }

      setStatusMessage(response.message)
    } catch {
      setErrorMessage(
        'Impossible de mettre a jour ton profil pour le moment.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogout() {
    try {
      await logoutUser()
    } catch {
      // UI still moves back to login even if the logout response is noisy.
    } finally {
      window.location.assign('/auth?mode=login')
    }
  }

  return (
    <AccountSection>
      <AccountCard>
        {isLoading ? (
          <AccountState>Chargement de ton profil...</AccountState>
        ) : errorMessage ? (
          <>
            <AccountState>{errorMessage}</AccountState>
            <AccountActions>
              <AccountPrimaryButton
                type="button"
                onClick={() => navigate('/auth?mode=login')}
              >
                Se connecter
              </AccountPrimaryButton>
            </AccountActions>
          </>
        ) : user ? (
          <>
            <AccountHeader>
              <AccountAvatar
                $imageUrl={(profileForm.profilePhoto?.trim() || user.profilePhoto) ?? undefined}
              >
                {!profileForm.profilePhoto?.trim() && !user.profilePhoto
                  ? getInitials(user)
                  : null}
              </AccountAvatar>
              <div>
                <AccountTitle>{`${user.firstName} ${user.lastName}`}</AccountTitle>
                <AccountSubtitle>Ton espace personnel EventFlow</AccountSubtitle>
              </div>
            </AccountHeader>

            <AccountGrid>
              <AccountInfoCard>
                <AccountLabel>Email</AccountLabel>
                <AccountValue>{user.email}</AccountValue>
              </AccountInfoCard>
              <AccountInfoCard>
                <AccountLabel>Role</AccountLabel>
                <AccountValue>{getFriendlyRoleLabel(user.role)}</AccountValue>
              </AccountInfoCard>
              <AccountInfoCard>
                <AccountLabel>Newsletter</AccountLabel>
                <AccountValue>
                  {user.newsletterSubscribed ? 'Abonne' : 'Non abonne'}
                </AccountValue>
              </AccountInfoCard>
              <AccountInfoCard>
                <AccountLabel>Consentement</AccountLabel>
                <AccountValue>
                  {user.termsAcceptedAt && user.privacyAcceptedAt
                    ? 'Valide'
                    : 'A completer'}
                </AccountValue>
              </AccountInfoCard>
            </AccountGrid>

            {statusMessage ? (
              <AccountStatusMessage>{statusMessage}</AccountStatusMessage>
            ) : null}
            {errorMessage ? <AccountErrorMessage>{errorMessage}</AccountErrorMessage> : null}

            <AccountForm onSubmit={handleProfileSubmit}>
              <AccountFormGrid>
                <AccountField>
                  <AccountFieldLabel>Prenom</AccountFieldLabel>
                  <AccountInput
                    type="text"
                    value={profileForm.firstName ?? ''}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                    required
                  />
                </AccountField>

                <AccountField>
                  <AccountFieldLabel>Nom</AccountFieldLabel>
                  <AccountInput
                    type="text"
                    value={profileForm.lastName ?? ''}
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                    required
                  />
                </AccountField>
              </AccountFormGrid>

              <AccountField>
                <AccountFieldLabel>Photo de profil (URL)</AccountFieldLabel>
                <AccountInput
                  type="url"
                  placeholder="https://..."
                  value={profileForm.profilePhoto ?? ''}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      profilePhoto: event.target.value,
                    }))
                  }
                />
              </AccountField>

              <AccountHelperText>
                Pour l instant, on passe par un lien d image. On pourra brancher un
                vrai upload ensuite sans casser ton profil.
              </AccountHelperText>

              <AccountCheckboxRow>
                <AccountCheckbox
                  type="checkbox"
                  checked={Boolean(profileForm.subscribeToNewsletter)}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      subscribeToNewsletter: event.target.checked,
                    }))
                  }
                />
                Recevoir la newsletter EventFlow, les promotions et les nouveautes.
              </AccountCheckboxRow>

              <AccountPrimaryButton
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer mes modifications'}
              </AccountPrimaryButton>
            </AccountForm>

            <AccountActions>
              <AccountPrimaryButton type="button" onClick={() => navigate('/explorer')}>
                Continuer sur Explorer
              </AccountPrimaryButton>
              <AccountSecondaryButton
                type="button"
                onClick={() =>
                  navigate(hasOrganizerAccess ? '/organizer/dashboard' : '/organizer-access')
                }
              >
                {hasOrganizerAccess ? 'Ouvrir mon espace organisateur' : 'Devenir organisateur'}
              </AccountSecondaryButton>
              {user.role === 'ROLE_ADMIN' ? (
                <AccountSecondaryButton
                  type="button"
                  onClick={() => navigate('/admin')}
                >
                  Ouvrir la console admin
                </AccountSecondaryButton>
              ) : null}
              <AccountSecondaryButton type="button" onClick={handleLogout}>
                Se deconnecter
              </AccountSecondaryButton>
            </AccountActions>
          </>
        ) : null}
      </AccountCard>
    </AccountSection>
  )
}
