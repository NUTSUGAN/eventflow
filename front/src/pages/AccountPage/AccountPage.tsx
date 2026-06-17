import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCurrentUser,
  logoutUser,
  requestEmailChange,
  updateCurrentUser,
} from '../../api/auth'
import type { AuthUser } from '../../types/auth'
import {
  AccountActions,
  AccountAvatar,
  AccountBadgeRow,
  AccountCheckbox,
  AccountCheckboxRow,
  AccountDangerButton,
  AccountErrorMessage,
  AccountEyebrow,
  AccountField,
  AccountFieldLabel,
  AccountForm,
  AccountFormCard,
  AccountFormGrid,
  AccountGhostButton,
  AccountGrid,
  AccountHelperText,
  AccountHero,
  AccountHiddenFileInput,
  AccountInfoCard,
  AccountInput,
  AccountLabel,
  AccountMutedValue,
  AccountOverviewCard,
  AccountPrimaryButton,
  AccountReadonlyField,
  AccountSection,
  AccountSectionLead,
  AccountSectionTitle,
  AccountSecondaryButton,
  AccountShell,
  AccountState,
  AccountStateCard,
  AccountStatusBadge,
  AccountStatusMessage,
  AccountSubtitle,
  AccountTitle,
  AccountUploadCard,
  AccountUploadMeta,
  AccountUploadPreview,
  AccountUploadRow,
  AccountUploadTitle,
  AccountValue,
} from './accountPageElements'

type AccountProfileFormState = {
  firstName: string
  lastName: string
  subscribeToNewsletter: boolean
  removeProfilePhoto: boolean
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('INVALID_FILE_RESULT'))
    }

    reader.onerror = () => {
      reject(new Error('FILE_READ_ERROR'))
    }

    reader.readAsDataURL(file)
  })
}

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

function getFriendlyAccountStatusLabel(accountStatus: string): string {
  switch (accountStatus) {
    case 'blocked':
      return 'Bloque'
    case 'disabled':
      return 'Desactive'
    default:
      return 'Actif'
  }
}

function getAccountStatusTone(accountStatus: string): 'success' | 'danger' | 'neutral' {
  switch (accountStatus) {
    case 'blocked':
      return 'danger'
    case 'disabled':
      return 'neutral'
    default:
      return 'success'
  }
}

export function AccountPage() {
  const navigate = useNavigate()
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profileForm, setProfileForm] = useState<AccountProfileFormState>({
    firstName: '',
    lastName: '',
    subscribeToNewsletter: false,
    removeProfilePhoto: false,
  })
  const [selectedProfilePhotoDataUrl, setSelectedProfilePhotoDataUrl] = useState<string | null>(null)
  const [selectedProfilePhotoName, setSelectedProfilePhotoName] = useState<string | null>(null)
  const [emailChangeValue, setEmailChangeValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false)
  const [isEmailChangeSubmitting, setIsEmailChangeSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [emailChangeErrorMessage, setEmailChangeErrorMessage] = useState<string | null>(null)
  const [emailChangeStatusMessage, setEmailChangeStatusMessage] = useState<string | null>(null)

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
            subscribeToNewsletter: currentUser.newsletterSubscribed,
            removeProfilePhoto: false,
          })
          setSelectedProfilePhotoDataUrl(null)
          setSelectedProfilePhotoName(null)
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
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        subscribeToNewsletter: profileForm.subscribeToNewsletter,
        removeProfilePhoto: profileForm.removeProfilePhoto,
        profilePhotoDataUrl: selectedProfilePhotoDataUrl,
      })

      if (response.user) {
        setUser(response.user)
        setProfileForm({
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          subscribeToNewsletter: response.user.newsletterSubscribed,
          removeProfilePhoto: false,
        })
      }

      setSelectedProfilePhotoDataUrl(null)
      setSelectedProfilePhotoName(null)

      if (profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = ''
      }

      setStatusMessage(response.message)
    } catch {
      setErrorMessage('Impossible de mettre à jour ton profil pour le moment.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleEmailChangeSubmit() {
    if (isEmailChangeSubmitting) {
      return
    }

    setIsEmailChangeSubmitting(true)
    setEmailChangeErrorMessage(null)
    setEmailChangeStatusMessage(null)

    try {
      const response = await requestEmailChange({
        newEmail: emailChangeValue.trim(),
      })

      setEmailChangeValue('')
      setEmailChangeStatusMessage(response.message)
    } catch (error) {
      const responseMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null

      setEmailChangeErrorMessage(
        responseMessage ?? "Impossible de lancer le changement d’email pour le moment.",
      )
    } finally {
      setIsEmailChangeSubmitting(false)
    }
  }

  async function handleProfilePhotoChange(changeEvent: ChangeEvent<HTMLInputElement>) {
    const nextFile = changeEvent.target.files?.[0] ?? null

    if (!nextFile) {
      return
    }

    if (!nextFile.type.startsWith('image/')) {
      setErrorMessage('Choisis une image JPG, PNG ou WebP pour ta photo de profil.')
      changeEvent.target.value = ''
      return
    }

    setIsPreparingPhoto(true)

    try {
      const nextPhotoDataUrl = await readFileAsDataUrl(nextFile)

      setErrorMessage(null)
      setStatusMessage(null)
      setSelectedProfilePhotoDataUrl(nextPhotoDataUrl)
      setSelectedProfilePhotoName(nextFile.name)
      setProfileForm((current) => ({
        ...current,
        removeProfilePhoto: false,
      }))
    } catch {
      setErrorMessage("Impossible de préparer cette image pour l'instant.")
      changeEvent.target.value = ''
    } finally {
      setIsPreparingPhoto(false)
    }
  }

  function handleRemoveProfilePhoto() {
    setErrorMessage(null)
    setStatusMessage(null)
    setSelectedProfilePhotoDataUrl(null)
    setSelectedProfilePhotoName(null)
    setProfileForm((current) => ({
      ...current,
      removeProfilePhoto: true,
    }))

    if (profilePhotoInputRef.current) {
      profilePhotoInputRef.current.value = ''
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

  if (isLoading) {
    return (
      <AccountSection>
        <AccountStateCard>
          <AccountSectionTitle>Chargement du profil</AccountSectionTitle>
          <AccountState>On prépare ton espace personnel EventFlow...</AccountState>
        </AccountStateCard>
      </AccountSection>
    )
  }

  if (errorMessage && !user) {
    return (
      <AccountSection>
        <AccountStateCard>
          <AccountSectionTitle>Profil indisponible</AccountSectionTitle>
          <AccountState>{errorMessage}</AccountState>
          <AccountActions>
            <AccountPrimaryButton
              type="button"
              onClick={() => navigate('/auth?mode=login')}
            >
              Se connecter
            </AccountPrimaryButton>
          </AccountActions>
        </AccountStateCard>
      </AccountSection>
    )
  }

  if (!user) {
    return null
  }

  const displayedProfilePhoto =
    selectedProfilePhotoDataUrl ??
    (profileForm.removeProfilePhoto ? null : user.profilePhoto)
  const roleLabel = getFriendlyRoleLabel(user.role)
  const accountStatusLabel = getFriendlyAccountStatusLabel(user.accountStatus)

  return (
    <AccountSection>
      <AccountShell>
        <AccountOverviewCard>
          <AccountHero>
            <AccountAvatar $imageUrl={displayedProfilePhoto ?? undefined}>
              {!displayedProfilePhoto ? getInitials(user) : null}
            </AccountAvatar>

            <div>
              <AccountEyebrow>Mon profil</AccountEyebrow>
              <AccountTitle>{`${user.firstName} ${user.lastName}`}</AccountTitle>
              <AccountSubtitle>
                G?re ton identité, ton’avatar et tes preferences depuis un espace plus
                clair et plus personnel.
              </AccountSubtitle>
              <AccountBadgeRow>
                <AccountStatusBadge $tone="accent">{roleLabel}</AccountStatusBadge>
                <AccountStatusBadge $tone={getAccountStatusTone(user.accountStatus)}>
                  {accountStatusLabel}
                </AccountStatusBadge>
                {user.newsletterSubscribed ? (
                  <AccountStatusBadge $tone="success">Newsletter active</AccountStatusBadge>
                ) : (
                  <AccountStatusBadge>Newsletter inactive</AccountStatusBadge>
                )}
              </AccountBadgeRow>
            </div>
          </AccountHero>

          <AccountGrid>
            <AccountInfoCard>
              <AccountLabel>Outils staff</AccountLabel>
              <AccountValue>
                {user.canAccessStaffTools ? 'Accès autorisé' : 'Non disponible'}
              </AccountValue>
            </AccountInfoCard>

            <AccountInfoCard>
              <AccountLabel>Espace organisateur</AccountLabel>
              <AccountValue>
                {hasOrganizerAccess ? 'Disponible' : 'Demande non validée'}
              </AccountValue>
            </AccountInfoCard>
          </AccountGrid>

          <AccountActions>
            <AccountPrimaryButton type="button" onClick={() => navigate('/mes-billets')}>
              Voir mes billets
            </AccountPrimaryButton>
            <AccountSecondaryButton type="button" onClick={() => navigate('/mes-commandes')}>
              Voir mes commandes
            </AccountSecondaryButton>
            <AccountSecondaryButton
              type="button"
              onClick={() =>
                navigate(hasOrganizerAccess ? '/organizer/dashboard' : '/organizer-access')
              }
            >
              {hasOrganizerAccess ? 'Espace organisateur' : 'Devenir organisateur'}
            </AccountSecondaryButton>
            {user.role === 'ROLE_ADMIN' ? (
              <AccountSecondaryButton type="button" onClick={() => navigate('/admin')}>
                Ouvrir la console admin
              </AccountSecondaryButton>
            ) : null}
            <AccountDangerButton type="button" onClick={handleLogout}>
              Se déconnecter
            </AccountDangerButton>
          </AccountActions>
        </AccountOverviewCard>

        <AccountFormCard>
          <div>
            <AccountSectionTitle>Modifier mes informations</AccountSectionTitle>
            <AccountSectionLead>
              Mets à jour ton nom, ta photo et tes preferences sans sortir de ton espace
              perso.
            </AccountSectionLead>
          </div>

          {statusMessage ? <AccountStatusMessage>{statusMessage}</AccountStatusMessage> : null}
          {errorMessage ? <AccountErrorMessage>{errorMessage}</AccountErrorMessage> : null}

          <AccountForm onSubmit={handleProfileSubmit}>
            <AccountFormGrid>
              <AccountField>
                <AccountFieldLabel>Prénom</AccountFieldLabel>
                <AccountInput
                  type="text"
                  value={profileForm.firstName}
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
                  value={profileForm.lastName}
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
              <AccountFieldLabel>Email</AccountFieldLabel>
              <AccountReadonlyField>{user.email}</AccountReadonlyField>
            </AccountField>

            <AccountUploadCard>
              <AccountUploadMeta>
                <AccountUploadTitle>Changer d&apos;email</AccountUploadTitle>
                <AccountHelperText>
                  Pour des raisons de sécurité, on enverra le lien de validation sur
                  ton adresse actuelle avant d&apos;appliquer la modification.
                </AccountHelperText>
              </AccountUploadMeta>

              <AccountField>
                <AccountFieldLabel>Nouvel’email</AccountFieldLabel>
                <AccountInput
                  type="email"
                  value={emailChangeValue}
                  onChange={(event) => setEmailChangeValue(event.target.value)}
                  placeholder="nouvel-email@exemple.com"
                  autoComplete="email"
                />
              </AccountField>

              {emailChangeStatusMessage ? (
                <AccountStatusMessage>{emailChangeStatusMessage}</AccountStatusMessage>
              ) : null}

              {emailChangeErrorMessage ? (
                <AccountErrorMessage>{emailChangeErrorMessage}</AccountErrorMessage>
              ) : null}

              <AccountActions>
                <AccountGhostButton
                  type="button"
                  onClick={() => void handleEmailChangeSubmit()}
                  disabled={isEmailChangeSubmitting || emailChangeValue.trim() === ''}
                >
                  {isEmailChangeSubmitting ? 'Envoi en cours...' : 'Recevoir le mail de validation'}
                </AccountGhostButton>
              </AccountActions>
            </AccountUploadCard>

            <AccountUploadCard>
              <AccountUploadRow>
                <AccountUploadPreview $imageUrl={displayedProfilePhoto ?? undefined} />

                <AccountUploadMeta>
                  <AccountUploadTitle>Photo de profil</AccountUploadTitle>
                  <AccountHelperText>
                    Importe une image locale JPG, PNG ou WebP. Elle remplacera ton’avatar
                    actuel sur ton profil et dans la navigation.
                  </AccountHelperText>
                  {selectedProfilePhotoName ? (
                    <AccountHelperText>Image sélectionnée : {selectedProfilePhotoName}</AccountHelperText>
                  ) : null}
                </AccountUploadMeta>
              </AccountUploadRow>

              <AccountActions>
                <AccountGhostButton
                  type="button"
                    onClick={() => profilePhotoInputRef.current?.click()}
                >
                  Choisir une image
                </AccountGhostButton>

                {displayedProfilePhoto ? (
                  <AccountSecondaryButton type="button" onClick={handleRemoveProfilePhoto}>
                    Retirer la photo
                  </AccountSecondaryButton>
                ) : null}
              </AccountActions>

              <AccountHiddenFileInput
                ref={profilePhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoChange}
              />
            </AccountUploadCard>

            <AccountCheckboxRow>
              <AccountCheckbox
                type="checkbox"
                checked={profileForm.subscribeToNewsletter}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    subscribeToNewsletter: event.target.checked,
                  }))
                }
              />
              Recevoir la newsletter EventFlow, les promotions et les nouveautes.
            </AccountCheckboxRow>

            <AccountPrimaryButton type="submit" disabled={isSaving || isPreparingPhoto}>
              {isPreparingPhoto
                ? "Préparation de l’image..."
                : isSaving
                  ? 'Enregistrement...'
                  : 'Enregistrer mes modifications'}
            </AccountPrimaryButton>
          </AccountForm>

          <AccountInfoCard>
            <AccountLabel>Compte EventFlow</AccountLabel>
            <AccountMutedValue>
              Ton role actuel est {roleLabel.toLowerCase()} et ton compte est
              {` ${accountStatusLabel.toLowerCase()}. `}
              Les informations de vérification et les futurs changements sensibles du
              compte resteront centralises ici.
            </AccountMutedValue>
          </AccountInfoCard>
        </AccountFormCard>
      </AccountShell>
    </AccountSection>
  )
}
