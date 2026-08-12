import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  deleteCurrentUser,
  getCurrentUser,
  logoutUser,
  requestEmailChange,
  updateCurrentUser,
} from '../../api/auth'
import { canUseOrganizerAdminTools, isAdminUser } from '../../auth/adminPermissions'
import type { AuthUser } from '../../types/auth'
import {
  AccountActions,
  AccountAvatar,
  AccountBadgeRow,
  AccountCheckbox,
  AccountCheckboxRow,
  AccountDangerButton,
  AccountDangerPrimaryButton,
  AccountDecisionCard,
  AccountDecisionGrid,
  AccountDecisionList,
  AccountDecisionTitle,
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
  AccountModalActions,
  AccountModalBody,
  AccountModalCard,
  AccountModalEyebrow,
  AccountModalHeader,
  AccountModalOverlay,
  AccountModalText,
  AccountModalTitle,
  AccountModalWarning,
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
      return 'Super administrateur'
    case 'ROLE_ADMIN_SUPPORT':
      return 'Admin support'
    case 'ROLE_ADMIN_FINANCE':
      return 'Admin finance'
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

function maskEmailAddress(email: string): string {
  const [localPart, domain] = email.split('@')

  if (!localPart || !domain) {
    return email
  }

  if (localPart.length <= 4) {
    return `${localPart[0] ?? ''}${'•'.repeat(Math.max(localPart.length - 1, 1))}@${domain}`
  }

  const visibleStart = localPart.slice(0, 5)
  const visibleEnd = localPart.length > 8 ? localPart.slice(-4) : localPart.slice(-2)

  return `${visibleStart}${'•'.repeat(6)}${visibleEnd}@${domain}`
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
  const [deleteConfirmationValue, setDeleteConfirmationValue] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false)
  const [isEmailChangeSubmitting, setIsEmailChangeSubmitting] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [emailChangeErrorMessage, setEmailChangeErrorMessage] = useState<string | null>(null)
  const [emailChangeStatusMessage, setEmailChangeStatusMessage] = useState<string | null>(null)

  const hasOrganizerAccess =
    canUseOrganizerAdminTools(user)

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

  async function handleDeleteAccount() {
    if (isDeletingAccount) {
      return
    }

    if (deleteConfirmationValue.trim().toUpperCase() !== 'SUPPRIMER') {
      return
    }

    setIsDeletingAccount(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      await deleteCurrentUser()
      window.location.assign('/auth?mode=login&account=deleted')
    } catch {
      setErrorMessage('Impossible de supprimer ton compte pour le moment.')
      setIsDeletingAccount(false)
    }
  }

  function openDeleteAccountModal() {
    setDeleteConfirmationValue('')
    setIsDeleteModalOpen(true)
    setErrorMessage(null)
    setStatusMessage(null)
  }

  function closeDeleteAccountModal() {
    if (isDeletingAccount) {
      return
    }

    setDeleteConfirmationValue('')
    setIsDeleteModalOpen(false)
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
                Gère ton identité, ton avatar et tes préférences depuis un espace plus
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
            {isAdminUser(user) ? (
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
              <AccountReadonlyField>{maskEmailAddress(user.email)}</AccountReadonlyField>
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
                <AccountFieldLabel>Nouvel email</AccountFieldLabel>
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
                    Importe une image locale JPG, PNG ou WebP. Elle remplacera ton avatar
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
              Recevoir la newsletter EventFlow, les promotions et les nouveautés.
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
              Ton rôle actuel est {roleLabel.toLowerCase()} et ton compte est
              {` ${accountStatusLabel.toLowerCase()}. `}
              Les informations de vérification et les futurs changements sensibles du
              compte resteront centralisées ici.
            </AccountMutedValue>
          </AccountInfoCard>

          <AccountUploadCard>
            <AccountUploadMeta>
              <AccountUploadTitle>Supprimer mon compte</AccountUploadTitle>
              <AccountHelperText>
                Cette action désactive ton accès, retire tes données personnelles du profil
                et anonymise ton compte. Les commandes, paiements, billets et traces
                nécessaires aux obligations légales peuvent rester conservés.
              </AccountHelperText>
            </AccountUploadMeta>

            <AccountActions>
              <AccountDangerButton
                type="button"
                onClick={openDeleteAccountModal}
                disabled={isDeletingAccount}
              >
                Supprimer mon compte
              </AccountDangerButton>
            </AccountActions>
          </AccountUploadCard>
        </AccountFormCard>
      </AccountShell>

      {isDeleteModalOpen ? (
        <AccountModalOverlay>
          <AccountModalCard
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <AccountModalHeader>
              <AccountModalEyebrow>Action irréversible</AccountModalEyebrow>
              <AccountModalTitle id="delete-account-title">
                Confirmer la suppression du compte
              </AccountModalTitle>
              <AccountModalText>
                Tu t'apprêtes à supprimer le compte lié à{' '}
                <strong>{maskEmailAddress(user.email)}</strong>. Cette action ferme l'accès
                au compte et applique l'anonymisation RGPD sur les données personnelles.
              </AccountModalText>
            </AccountModalHeader>

            <AccountModalBody>
              <AccountDecisionGrid>
                <AccountDecisionCard $tone="danger">
                  <AccountDecisionTitle>Supprimé</AccountDecisionTitle>
                  <AccountDecisionList>
                    <li>Photo de profil</li>
                    <li>Connexion Google/OAuth</li>
                    <li>Abonnements organisateur</li>
                    <li>Accès au compte</li>
                  </AccountDecisionList>
                </AccountDecisionCard>

                <AccountDecisionCard $tone="warning">
                  <AccountDecisionTitle>Anonymisé</AccountDecisionTitle>
                  <AccountDecisionList>
                    <li>Nom et prénom</li>
                    <li>Email de connexion</li>
                    <li>Mot de passe</li>
                    <li>Destinataire des billets liés</li>
                  </AccountDecisionList>
                </AccountDecisionCard>

                <AccountDecisionCard>
                  <AccountDecisionTitle>Conservé</AccountDecisionTitle>
                  <AccountDecisionList>
                    <li>Commandes payées</li>
                    <li>Paiements et références Stripe</li>
                    <li>Billets déjà émis</li>
                    <li>Traces utiles aux obligations légales</li>
                  </AccountDecisionList>
                </AccountDecisionCard>
              </AccountDecisionGrid>

              <AccountModalWarning>
                Il restera donc une trace comptable et technique, mais elle ne doit plus
                permettre d'identifier directement la personne depuis son profil EventFlow.
              </AccountModalWarning>

              <AccountField>
                <AccountFieldLabel>Tape SUPPRIMER pour confirmer</AccountFieldLabel>
                <AccountInput
                  type="text"
                  value={deleteConfirmationValue}
                  onChange={(event) => setDeleteConfirmationValue(event.target.value)}
                  placeholder="SUPPRIMER"
                  autoComplete="off"
                />
              </AccountField>

              <AccountModalActions>
                <AccountSecondaryButton
                  type="button"
                  onClick={closeDeleteAccountModal}
                  disabled={isDeletingAccount}
                >
                  Annuler
                </AccountSecondaryButton>
                <AccountDangerPrimaryButton
                  type="button"
                  onClick={() => void handleDeleteAccount()}
                  disabled={
                    isDeletingAccount ||
                    deleteConfirmationValue.trim().toUpperCase() !== 'SUPPRIMER'
                  }
                >
                  {isDeletingAccount ? 'Suppression en cours...' : 'Confirmer la suppression'}
                </AccountDangerPrimaryButton>
              </AccountModalActions>
            </AccountModalBody>
          </AccountModalCard>
        </AccountModalOverlay>
      ) : null}
    </AccountSection>
  )
}
