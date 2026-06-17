import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getPublicEvents } from '../../api/events'
import { FeatureSpotlight } from '../../components/FeatureSpotlight/FeatureSpotlight'
import { EventCard } from '../../components/EventCard/EventCard'
import type { EventSummary, PublicEventsResponse } from '../../types/event'
import {
  ExplorerCardsGrid,
  ExplorerErrorText,
  ExplorerEyebrow,
  ExplorerHeader,
  ExplorerLead,
  ExplorerSection,
  ExplorerStateText,
  ExplorerTitle,
  FilterGroup,
  FilterLabel,
  FilterMetaRow,
  FilterResetButton,
  FilterSummary,
  FilterTextInput,
  FilterToolbar,
  PaginationButton,
  PaginationControls,
  PaginationEllipsis,
  PaginationRow,
  PaginationSummary,
  SearchBadge,
} from '../ExplorerPage/explorerPageElements'

const emptyPublicEventsResponse: PublicEventsResponse = {
  items: [],
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
}

function formatResultsCount(visibleCount: number, totalCount: number): string {
  if (totalCount <= 0) {
    return 'Aucun évènement archivé trouve'
  }

  const visibleLabel =
    visibleCount > 1 ? `${visibleCount} événements affichés` : `${visibleCount} événement affiché`
  const totalLabel =
    totalCount > 1 ? `${totalCount} événements archivés` : `${totalCount} événement archive`

  return `${visibleLabel} sur ${totalLabel}`
}

function buildPaginationTokens(currentPage: number, totalPages: number): Array<number | string> {
  if (totalPages <= 1) {
    return [1]
  }

  const pages = new Set<number>([
    1,
    totalPages,
    Math.max(1, currentPage - 1),
    currentPage,
    Math.min(totalPages, currentPage + 1),
  ])

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right)

  const tokens: Array<number | string> = []

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1]

    if (previousPage && page - previousPage > 1) {
      tokens.push(`ellipsis-${previousPage}-${page}`)
    }

    tokens.push(page)
  })

  return tokens
}

export function PastEventsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [pagination, setPagination] = useState<PublicEventsResponse>(emptyPublicEventsResponse)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const searchQuery = searchParams.get('search')?.trim() ?? ''
  const currentPage = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)

  useEffect(() => {
    let isMounted = true

    async function loadArchivedEvents() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const data = await getPublicEvents({
          scope: 'archive',
          limit: 9,
          page: currentPage,
          search: searchQuery || undefined,
        })

        if (isMounted) {
          setEvents(data.items)
          setPagination(data)
        }
      } catch {
        if (isMounted) {
          setEvents([])
          setPagination(emptyPublicEventsResponse)
          setErrorMessage(
            "Impossible de charger la corbeille publique pour le moment.",
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadArchivedEvents()

    return () => {
      isMounted = false
    }
  }, [currentPage, searchQuery])

  function updateSearch(value: string) {
    const nextParams = new URLSearchParams(searchParams)

    if (value.trim() === '') {
      nextParams.delete('search')
    } else {
      nextParams.set('search', value)
    }

    nextParams.delete('page')
    setSearchParams(nextParams)
  }

  function updatePage(page: number) {
    const nextPage = Math.max(1, Math.min(page, pagination.totalPages))
    const nextParams = new URLSearchParams(searchParams)

    if (nextPage <= 1) {
      nextParams.delete('page')
    } else {
      nextParams.set('page', String(nextPage))
    }

    setSearchParams(nextParams)
  }

  function resetSearch() {
    setSearchParams(new URLSearchParams())
  }

  const paginationTokens = useMemo(
    () => buildPaginationTokens(currentPage, pagination.totalPages),
    [currentPage, pagination.totalPages],
  )

  return (
    <ExplorerSection>
      <ExplorerHeader>
        <ExplorerEyebrow>Corbeille publique</ExplorerEyebrow>
        <ExplorerTitle>évènements passés</ExplorerTitle>
        <ExplorerLead>
          Les évènements terminés quittent l&apos;Explorer et restent visibles ici,
          pour montrer ce que les clients ont manqué et garder une trace publique des sorties passées.
        </ExplorerLead>
        {searchQuery ? <SearchBadge>Recherche archivée : {searchQuery}</SearchBadge> : null}
      </ExplorerHeader>

      <FilterToolbar>
        <FilterGroup>
          <FilterLabel>Rechercher un évènement passé</FilterLabel>
          <FilterTextInput
            type="text"
            value={searchQuery}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Titre, ville ou catégorie..."
          />
        </FilterGroup>
      </FilterToolbar>

      <FilterMetaRow>
        <FilterSummary>
          {isLoading
            ? 'Chargement des archives publiques...'
            : formatResultsCount(events.length, pagination.total)}
        </FilterSummary>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {searchQuery ? (
            <FilterResetButton type="button" onClick={resetSearch}>
              Reinitialiser la recherche
            </FilterResetButton>
          ) : null}
          <FilterResetButton type="button" onClick={() => navigate('/explorer')}>
            Retour à Explorer
          </FilterResetButton>
        </div>
      </FilterMetaRow>

      {isLoading ? (
        <ExplorerStateText>Chargement des évènements passés...</ExplorerStateText>
      ) : errorMessage ? (
        <ExplorerErrorText>{errorMessage}</ExplorerErrorText>
      ) : events.length > 0 ? (
        <ExplorerCardsGrid>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </ExplorerCardsGrid>
      ) : (
        <ExplorerStateText>
          Aucun évènement archivé ne correspond à cette recherche pour le moment.
        </ExplorerStateText>
      )}

      {!isLoading && !errorMessage && pagination.totalPages > 1 ? (
        <PaginationRow>
          <PaginationSummary>
            Page {pagination.page} sur {pagination.totalPages}
          </PaginationSummary>

          <PaginationControls>
            <PaginationButton
              type="button"
              onClick={() => updatePage(currentPage - 1)}
              disabled={!pagination.hasPreviousPage}
              aria-label="Page precedente"
            >
              &lt;
            </PaginationButton>

            {paginationTokens.map((token) =>
              typeof token === 'number' ? (
                <PaginationButton
                  key={token}
                  type="button"
                  $active={token === currentPage}
                  onClick={() => updatePage(token)}
                  aria-label={`Aller à la page ${token}`}
                >
                  {token}
                </PaginationButton>
              ) : (
                <PaginationEllipsis key={token}>...</PaginationEllipsis>
              ),
            )}

            <PaginationButton
              type="button"
              onClick={() => updatePage(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              aria-label="Page suivante"
            >
              &gt;
            </PaginationButton>
          </PaginationControls>
        </PaginationRow>
      ) : null}

      <FeatureSpotlight />
    </ExplorerSection>
  )
}
