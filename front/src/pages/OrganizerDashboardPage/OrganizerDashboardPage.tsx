import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { getMyOrganizerApplication } from '../../api/organizerApplication'
import {
  getMyOrganizerEvents,
  updateOrganizerEventStatus,
} from '../../api/organizerEvents'
import type { AuthUser } from '../../types/auth'
import type {
  OrganizerEventStatus,
  OrganizerEventSummary,
} from '../../types/organizerEvent'
import {
  OrganizerDashboardActions,
  OrganizerDashboardCard,
  OrganizerDashboardCardText,
  OrganizerDashboardCardTitle,
  OrganizerDashboardEyebrow,
  OrganizerDashboardEventBadge,
  OrganizerDashboardEventHeader,
  OrganizerDashboardEventMeta,
  OrganizerDashboardEventSelect,
  OrganizerDashboardEventStatusBlock,
  OrganizerDashboardEventStatusLabel,
  OrganizerDashboardEventTitle,
  OrganizerDashboardEventsSection,
  OrganizerDashboardGrid,
  OrganizerDashboardHero,
  OrganizerDashboardInlineState,
  OrganizerDashboardPrimaryButton,
  OrganizerDashboardSecondaryButton,
  OrganizerDashboardSection,
  OrganizerDashboardSectionHeader,
  OrganizerDashboardSectionTitle,
  OrganizerDashboardState,
  OrganizerDashboardText,
  OrganizerDashboardTitle,
} from './organizerDashboardPageElements'

function formatDashboardDate(date: string | null): string {
  if (!date) {
    return 'Date a confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function formatStatusLabel(status: string): string {
  if (status === 'published') {
    return 'Public'
  }

  return 'Brouillon'
}

export function OrganizerDashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [events, setEvents] = useState<OrganizerEventSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingEventId, setUpdatingEventId] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setIsLoading(true)

      try {
        const currentUser = await getCurrentUser(true)

        if (
          currentUser.role !== 'ROLE_ORGANIZER' &&
          currentUser.role !== 'ROLE_ADMIN'
        ) {
          const organizerState = await getMyOrganizerApplication()

          if (isMounted) {
            if (organizerState.application?.status === 'PENDING') {
              navigate('/organizer-access', { replace: true })
              return
            }

            navigate('/organizer-access', { replace: true })
          }

          return
        }

        if (isMounted) {
          setUser(currentUser)
        }
      } catch {
        if (isMounted) {
          navigate('/auth?mode=login&intent=organizer', { replace: true })
        }

        return
      }

      try {
        const organizerEvents = await getMyOrganizerEvents()

        if (isMounted) {
          setEvents(organizerEvents)
        }
      } catch {
        if (isMounted) {
          setEvents([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      isMounted = false
    }
  }, [navigate])

  async function handleStatusChange(eventId: number, nextStatus: OrganizerEventStatus) {
    setUpdatingEventId(eventId)
    setStatusMessage(null)

    try {
      const response = await updateOrganizerEventStatus(eventId, nextStatus)

      setEvents((current) =>
        current.map((event) => (event.id === eventId ? response.event : event)),
      )
      setStatusMessage(response.message)
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
      ) {
        setStatusMessage(
          String(
            (error as { response?: { data?: { message?: unknown } } }).response?.data?.message,
          ),
        )
      } else {
        setStatusMessage("Impossible de mettre a jour le statut de l'evenement pour le moment.")
      }
    } finally {
      setUpdatingEventId(null)
    }
  }

  return (
    <OrganizerDashboardSection>
      <OrganizerDashboardHero>
        <OrganizerDashboardEyebrow>Espace organisateur</OrganizerDashboardEyebrow>
        <OrganizerDashboardTitle>Ton acces organisateur est actif</OrganizerDashboardTitle>
        {isLoading ? (
          <OrganizerDashboardState>Chargement de ton espace organisateur...</OrganizerDashboardState>
        ) : (
          <>
            <OrganizerDashboardText>
              {user
                ? `Bienvenue ${user.firstName}. Cet espace devient maintenant ton point d entree organisateur EventFlow. On y branchera ensuite la creation d evenements, la gestion des billets et le suivi des performances.`
                : 'Chargement de ton espace organisateur.'}
            </OrganizerDashboardText>

            <OrganizerDashboardActions>
              <OrganizerDashboardPrimaryButton
                type="button"
                onClick={() => navigate('/organizer/events/new')}
              >
                Creer un evenement
              </OrganizerDashboardPrimaryButton>
              {user?.canManageStaff ? (
                <OrganizerDashboardSecondaryButton
                  type="button"
                  onClick={() => navigate('/organizer/staff')}
                >
                  Gerer mon staff
                </OrganizerDashboardSecondaryButton>
              ) : null}
              {user?.canAccessStaffTools ? (
                <OrganizerDashboardSecondaryButton
                  type="button"
                  onClick={() => navigate('/staff/scan')}
                >
                  Scanner les billets
                </OrganizerDashboardSecondaryButton>
              ) : null}
              <OrganizerDashboardSecondaryButton
                type="button"
                onClick={() => navigate('/organizer/events')}
              >
                Voir mes evenements
              </OrganizerDashboardSecondaryButton>
              <OrganizerDashboardSecondaryButton
                type="button"
                onClick={() => navigate('/explorer')}
              >
                Voir les evenements publics
              </OrganizerDashboardSecondaryButton>
              <OrganizerDashboardSecondaryButton
                type="button"
                onClick={() => navigate('/account')}
              >
                Revenir a mon profil
              </OrganizerDashboardSecondaryButton>
              {user?.role === 'ROLE_ADMIN' ? (
                <OrganizerDashboardSecondaryButton
                  type="button"
                  onClick={() => navigate('/admin/organizer-applications')}
                >
                  Relire les demandes organisateur
                </OrganizerDashboardSecondaryButton>
              ) : null}
            </OrganizerDashboardActions>

            <OrganizerDashboardGrid>
              <OrganizerDashboardCard>
                <OrganizerDashboardCardTitle>Acces valide</OrganizerDashboardCardTitle>
                <OrganizerDashboardCardText>
                  Ton compte peut maintenant basculer vers les futures fonctions de publication et de gestion d evenements.
                </OrganizerDashboardCardText>
              </OrganizerDashboardCard>
              <OrganizerDashboardCard>
                <OrganizerDashboardCardTitle>Creation d evenement</OrganizerDashboardCardTitle>
                <OrganizerDashboardCardText>
                  Tu peux maintenant creer un evenement complet, puis l ouvrir dans un espace dedie pour modifier les informations essentielles.
                </OrganizerDashboardCardText>
              </OrganizerDashboardCard>
              <OrganizerDashboardCard>
                <OrganizerDashboardCardTitle>Billetterie et suivi</OrganizerDashboardCardTitle>
                <OrganizerDashboardCardText>
                  L etape suivante sera de brancher les billets, le stock et la preparation de commande a partir de ces fiches evenement.
                </OrganizerDashboardCardText>
              </OrganizerDashboardCard>
            </OrganizerDashboardGrid>

            <OrganizerDashboardEventsSection>
              <OrganizerDashboardSectionHeader>
                <OrganizerDashboardSectionTitle>Derniers evenements</OrganizerDashboardSectionTitle>
                <OrganizerDashboardSecondaryButton
                  type="button"
                  onClick={() => navigate('/organizer/events')}
                >
                  Ouvrir la gestion complete
                </OrganizerDashboardSecondaryButton>
              </OrganizerDashboardSectionHeader>

              {statusMessage ? (
                <OrganizerDashboardInlineState>{statusMessage}</OrganizerDashboardInlineState>
              ) : null}

              <OrganizerDashboardGrid>
                {events.length > 0 ? (
                  events.map((event) => (
                    <OrganizerDashboardCard key={event.id}>
                      <OrganizerDashboardEventHeader>
                        <OrganizerDashboardEventBadge>
                          {formatStatusLabel(event.status)}
                        </OrganizerDashboardEventBadge>
                        <OrganizerDashboardEventStatusBlock>
                          <OrganizerDashboardEventStatusLabel>
                            Statut
                          </OrganizerDashboardEventStatusLabel>
                          <OrganizerDashboardEventSelect
                            value={event.status}
                            onChange={(changeEvent) =>
                              void handleStatusChange(
                                event.id,
                                changeEvent.target.value as OrganizerEventStatus,
                              )
                            }
                            disabled={updatingEventId === event.id}
                          >
                            <option value="draft">Brouillon</option>
                            <option value="published">Public</option>
                          </OrganizerDashboardEventSelect>
                        </OrganizerDashboardEventStatusBlock>
                      </OrganizerDashboardEventHeader>
                      <OrganizerDashboardEventTitle>{event.title}</OrganizerDashboardEventTitle>
                      <OrganizerDashboardSecondaryButton
                        type="button"
                        onClick={() => navigate(`/organizer/events/${event.id}`)}
                      >
                        Ouvrir la fiche
                      </OrganizerDashboardSecondaryButton>
                      <OrganizerDashboardEventMeta>
                        {event.category.name ?? 'Categorie'} - {event.location.city ?? 'Ville'}
                      </OrganizerDashboardEventMeta>
                      <OrganizerDashboardEventMeta>
                        {formatDashboardDate(event.startDatetime)}
                      </OrganizerDashboardEventMeta>
                      <OrganizerDashboardEventMeta>
                        {event.ticketTypesCount} billet(s) pour le moment
                      </OrganizerDashboardEventMeta>
                    </OrganizerDashboardCard>
                  ))
                ) : (
                  <OrganizerDashboardCard>
                    <OrganizerDashboardCardTitle>Premiere publication</OrganizerDashboardCardTitle>
                    <OrganizerDashboardCardText>
                      Tu n as pas encore d evenement sur ton espace organisateur. Cree
                      le premier pour enchainer ensuite avec les billets et la
                      preparation de commande.
                    </OrganizerDashboardCardText>
                  </OrganizerDashboardCard>
                )}
              </OrganizerDashboardGrid>
            </OrganizerDashboardEventsSection>
          </>
        )}
      </OrganizerDashboardHero>
    </OrganizerDashboardSection>
  )
}
