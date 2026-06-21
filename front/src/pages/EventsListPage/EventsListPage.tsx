import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getPublicEvents } from '../../api/events'
import { FeatureSpotlight } from '../../components/FeatureSpotlight/FeatureSpotlight'
import { EventCard } from '../../components/EventCard/EventCard'
import type { EventSummary } from '../../types/event'
import {
  ActionRow,
  CardsGrid,
  EmptyStateText,
  ErrorStateText,
  LoadingStateText,
  MoreEventsButton,
  PageIntro,
  PageHeader,
  PageSection,
  PageTitle,
} from './eventsListPageElements'

export function EventsListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const searchQuery = searchParams.get('search')?.trim() ?? ''

  useEffect(() => {
    let isMounted = true

    async function loadEvents() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const data = await getPublicEvents({
          limit: 12,
          search: searchQuery || undefined,
        })

        if (isMounted) {
          setEvents(data.items.slice(0, 3))
        }
      } catch {
        if (isMounted) {
          setErrorMessage(
            "Impossible de charger les événements pour le moment.",
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadEvents()

    return () => {
      isMounted = false
    }
  }, [searchQuery])

  return (
    <PageSection>
      <PageHeader>
        <PageTitle>
          {searchQuery ? 'Résultats de recherche' : 'Événements à venir'}
        </PageTitle>
        {searchQuery ? (
          <PageIntro>
            Événements trouvés pour <strong>{searchQuery}</strong>.
          </PageIntro>
        ) : null}
      </PageHeader>

      {isLoading ? (
        <LoadingStateText>
          Chargement des événements depuis la base de données...
        </LoadingStateText>
      ) : errorMessage ? (
        <ErrorStateText>{errorMessage}</ErrorStateText>
      ) : events.length > 0 ? (
        <>
          <CardsGrid>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </CardsGrid>

          <ActionRow>
            <MoreEventsButton type="button" onClick={() => navigate('/explorer')}>
              PLUS D&apos;ÉVÉNEMENTS
            </MoreEventsButton>
          </ActionRow>
        </>
      ) : (
        <EmptyStateText>
          {searchQuery
            ? "Aucun événement ne correspond à cette recherche pour le moment."
            : "Aucun événement publié n'est disponible pour le moment."}
        </EmptyStateText>
      )}

      <FeatureSpotlight />
    </PageSection>
  )
}
