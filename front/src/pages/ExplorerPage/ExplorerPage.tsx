import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getPublicEventFilters,
  getPublicEvents,
} from '../../api/events'
import { FeatureSpotlight } from '../../components/FeatureSpotlight/FeatureSpotlight'
import { EventCard } from '../../components/EventCard/EventCard'
import type { EventFiltersResponse, EventSummary } from '../../types/event'
import {
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
  FilterMetaRow,
  FilterResetButton,
  FilterSelect,
  FilterSummary,
  FilterToolbar,
  SearchBadge,
} from './explorerPageElements'

const emptyFilterOptions: EventFiltersResponse = {
  categories: [],
  cities: [],
}

function formatResultsCount(count: number): string {
  return count > 1
    ? `${count} evenements affiches`
    : `${count} evenement affiche`
}

export function ExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [filterOptions, setFilterOptions] =
    useState<EventFiltersResponse>(emptyFilterOptions)
  const [isLoading, setIsLoading] = useState(true)
  const [isFiltersLoading, setIsFiltersLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const searchQuery = searchParams.get('search')?.trim() ?? ''
  const typeFilter = searchParams.get('type')?.trim() ?? ''
  const cityFilter = searchParams.get('city')?.trim() ?? ''
  const dateFilter = searchParams.get('date')?.trim() ?? ''

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
          search: searchQuery || undefined,
          type: typeFilter || undefined,
          city: cityFilter || undefined,
          date: dateFilter || undefined,
        })

        if (isMounted) {
          setEvents(data)
        }
      } catch {
        if (isMounted) {
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
  }, [searchQuery, typeFilter, cityFilter, dateFilter])

  function updateFilter(key: 'type' | 'city' | 'date', value: string) {
    const nextParams = new URLSearchParams(searchParams)

    if (value.trim() === '') {
      nextParams.delete(key)
    } else {
      nextParams.set(key, value)
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

  const hasActiveFilters =
    searchQuery !== '' || typeFilter !== '' || cityFilter !== '' || dateFilter !== ''

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
          {isLoading ? 'Chargement des resultats...' : formatResultsCount(events.length)}
        </FilterSummary>

        {hasActiveFilters ? (
          <FilterResetButton type="button" onClick={resetFilters}>
            Reinitialiser les filtres
          </FilterResetButton>
        ) : null}
      </FilterMetaRow>

      {isLoading ? (
        <ExplorerStateText>Chargement des evenements de l&apos;explorer...</ExplorerStateText>
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
          Aucun evenement publie ne correspond a ces filtres pour le moment.
        </ExplorerStateText>
      )}

      <FeatureSpotlight />
    </ExplorerSection>
  )
}
