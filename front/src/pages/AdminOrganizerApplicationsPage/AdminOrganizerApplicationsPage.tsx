import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import {
  approveOrganizerApplication,
  getAdminOrganizerApplications,
  rejectOrganizerApplication,
} from '../../api/organizerApplication'
import type { AuthUser } from '../../types/auth'
import type { AdminOrganizerApplication } from '../../types/organizerApplication'
import {
  AdminOrganizerApplicationsActions,
  AdminOrganizerApplicationsApplicant,
  AdminOrganizerApplicationsBadge,
  AdminOrganizerApplicationsCard,
  AdminOrganizerApplicationsCardTitle,
  AdminOrganizerApplicationsEyebrow,
  AdminOrganizerApplicationsGrid,
  AdminOrganizerApplicationsHeader,
  AdminOrganizerApplicationsInfoCard,
  AdminOrganizerApplicationsLabel,
  AdminOrganizerApplicationsList,
  AdminOrganizerApplicationsMeta,
  AdminOrganizerApplicationsPrimaryButton,
  AdminOrganizerApplicationsSection,
  AdminOrganizerApplicationsSecondaryButton,
  AdminOrganizerApplicationsState,
  AdminOrganizerApplicationsText,
  AdminOrganizerApplicationsTextarea,
  AdminOrganizerApplicationsTitle,
  AdminOrganizerApplicationsValue,
} from './adminOrganizerApplicationsPageElements'

function getStatusTone(
  status: AdminOrganizerApplication['status'],
): 'pending' | 'approved' | 'rejected' {
  switch (status) {
    case 'APPROVED':
      return 'approved'
    case 'REJECTED':
      return 'rejected'
    default:
      return 'pending'
  }
}

function getStatusLabel(status: AdminOrganizerApplication['status']): string {
  switch (status) {
    case 'APPROVED':
      return 'Approuvee'
    case 'REJECTED':
      return 'Refusee'
    default:
      return 'En attente'
  }
}

export function AdminOrganizerApplicationsPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [applications, setApplications] = useState<AdminOrganizerApplication[]>([])
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingId, setIsSubmittingId] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadApplications() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser()

        if (user.role !== 'ROLE_ADMIN') {
          navigate('/account', { replace: true })
          return
        }

        const nextApplications = await getAdminOrganizerApplications()

        if (isMounted) {
          setCurrentUser(user)
          setApplications(nextApplications)
          setReviewNotes(
            Object.fromEntries(
              nextApplications.map((application) => [
                application.id,
                application.reviewNote ?? '',
              ]),
            ),
          )
        }
      } catch {
        if (isMounted) {
          setErrorMessage(
            'Impossible de charger les demandes organisateur pour le moment.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadApplications()

    return () => {
      isMounted = false
    }
  }, [navigate])

  async function handleApprove(application: AdminOrganizerApplication) {
    setIsSubmittingId(application.id)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const response = await approveOrganizerApplication(application.id, {
        reviewNote: reviewNotes[application.id] ?? '',
      })

      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? { ...item, ...response.application, applicant: item.applicant }
            : item,
        ),
      )
      setStatusMessage(response.message)
    } catch {
      setErrorMessage('Impossible d approuver cette demande pour le moment.')
    } finally {
      setIsSubmittingId(null)
    }
  }

  async function handleReject(application: AdminOrganizerApplication) {
    setIsSubmittingId(application.id)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const response = await rejectOrganizerApplication(application.id, {
        reviewNote: reviewNotes[application.id] ?? '',
      })

      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? { ...item, ...response.application, applicant: item.applicant }
            : item,
        ),
      )
      setStatusMessage(response.message)
    } catch {
      setErrorMessage(
        'Impossible de refuser cette demande tant qu une note admin n a pas ete ajoutee.',
      )
    } finally {
      setIsSubmittingId(null)
    }
  }

  return (
    <AdminOrganizerApplicationsSection>
      <AdminOrganizerApplicationsHeader>
        <AdminOrganizerApplicationsEyebrow>Validation admin</AdminOrganizerApplicationsEyebrow>
        <AdminOrganizerApplicationsTitle>Demandes organisateur</AdminOrganizerApplicationsTitle>
        <AdminOrganizerApplicationsText>
          Relis les justificatifs publics envoyes, ajoute un retour si besoin puis approuve ou refuse chaque demande. Une validation approuvee donne immediatement le role organisateur au compte.
        </AdminOrganizerApplicationsText>
        {statusMessage ? (
          <AdminOrganizerApplicationsState>{statusMessage}</AdminOrganizerApplicationsState>
        ) : null}
        {errorMessage ? (
          <AdminOrganizerApplicationsState>{errorMessage}</AdminOrganizerApplicationsState>
        ) : null}
      </AdminOrganizerApplicationsHeader>

      {isLoading ? (
        <AdminOrganizerApplicationsState>
          Chargement des demandes organisateur...
        </AdminOrganizerApplicationsState>
      ) : currentUser?.role !== 'ROLE_ADMIN' ? (
        <AdminOrganizerApplicationsState>
          Cette vue est reservee a l administration EventFlow.
        </AdminOrganizerApplicationsState>
      ) : applications.length === 0 ? (
        <AdminOrganizerApplicationsState>
          Aucune demande organisateur pour le moment.
        </AdminOrganizerApplicationsState>
      ) : (
        <AdminOrganizerApplicationsList>
          {applications.map((application) => (
            <AdminOrganizerApplicationsCard key={application.id}>
              <div>
                <AdminOrganizerApplicationsMeta>
                  <AdminOrganizerApplicationsBadge
                    $tone={getStatusTone(application.status)}
                  >
                    {getStatusLabel(application.status)}
                  </AdminOrganizerApplicationsBadge>
                  <AdminOrganizerApplicationsBadge>
                    {application.city}
                  </AdminOrganizerApplicationsBadge>
                </AdminOrganizerApplicationsMeta>
                <AdminOrganizerApplicationsCardTitle>
                  {application.organizationName}
                </AdminOrganizerApplicationsCardTitle>
                <AdminOrganizerApplicationsApplicant>
                  {application.applicant.fullName} · {application.applicant.email}
                </AdminOrganizerApplicationsApplicant>
              </div>

              <AdminOrganizerApplicationsGrid>
                <AdminOrganizerApplicationsInfoCard>
                  <AdminOrganizerApplicationsLabel>Presentation</AdminOrganizerApplicationsLabel>
                  <AdminOrganizerApplicationsValue>
                    {application.motivation}
                  </AdminOrganizerApplicationsValue>
                </AdminOrganizerApplicationsInfoCard>
                <AdminOrganizerApplicationsInfoCard>
                  <AdminOrganizerApplicationsLabel>Liens publics</AdminOrganizerApplicationsLabel>
                  <AdminOrganizerApplicationsValue>
                    {[application.website, application.instagramUrl, application.tiktokUrl, application.linkedinUrl, application.otherLinks]
                      .filter(Boolean)
                      .join('\n') || 'Aucun lien'}
                  </AdminOrganizerApplicationsValue>
                </AdminOrganizerApplicationsInfoCard>
              </AdminOrganizerApplicationsGrid>

              <div>
                <AdminOrganizerApplicationsLabel>Note admin</AdminOrganizerApplicationsLabel>
                <AdminOrganizerApplicationsTextarea
                  value={reviewNotes[application.id] ?? ''}
                  placeholder="Retour interne ou message de retour pour l organisateur..."
                  onChange={(event) =>
                    setReviewNotes((current) => ({
                      ...current,
                      [application.id]: event.target.value,
                    }))
                  }
                />
              </div>

              <AdminOrganizerApplicationsActions>
                <AdminOrganizerApplicationsPrimaryButton
                  type="button"
                  disabled={isSubmittingId === application.id}
                  onClick={() => handleApprove(application)}
                >
                  {isSubmittingId === application.id ? 'Validation...' : 'Approuver'}
                </AdminOrganizerApplicationsPrimaryButton>
                <AdminOrganizerApplicationsSecondaryButton
                  type="button"
                  disabled={isSubmittingId === application.id}
                  onClick={() => handleReject(application)}
                >
                  Refuser
                </AdminOrganizerApplicationsSecondaryButton>
              </AdminOrganizerApplicationsActions>
            </AdminOrganizerApplicationsCard>
          ))}
        </AdminOrganizerApplicationsList>
      )}
    </AdminOrganizerApplicationsSection>
  )
}
