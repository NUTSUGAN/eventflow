import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import {
  getMyOrganizerApplication,
  submitOrganizerApplication,
} from '../../api/organizerApplication'
import type { AuthUser } from '../../types/auth'
import type {
  OrganizerApplication,
  OrganizerApplicationPayload,
  OrganizerApplicationStatus,
} from '../../types/organizerApplication'
import {
  OrganizerAccessActions,
  OrganizerAccessApplicationSummary,
  OrganizerAccessCard,
  OrganizerAccessErrorState,
  OrganizerAccessEyebrow,
  OrganizerAccessField,
  OrganizerAccessFieldLabel,
  OrganizerAccessForm,
  OrganizerAccessFormGrid,
  OrganizerAccessHint,
  OrganizerAccessInfoCard,
  OrganizerAccessInfoLabel,
  OrganizerAccessInfoValue,
  OrganizerAccessInput,
  OrganizerAccessPrimaryButton,
  OrganizerAccessSecondaryButton,
  OrganizerAccessSection,
  OrganizerAccessState,
  OrganizerAccessSuccessState,
  OrganizerAccessText,
  OrganizerAccessTextarea,
  OrganizerAccessTitle,
} from './organizerAccessPageElements'

const initialForm: OrganizerApplicationPayload = {
  organizationName: '',
  city: '',
  phone: '',
  website: '',
  instagramUrl: '',
  tiktokUrl: '',
  linkedinUrl: '',
  otherLinks: '',
  motivation: '',
}

function getStatusLabel(status: OrganizerApplicationStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'Approuvée'
    case 'REJECTED':
      return 'A reprendre'
    default:
      return 'En attente'
  }
}

function buildFormFromApplication(
  application: OrganizerApplication | null,
): OrganizerApplicationPayload {
  if (!application) {
    return initialForm
  }

  return {
    organizationName: application.organizationName,
    city: application.city,
    phone: application.phone ?? '',
    website: application.website ?? '',
    instagramUrl: application.instagramUrl ?? '',
    tiktokUrl: application.tiktokUrl ?? '',
    linkedinUrl: application.linkedinUrl ?? '',
    otherLinks: application.otherLinks ?? '',
    motivation: application.motivation,
  }
}

export function OrganizerAccessPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [application, setApplication] = useState<OrganizerApplication | null>(null)
  const [form, setForm] = useState<OrganizerApplicationPayload>(initialForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadOrganizerAccessState() {
      setIsLoading(true)
      setErrorMessage(null)
      setStatusMessage(null)

      try {
        const currentUser = await getCurrentUser(true)
        const organizerState = await getMyOrganizerApplication()

        if (
          currentUser.role === 'ROLE_ORGANIZER' ||
          currentUser.role === 'ROLE_ADMIN'
        ) {
          if (isMounted) {
            navigate('/organizer/dashboard', { replace: true })
          }

          return
        }

        if (isMounted) {
          setUser(currentUser)
          setApplication(organizerState.application)
          setForm(buildFormFromApplication(organizerState.application))
        }
      } catch {
        if (isMounted) {
          setUser(null)
          setApplication(null)
          setErrorMessage(
            'Connecte-toi d’abord pour préparer ta demande organisateur.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadOrganizerAccessState()

    return () => {
      isMounted = false
    }
  }, [navigate])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const response = await submitOrganizerApplication(form)
      setApplication(response.application)
      setForm(buildFormFromApplication(response.application))
      setStatusMessage(response.message)
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data
          ?.message === 'string'
      ) {
        setErrorMessage(
          (error as { response?: { data?: { message?: string } } }).response?.data
            ?.message ?? 'Impossible d’envoyer la demande pour le moment.',
        )
      } else {
        setErrorMessage('Impossible d’envoyer la demande pour le moment.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasOrganizerAccess =
    user?.role === 'ROLE_ORGANIZER' || user?.role === 'ROLE_ADMIN'

  return (
    <OrganizerAccessSection>
      <OrganizerAccessCard>
        <OrganizerAccessEyebrow>Accès organisateur</OrganizerAccessEyebrow>
        <OrganizerAccessTitle>
          {hasOrganizerAccess ? 'Ton espace organisateur est actif' : 'Demande ton accès organisateur'}
        </OrganizerAccessTitle>

        {isLoading ? (
          <OrganizerAccessState>Vérification de ton compte et de ta demande en cours...</OrganizerAccessState>
        ) : errorMessage && !user ? (
          <>
            <OrganizerAccessErrorState>{errorMessage}</OrganizerAccessErrorState>
            <OrganizerAccessActions>
              <OrganizerAccessPrimaryButton
                type="button"
                onClick={() => navigate('/auth?mode=register&intent=organizer')}
              >
                Se connecter / S’inscrire
              </OrganizerAccessPrimaryButton>
            </OrganizerAccessActions>
          </>
        ) : hasOrganizerAccess ? (
          <>
            <OrganizerAccessSuccessState>
              Ton profil dispose déjà d’un accès organisateur valide. On te fait maintenant entrer dans un espace dédié, séparé du formulaire de demande.
            </OrganizerAccessSuccessState>
            <OrganizerAccessActions>
              <OrganizerAccessPrimaryButton
                type="button"
                onClick={() => navigate('/organizer/dashboard')}
              >
                Ouvrir mon espace organisateur
              </OrganizerAccessPrimaryButton>
              {user?.role === 'ROLE_ADMIN' ? (
                <OrganizerAccessSecondaryButton
                  type="button"
                  onClick={() => navigate('/admin/organizer-applications')}
                >
                  Relire les demandes admin
                </OrganizerAccessSecondaryButton>
              ) : null}
            </OrganizerAccessActions>
          </>
        ) : (
          <>
            <OrganizerAccessText>
              Renseigne les liens publics et les informations qui permettront à l’équipe EventFlow de vérifier que ton activité est bien réelle. Une fois ta demande envoyée, un admin la relira avant activation de ton accès organisateur.
            </OrganizerAccessText>

            {application ? (
              <OrganizerAccessApplicationSummary>
                <OrganizerAccessInfoCard>
                  <OrganizerAccessInfoLabel>Statut</OrganizerAccessInfoLabel>
                  <OrganizerAccessInfoValue>
                    {getStatusLabel(application.status)}
                  </OrganizerAccessInfoValue>
                </OrganizerAccessInfoCard>
                <OrganizerAccessInfoCard>
                  <OrganizerAccessInfoLabel>Structure</OrganizerAccessInfoLabel>
                  <OrganizerAccessInfoValue>
                    {application.organizationName}
                  </OrganizerAccessInfoValue>
                </OrganizerAccessInfoCard>
                <OrganizerAccessInfoCard>
                  <OrganizerAccessInfoLabel>Ville</OrganizerAccessInfoLabel>
                  <OrganizerAccessInfoValue>{application.city}</OrganizerAccessInfoValue>
                </OrganizerAccessInfoCard>
              </OrganizerAccessApplicationSummary>
            ) : null}

            {application?.status === 'PENDING' ? (
              <OrganizerAccessState>
                Ta demande est en attente de vérification. Tu peux encore ajuster les informations ci-dessous si tu veux la compléter.
              </OrganizerAccessState>
            ) : null}

            {application?.status === 'REJECTED' ? (
              <OrganizerAccessErrorState>
                {application.reviewNote
                  ? `Retour de l’équipe: ${application.reviewNote}`
                  : 'La demande doit être complétée avant une nouvelle vérification.'}
              </OrganizerAccessErrorState>
            ) : null}

            {statusMessage ? (
              <OrganizerAccessSuccessState>{statusMessage}</OrganizerAccessSuccessState>
            ) : null}
            {errorMessage && user ? (
              <OrganizerAccessErrorState>{errorMessage}</OrganizerAccessErrorState>
            ) : null}

            <OrganizerAccessForm onSubmit={handleSubmit}>
              <OrganizerAccessFormGrid>
                <OrganizerAccessField>
                  <OrganizerAccessFieldLabel>Nom de la structure</OrganizerAccessFieldLabel>
                  <OrganizerAccessInput
                    type="text"
                    value={form.organizationName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        organizationName: event.target.value,
                      }))
                    }
                    required
                  />
                </OrganizerAccessField>

                <OrganizerAccessField>
                  <OrganizerAccessFieldLabel>Ville</OrganizerAccessFieldLabel>
                  <OrganizerAccessInput
                    type="text"
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                    required
                  />
                </OrganizerAccessField>
              </OrganizerAccessFormGrid>

              <OrganizerAccessFormGrid>
                <OrganizerAccessField>
                  <OrganizerAccessFieldLabel>Telephone</OrganizerAccessFieldLabel>
                  <OrganizerAccessInput
                    type="tel"
                    value={form.phone ?? ''}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </OrganizerAccessField>

                <OrganizerAccessField>
                  <OrganizerAccessFieldLabel>Site web</OrganizerAccessFieldLabel>
                  <OrganizerAccessInput
                    type="url"
                    placeholder="https://..."
                    value={form.website ?? ''}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        website: event.target.value,
                      }))
                    }
                  />
                </OrganizerAccessField>
              </OrganizerAccessFormGrid>

              <OrganizerAccessFormGrid>
                <OrganizerAccessField>
                  <OrganizerAccessFieldLabel>Instagram</OrganizerAccessFieldLabel>
                  <OrganizerAccessInput
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={form.instagramUrl ?? ''}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        instagramUrl: event.target.value,
                      }))
                    }
                  />
                </OrganizerAccessField>

                <OrganizerAccessField>
                  <OrganizerAccessFieldLabel>TikTok</OrganizerAccessFieldLabel>
                  <OrganizerAccessInput
                    type="url"
                    placeholder="https://tiktok.com/@..."
                    value={form.tiktokUrl ?? ''}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tiktokUrl: event.target.value,
                      }))
                    }
                  />
                </OrganizerAccessField>
              </OrganizerAccessFormGrid>

              <OrganizerAccessField>
                <OrganizerAccessFieldLabel>LinkedIn</OrganizerAccessFieldLabel>
                <OrganizerAccessInput
                  type="url"
                  placeholder="https://linkedin.com/..."
                  value={form.linkedinUrl ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      linkedinUrl: event.target.value,
                    }))
                  }
                />
              </OrganizerAccessField>

              <OrganizerAccessField>
                <OrganizerAccessFieldLabel>Autres liens utiles</OrganizerAccessFieldLabel>
                <OrganizerAccessTextarea
                  value={form.otherLinks ?? ''}
                  placeholder="Billetterie precedente, page Facebook, dossier de presse, portfolio..."
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      otherLinks: event.target.value,
                    }))
                  }
                />
              </OrganizerAccessField>

              <OrganizerAccessField>
                <OrganizerAccessFieldLabel>Presentation de l’activité</OrganizerAccessFieldLabel>
                <OrganizerAccessTextarea
                  value={form.motivation}
                  placeholder="Decris ton activité, le type d’évènements organises et ce que tu veux publiér sur EventFlow."
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      motivation: event.target.value,
                    }))
                  }
                  required
                />
              </OrganizerAccessField>

              <OrganizerAccessHint>
                Les liens publics restent optionnels, mais’ils peuvent aider l’équipe EventFlow à vérifier ton activité plus rapidement.
              </OrganizerAccessHint>

              <OrganizerAccessActions>
                <OrganizerAccessPrimaryButton type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Envoi en cours...'
                    : application
                      ? 'Mettre à jour ma demande'
                      : 'Envoyer ma demande'}
                </OrganizerAccessPrimaryButton>
                <OrganizerAccessSecondaryButton
                  type="button"
                  onClick={() => navigate('/account')}
                >
                  Revenir à mon profil
                </OrganizerAccessSecondaryButton>
              </OrganizerAccessActions>
            </OrganizerAccessForm>
          </>
        )}
      </OrganizerAccessCard>
    </OrganizerAccessSection>
  )
}
