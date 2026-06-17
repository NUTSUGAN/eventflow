import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { AdminPagination } from '../../components/AdminPagination/AdminPagination'
import { usePagination } from '../../hooks/usePagination'
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
  AdminOrganizerApplicationsSearch,
  AdminOrganizerApplicationsSection,
  AdminOrganizerApplicationsSecondaryButton,
  AdminOrganizerApplicationsState,
  AdminOrganizerApplicationsTab,
  AdminOrganizerApplicationsTabs,
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
      return 'Approuvée'
    case 'REJECTED':
      return 'Refusee'
    default:
      return 'En attente'
  }
}

type ApplicationsTabId = 'pending' | 'processed'
type ProcessedApplicationsFilterId = 'all' | 'rejected' | 'approved'

export function AdminOrganizerApplicationsPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [activeTab, setActiveTab] = useState<ApplicationsTabId>('pending')
  const [processedFilter, setProcessedFilter] =
    useState<ProcessedApplicationsFilterId>('all')
  const [applications, setApplications] = useState<AdminOrganizerApplication[]>([])
  const [searchQuery, setSearchQuery] = useState('')
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
          item.id === application.id ? response.application : item,
        ),
      )
      setStatusMessage(response.message)
    } catch {
      setErrorMessage('Impossible d’approuver cette demande pour le moment.')
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
          item.id === application.id ? response.application : item,
        ),
      )
      setStatusMessage(response.message)
    } catch {
      setErrorMessage(
        'Impossible de refuser cette demande tant qu’une note admin n’a pas été ajoutée.',
      )
    } finally {
      setIsSubmittingId(null)
    }
  }

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return applications.filter((application) => {
      const matchesTab = activeTab === 'pending'
        ? application.status === 'PENDING'
        : processedFilter === 'approved'
          ? application.status === 'APPROVED'
          : processedFilter === 'rejected'
            ? application.status === 'REJECTED'
            : application.status === 'APPROVED' || application.status === 'REJECTED'

      if (!matchesTab) {
        return false
      }

      if (query === '') {
        return true
      }

      const searchableText = [
        application.organizationName,
        application.city,
        application.motivation,
        application.website,
        application.instagramUrl,
        application.tiktokUrl,
        application.linkedinUrl,
        application.otherLinks,
        application.reviewNote,
        application.applicant.fullName,
        application.applicant.email,
        application.applicant.role,
        getStatusLabel(application.status),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [activeTab, applications, processedFilter, searchQuery])
  const applicationPagination = usePagination(filteredApplications, {
    pageSize: 20,
    resetKey: `${activeTab}-${processedFilter}-${searchQuery}`,
  })

  const pendingCount = useMemo(
    () => applications.filter((application) => application.status === 'PENDING').length,
    [applications],
  )

  const processedCount = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.status === 'APPROVED' || application.status === 'REJECTED',
      ).length,
    [applications],
  )

  const approvedCount = useMemo(
    () => applications.filter((application) => application.status === 'APPROVED').length,
    [applications],
  )

  const rejectedCount = useMemo(
    () => applications.filter((application) => application.status === 'REJECTED').length,
    [applications],
  )

  return (
    <AdminOrganizerApplicationsSection>
      <AdminOrganizerApplicationsHeader>
        <AdminOrganizerApplicationsEyebrow>Validation’admin</AdminOrganizerApplicationsEyebrow>
        <AdminOrganizerApplicationsTitle>Demandes organisateur</AdminOrganizerApplicationsTitle>
        <AdminOrganizerApplicationsText>
          Relis les justificatifs publics envoyés, ajoute un retour si besoin puis approuve ou refuse chaque demande. Une validation approuvée donne immédiatement le rôle organisateur au compte.
        </AdminOrganizerApplicationsText>
        <AdminOrganizerApplicationsActions>
          <AdminOrganizerApplicationsSecondaryButton
            type="button"
            onClick={() => navigate('/admin')}
          >
            Revenir à la console admin
          </AdminOrganizerApplicationsSecondaryButton>
        </AdminOrganizerApplicationsActions>
        {statusMessage ? (
          <AdminOrganizerApplicationsState>{statusMessage}</AdminOrganizerApplicationsState>
        ) : null}
        {errorMessage ? (
          <AdminOrganizerApplicationsState>{errorMessage}</AdminOrganizerApplicationsState>
        ) : null}
        <AdminOrganizerApplicationsTabs>
          <AdminOrganizerApplicationsTab
            type="button"
            $active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
          >
            En attente ({pendingCount})
          </AdminOrganizerApplicationsTab>
          <AdminOrganizerApplicationsTab
            type="button"
            $active={activeTab === 'processed'}
            onClick={() => setActiveTab('processed')}
          >
            Traitees ({processedCount})
          </AdminOrganizerApplicationsTab>
        </AdminOrganizerApplicationsTabs>
        {activeTab === 'processed' ? (
          <AdminOrganizerApplicationsTabs>
            <AdminOrganizerApplicationsTab
              type="button"
              $active={processedFilter === 'all'}
              onClick={() => setProcessedFilter('all')}
            >
              Toutes ({processedCount})
            </AdminOrganizerApplicationsTab>
            <AdminOrganizerApplicationsTab
              type="button"
              $active={processedFilter === 'rejected'}
              onClick={() => setProcessedFilter('rejected')}
            >
              Refusees ({rejectedCount})
            </AdminOrganizerApplicationsTab>
            <AdminOrganizerApplicationsTab
              type="button"
              $active={processedFilter === 'approved'}
              onClick={() => setProcessedFilter('approved')}
            >
              Approuvées ({approvedCount})
            </AdminOrganizerApplicationsTab>
          </AdminOrganizerApplicationsTabs>
        ) : null}
        <AdminOrganizerApplicationsSearch
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Rechercher par organisation, ville, email, statut..."
        />
      </AdminOrganizerApplicationsHeader>

      {isLoading ? (
        <AdminOrganizerApplicationsState>
          Chargement des demandes organisateur...
        </AdminOrganizerApplicationsState>
      ) : currentUser?.role !== 'ROLE_ADMIN' ? (
        <AdminOrganizerApplicationsState>
          Cette vue est réservée à l’administration EventFlow.
        </AdminOrganizerApplicationsState>
      ) : applications.length === 0 ? (
        <AdminOrganizerApplicationsState>
          Aucune demande organisateur pour le moment.
        </AdminOrganizerApplicationsState>
      ) : filteredApplications.length === 0 ? (
        <AdminOrganizerApplicationsState>
          {activeTab === 'pending'
            ? 'Aucune demande en’attente ne correspond à cette recherche.'
            : processedFilter === 'approved'
              ? 'Aucune demande approuvée ne correspond à cette recherche.'
              : processedFilter === 'rejected'
                ? 'Aucune demande refusée ne correspond à cette recherche.'
                : 'Aucune demande traitée ne correspond à cette recherche.'}
        </AdminOrganizerApplicationsState>
      ) : (
        <>
          <AdminOrganizerApplicationsList>
            {applicationPagination.paginatedItems.map((application) => (
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
                    <AdminOrganizerApplicationsBadge>
                      {application.applicant.role ?? 'ROLE_CLIENT'}
                    </AdminOrganizerApplicationsBadge>
                  </AdminOrganizerApplicationsMeta>
                  <AdminOrganizerApplicationsCardTitle>
                    {application.organizationName}
                  </AdminOrganizerApplicationsCardTitle>
                  <AdminOrganizerApplicationsApplicant>
                    {application.applicant.fullName} - {application.applicant.email}
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
                    placeholder="Retour interne ou message de retour pour l’organisateur..."
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
                    {application.status === 'APPROVED' ? 'Annuler le role' : 'Refuser'}
                  </AdminOrganizerApplicationsSecondaryButton>
                </AdminOrganizerApplicationsActions>
              </AdminOrganizerApplicationsCard>
            ))}
          </AdminOrganizerApplicationsList>
          <AdminPagination
            page={applicationPagination.page}
            pageSize={applicationPagination.pageSize}
            totalItems={filteredApplications.length}
            totalPages={applicationPagination.totalPages}
            itemLabel="demandes"
            onPageChange={applicationPagination.setPage}
          />
        </>
      )}
    </AdminOrganizerApplicationsSection>
  )
}
