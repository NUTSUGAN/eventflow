import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
          limit: 18,
          search: searchQuery || undefined,
        })

        if (isMounted) {
          setEvents(data)
        }
      } catch {
        if (isMounted) {
          setErrorMessage(
            "Impossible de charger les evenements pour le moment.",
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
          {searchQuery ? 'Resultats de recherche' : 'Evenements a venir'}
        </PageTitle>
        {searchQuery ? (
          <PageIntro>
            Evenements trouves pour <strong>{searchQuery}</strong>.
          </PageIntro>
        ) : null}
      </PageHeader>

      {isLoading ? (
        <LoadingStateText>
          Chargement des evenements depuis la base de donnees...
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
            <MoreEventsButton type="button">PLUS D&apos;EVENEMENTS</MoreEventsButton>
          </ActionRow>
        </>
      ) : (
        <EmptyStateText>
          {searchQuery
            ? "Aucun evenement ne correspond a cette recherche pour le moment."
            : "Aucun evenement publie n'est disponible pour le moment."}
        </EmptyStateText>
      )}

      <FeatureSpotlight />
    </PageSection>
  )
}
