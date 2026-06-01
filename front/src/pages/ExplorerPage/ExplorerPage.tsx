import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import {
  getPublicEventFilters,
  getPublicEvents,
} from '../../api/events'
import { FeatureSpotlight } from '../../components/FeatureSpotlight/FeatureSpotlight'
import { EventCard } from '../../components/EventCard/EventCard'
import type { AuthUser } from '../../types/auth'
import type { EventFiltersResponse, EventSummary, PublicEventsResponse } from '../../types/event'
import {
  ExplorerArchiveButton,
  ExplorerArchiveDock,
  ExplorerArchiveIcon,
  ExplorerCardsGrid,
  ExplorerErrorText,
  ExplorerEyebrow,
  ExplorerHeader,
  ExplorerLead,
  ExplorerSection,
  ExplorerStateText,
  ExplorerTitle,
  FilterDateInput,
  FilterGroup,
  FilterLabel,
  FilterMetaActions,
  FilterMetaRow,
  FilterResetButton,
  FilterSelect,
  FilterSummary,
  FilterToggleButton,
  FilterToolbar,
  PaginationButton,
  PaginationControls,
  PaginationEllipsis,
  PaginationRow,
  PaginationSummary,
  SearchBadge,
} from './explorerPageElements'

const emptyFilterOptions: EventFiltersResponse = {
  categories: [],
  cities: [],
}

const emptyPublicEventsResponse: PublicEventsResponse = {
  items: [],
  page: 1,
  pageSize: 18,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
}

function formatResultsCount(visibleCount: number, totalCount: number): string {
  if (totalCount <= 0) {
    return 'Aucun evenement trouve'
  }

  const visibleLabel =
    visibleCount > 1 ? `${visibleCount} evenements affiches` : `${visibleCount} evenement affiche`
  const totalLabel =
    totalCount > 1 ? `${totalCount} evenements au total` : `${totalCount} evenement au total`

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

export function ExplorerPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [events, setEvents] = useState<EventSummary[]>([])
  const [pagination, setPagination] =
    useState<PublicEventsResponse>(emptyPublicEventsResponse)
  const [filterOptions, setFilterOptions] =
    useState<EventFiltersResponse>(emptyFilterOptions)
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltersLoading, setIsFiltersLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const searchQuery = searchParams.get('search')?.trim() ?? ''
  const typeFilter = searchParams.get('type')?.trim() ?? ''
  const cityFilter = searchParams.get('city')?.trim() ?? ''
  const dateFilter = searchParams.get('date')?.trim() ?? ''
  const followingFilter = searchParams.get('following') === '1'
  const currentPage = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)

  useEffect(() => {
    let isMounted = true

    async function loadCurrentUser() {
      try {
        const user = await getCurrentUser()

        if (isMounted) {
          setCurrentUser(user)
        }
      } catch (error) {
        if (
          isMounted &&
          error instanceof Error &&
          error.message === 'UNAUTHENTICATED'
        ) {
          setCurrentUser(null)
        }
      }
    }

    void loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadFilterOptions() {
      setIsFiltersLoading(true)

      try {
        const data = await getPublicEventFilters()

        if (isMounted) {
          setFilterOptions(data)
        }
      } catch {
        if (isMounted) {
          setFilterOptions(emptyFilterOptions)
        }
      } finally {
        if (isMounted) {
          setIsFiltersLoading(false)
        }
      }
    }

    void loadFilterOptions()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadEvents() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const data = await getPublicEvents({
          limit: 18,
          page: currentPage,
          search: searchQuery || undefined,
          type: typeFilter || undefined,
          city: cityFilter || undefined,
          date: dateFilter || undefined,
          following: followingFilter || undefined,
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
            "Impossible de charger les evenements de l'explorer pour le moment.",
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
  }, [currentPage, searchQuery, typeFilter, cityFilter, dateFilter, followingFilter])

  function updateFilter(key: 'type' | 'city' | 'date', value: string) {
    const nextParams = new URLSearchParams(searchParams)

    if (value.trim() === '') {
      nextParams.delete(key)
    } else {
      nextParams.set(key, value)
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

  function resetFilters() {
    const nextParams = new URLSearchParams()

    if (searchQuery) {
      nextParams.set('search', searchQuery)
    }

    setSearchParams(nextParams)
  }

  function toggleFollowingFilter() {
    const nextParams = new URLSearchParams(searchParams)

    if (followingFilter) {
      nextParams.delete('following')
    } else {
      nextParams.set('following', '1')
    }

    nextParams.delete('page')
    setSearchParams(nextParams)
  }

  const hasActiveFilters =
    searchQuery !== '' ||
    typeFilter !== '' ||
    cityFilter !== '' ||
    dateFilter !== '' ||
    followingFilter
  const paginationTokens = useMemo(
    () => buildPaginationTokens(currentPage, pagination.totalPages),
    [currentPage, pagination.totalPages],
  )

  return (
    <ExplorerSection>
      <ExplorerHeader>
        <ExplorerEyebrow>Explorer</ExplorerEyebrow>
        <ExplorerTitle>Decouvre les evenements publies</ExplorerTitle>
        <ExplorerLead>
          Filtre par type, ville et date pour retrouver rapidement l&apos;evenement
          qui t&apos;interesse.
        </ExplorerLead>
        {searchQuery ? <SearchBadge>Recherche active : {searchQuery}</SearchBadge> : null}
      </ExplorerHeader>

      <FilterToolbar>
        <FilterGroup>
          <FilterLabel>Type d&apos;evenement</FilterLabel>
          <FilterSelect
            id="explorer-type"
            value={typeFilter}
            onChange={(event) => updateFilter('type', event.target.value)}
            disabled={isFiltersLoading}
          >
            <option value="">Tous les types</option>
            {filterOptions.categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Ville</FilterLabel>
          <FilterSelect
            id="explorer-city"
            value={cityFilter}
            onChange={(event) => updateFilter('city', event.target.value)}
            disabled={isFiltersLoading}
          >
            <option value="">Toutes les villes</option>
            {filterOptions.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Date</FilterLabel>
          <FilterDateInput
            id="explorer-date"
            type="date"
            value={dateFilter}
            onChange={(event) => updateFilter('date', event.target.value)}
          />
        </FilterGroup>
      </FilterToolbar>

      <FilterMetaRow>
        <FilterSummary>
          {isLoading
            ? 'Chargement des resultats...'
            : formatResultsCount(events.length, pagination.total)}
        </FilterSummary>

        <FilterMetaActions>
          {currentUser ? (
            <FilterToggleButton
              type="button"
              $active={followingFilter}
              onClick={toggleFollowingFilter}
            >
              Mes organisateurs
            </FilterToggleButton>
          ) : null}

          {hasActiveFilters ? (
            <FilterResetButton type="button" onClick={resetFilters}>
              Reinitialiser les filtres
            </FilterResetButton>
          ) : null}
        </FilterMetaActions>
      </FilterMetaRow>

      {isLoading ? (
        <ExplorerStateText>Chargement des evenements de l&apos;explorer...</ExplorerStateText>
      ) : errorMessage ? (
        <ExplorerErrorText>{errorMessage}</ExplorerErrorText>
      ) : events.length > 0 ? (
        <ExplorerCardsGrid>
          {events.map((event) => (
            <EventCard key={event.id} event={event} variant="explorer" />
          ))}
        </ExplorerCardsGrid>
      ) : (
        <ExplorerStateText>
          {followingFilter
            ? "Aucun evenement a venir ne correspond aux organisateurs que tu suis pour le moment."
            : 'Aucun evenement publie ne correspond a ces filtres pour le moment.'}
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
                  aria-label={`Aller a la page ${token}`}
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

      <ExplorerArchiveDock>
        <ExplorerArchiveButton type="button" onClick={() => navigate('/corbeille')}>
          <ExplorerArchiveIcon viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 3.75h6l.75 1.5h3a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1 0-1.5h3L9 3.75Zm-.75 6a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0V10.5a.75.75 0 0 1 .75-.75Zm4.5 0a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0V10.5a.75.75 0 0 1 .75-.75Zm4.5 0a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0V10.5a.75.75 0 0 1 .75-.75ZM6 8.25h12l-.8 10.14a1.5 1.5 0 0 1-1.49 1.36H8.29A1.5 1.5 0 0 1 6.8 18.39L6 8.25Z"
              fill="currentColor"
            />
          </ExplorerArchiveIcon>
          Voir la corbeille publique des evenements passes
        </ExplorerArchiveButton>
      </ExplorerArchiveDock>

      <FeatureSpotlight />
    </ExplorerSection>
  )
}
