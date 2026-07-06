import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { canUseOrganizerAdminTools } from '../../auth/adminPermissions'
import { getBackendPublicUrl } from '../../api/client'
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
  OrganizerEventsPageActions,
  OrganizerEventsPageBadge,
  OrganizerEventsPageCard,
  OrganizerEventsPageCardBody,
  OrganizerEventsPageCardCover,
  OrganizerEventsPageCardTitleButton,
  OrganizerEventsPageCardTop,
  OrganizerEventsPageError,
  OrganizerEventsPageEyebrow,
  OrganizerEventsPageFilter,
  OrganizerEventsPageFilters,
  OrganizerEventsPageFooter,
  OrganizerEventsPageGrid,
  OrganizerEventsPageHero,
  OrganizerEventsPageMeta,
  OrganizerEventsPageOpenButton,
  OrganizerEventsPagePrimaryButton,
  OrganizerEventsPageSection,
  OrganizerEventsPageSecondaryButton,
  OrganizerEventsPageSelect,
  OrganizerEventsPageShell,
  OrganizerEventsPageState,
  OrganizerEventsPageStatusBlock,
  OrganizerEventsPageStatusLabel,
  OrganizerEventsPageText,
  OrganizerEventsPageTitle,
  OrganizerEventsPageToolbar,
  OrganizerEventsPageToolbarText,
  OrganizerEventsPageToolbarTitle,
  OrganizerEventsPageToolbarTop,
} from './organizerEventsPageElements'

type OrganizerEventsFilter = 'all' | 'published' | 'draft' | 'past'

function formatOrganizerEventDate(date: string | null): string {
  if (!date) {
    return 'Date à confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

function formatStatusLabel(status: OrganizerEventStatus | string): string {
  return status === 'published' ? 'Public' : 'Brouillon'
}

function isPastEvent(event: OrganizerEventSummary): boolean {
  const referenceDate = event.endDatetime ?? event.startDatetime

  if (!referenceDate) {
    return false
  }

  return new Date(referenceDate).getTime() < Date.now()
}

function matchesFilter(
  event: OrganizerEventSummary,
  filter: OrganizerEventsFilter,
): boolean {
  if (filter === 'all') {
    return true
  }

  if (filter === 'past') {
    return isPastEvent(event)
  }

  return event.status === filter
}

function resolveMediaUrl(path: string | null): string | undefined {
  if (!path) {
    return undefined
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${getBackendPublicUrl()}${normalizedPath}`
}

export function OrganizerEventsPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [events, setEvents] = useState<OrganizerEventSummary[]>([])
  const [activeFilter, setActiveFilter] = useState<OrganizerEventsFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [updatingEventId, setUpdatingEventId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadOrganizerEventsPage() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (!canUseOrganizerAdminTools(user)) {
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

        const organizerEvents = await getMyOrganizerEvents()

        if (isMounted) {
          setCurrentUser(user)
          setEvents(organizerEvents)
        }
      } catch {
        if (isMounted) {
          setErrorMessage(
            "Impossible de charger tes évènements organisateur pour le moment.",
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadOrganizerEventsPage()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const filteredEvents = useMemo(
    () => events.filter((event) => matchesFilter(event, activeFilter)),
    [activeFilter, events],
  )

  async function handleStatusChange(
    eventId: number,
    nextStatus: OrganizerEventStatus,
  ) {
    setUpdatingEventId(eventId)
    setStatusMessage(null)
    setErrorMessage(null)

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
        setErrorMessage(
          String(
            (error as { response?: { data?: { message?: unknown } } }).response?.data
              ?.message,
          ),
        )
      } else {
        setErrorMessage(
          "Impossible de mettre à jour le statut de l’évènement pour le moment.",
        )
      }
    } finally {
      setUpdatingEventId(null)
    }
  }

  return (
    <OrganizerEventsPageSection>
      <OrganizerEventsPageShell>
        <OrganizerEventsPageHero>
          <OrganizerEventsPageEyebrow>Espace organisateur</OrganizerEventsPageEyebrow>
          <OrganizerEventsPageTitle>Mes évènements</OrganizerEventsPageTitle>
          <OrganizerEventsPageText>
            {currentUser
              ? `${currentUser.firstName}, tu peux maintenant piloter tes fiches événement sur une vraie page de gestion, puis ouvrir chaque événement pour modifier ses informations légères.`
              : "Retrouve ici tous tes évènements, leur statut de publication et l’accès à chaque fiche détail."}
          </OrganizerEventsPageText>
          <OrganizerEventsPageActions>
            <OrganizerEventsPagePrimaryButton
              type="button"
              onClick={() => navigate('/organizer/events/new')}
            >
              Créer un évènement
            </OrganizerEventsPagePrimaryButton>
            <OrganizerEventsPageSecondaryButton
              type="button"
              onClick={() => navigate('/organizer/dashboard')}
            >
              Revenir au dashboard
            </OrganizerEventsPageSecondaryButton>
            <OrganizerEventsPageSecondaryButton
              type="button"
              onClick={() => navigate('/explorer')}
            >
              Voir les évènements publics
            </OrganizerEventsPageSecondaryButton>
          </OrganizerEventsPageActions>
        </OrganizerEventsPageHero>

        {errorMessage ? <OrganizerEventsPageError>{errorMessage}</OrganizerEventsPageError> : null}
        {statusMessage ? (
          <OrganizerEventsPageState>{statusMessage}</OrganizerEventsPageState>
        ) : null}

        <OrganizerEventsPageToolbar>
          <OrganizerEventsPageToolbarTop>
            <div>
              <OrganizerEventsPageToolbarTitle>
                {filteredEvents.length} évènement(s) affiché(s)
              </OrganizerEventsPageToolbarTitle>
              <OrganizerEventsPageToolbarText>
                Filtre par statut ou par temporalité, puis ouvre la fiche d'un évènement pour ajuster le titre, le lieu, les dates ou la catégorie.
              </OrganizerEventsPageToolbarText>
            </div>
          </OrganizerEventsPageToolbarTop>

          <OrganizerEventsPageFilters>
            <OrganizerEventsPageFilter
              type="button"
              $active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            >
              Tous
            </OrganizerEventsPageFilter>
            <OrganizerEventsPageFilter
              type="button"
              $active={activeFilter === 'published'}
              onClick={() => setActiveFilter('published')}
            >
              Public
            </OrganizerEventsPageFilter>
            <OrganizerEventsPageFilter
              type="button"
              $active={activeFilter === 'draft'}
              onClick={() => setActiveFilter('draft')}
            >
              Brouillon
            </OrganizerEventsPageFilter>
            <OrganizerEventsPageFilter
              type="button"
              $active={activeFilter === 'past'}
              onClick={() => setActiveFilter('past')}
            >
              Passé
            </OrganizerEventsPageFilter>
          </OrganizerEventsPageFilters>
        </OrganizerEventsPageToolbar>

        {isLoading ? (
          <OrganizerEventsPageState>
            Chargement de tes évènements organisateur...
          </OrganizerEventsPageState>
        ) : (
          <OrganizerEventsPageGrid>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <OrganizerEventsPageCard key={event.id}>
                  <OrganizerEventsPageCardCover
                    type="button"
                    $imageUrl={resolveMediaUrl(event.coverPhoto ?? event.thumbnailPhoto)}
                    onClick={() => navigate(`/organizer/events/${event.id}`)}
                    aria-label={`Ouvrir la fiche de ${event.title}`}
                  />
                  <OrganizerEventsPageCardBody>
                    <OrganizerEventsPageCardTop>
                      <OrganizerEventsPageBadge $published={event.status === 'published'}>
                        {formatStatusLabel(event.status)}
                      </OrganizerEventsPageBadge>
                      <OrganizerEventsPageStatusBlock>
                        <OrganizerEventsPageStatusLabel>Statut</OrganizerEventsPageStatusLabel>
                        <OrganizerEventsPageSelect
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
                        </OrganizerEventsPageSelect>
                      </OrganizerEventsPageStatusBlock>
                    </OrganizerEventsPageCardTop>

                    <OrganizerEventsPageCardTitleButton
                      type="button"
                      onClick={() => navigate(`/organizer/events/${event.id}`)}
                    >
                      {event.title}
                    </OrganizerEventsPageCardTitleButton>

                    <OrganizerEventsPageMeta>
                      {event.category.name ?? 'Catégorie'} - {event.location.city ?? 'Ville'}
                    </OrganizerEventsPageMeta>
                    <OrganizerEventsPageMeta>
                      {formatOrganizerEventDate(event.startDatetime)}
                    </OrganizerEventsPageMeta>
                    <OrganizerEventsPageMeta>
                      {event.ticketTypesCount} billet(s) pour le moment
                    </OrganizerEventsPageMeta>

                    <OrganizerEventsPageFooter>
                      <OrganizerEventsPageMeta>
                        {isPastEvent(event)
                          ? 'évènement déjà passé'
                          : event.status === 'published'
                            ? 'Visible dans l’espace public'
                            : 'Encore en brouillon'}
                      </OrganizerEventsPageMeta>
                      <OrganizerEventsPageOpenButton
                        type="button"
                        onClick={() => navigate(`/organizer/events/${event.id}`)}
                      >
                        Ouvrir la fiche
                      </OrganizerEventsPageOpenButton>
                    </OrganizerEventsPageFooter>
                  </OrganizerEventsPageCardBody>
                </OrganizerEventsPageCard>
              ))
            ) : (
              <OrganizerEventsPageState>
                {events.length === 0
                  ? "Tu n’as pas encore créé d’évènement. Lance la première fiche pour enchaîner ensuite sur les billets."
                  : "Aucun évènement ne correspond au filtre en cours. Essaie un’autre statut ou reviens sur l’onglet Tous."}
              </OrganizerEventsPageState>
            )}
          </OrganizerEventsPageGrid>
        )}
      </OrganizerEventsPageShell>
    </OrganizerEventsPageSection>
  )
}
