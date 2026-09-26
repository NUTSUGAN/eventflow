import { useEffect, useMemo, useRef, useState } from 'react'
import { FaCalendarDays, FaChevronLeft, FaChevronRight } from 'react-icons/fa6'
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
  DatePickerControl,
  CalendarButton,
  CalendarPopover,
  CalendarHeader,
  CalendarMonthButton,
  CalendarWeekdays,
  CalendarDays,
  CalendarDay,
  CalendarFooter,
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
  pageSize: 9,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
}

function formatResultsCount(visibleCount: number, totalCount: number): string {
  if (totalCount <= 0) {
    return 'Aucun évènement trouve'
  }

  const visibleLabel =
    visibleCount > 1 ? `${visibleCount} événements affichés` : `${visibleCount} événement affiché`
  const totalLabel =
    totalCount > 1 ? `${totalCount} événements au total` : `${totalCount} événement au total`

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
  const datePickerRef = useRef<HTMLDivElement>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
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
  const selectedDate = dateFilter ? new Date(`${dateFilter}T12:00:00`) : null
  const offset = (viewMonth.getDay() + 6) % 7
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const calendarDays: Array<Date | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), index + 1)),
  ]
  const followingFilter = searchParams.get('following') === '1'
  const currentPage = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)

  useEffect(() => {
    if (!selectedDate || Number.isNaN(selectedDate.getTime())) return
    setViewMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  }, [dateFilter])

  useEffect(() => {
    if (calendarOpen) {
      const onPointerDown = (event: PointerEvent) => {
        if (!datePickerRef.current?.contains(event.target as Node)) setCalendarOpen(false)
      }
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') setCalendarOpen(false)
      }
      document.addEventListener('pointerdown', onPointerDown)
      document.addEventListener('keydown', onKeyDown)
      return () => {
        document.removeEventListener('pointerdown', onPointerDown)
        document.removeEventListener('keydown', onKeyDown)
      }
    }
  }, [calendarOpen])

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
          limit: 9,
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
            "Impossible de charger les évènements de l'explorer pour le moment.",
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
        <ExplorerTitle>Decouvre les évènements publiés</ExplorerTitle>
        <ExplorerLead>
          Filtre par type, ville et date pour retrouver rapidement l&apos;évènement
          qui t&apos;interesse.
        </ExplorerLead>
        {searchQuery ? <SearchBadge>Recherche active : {searchQuery}</SearchBadge> : null}
      </ExplorerHeader>

      <FilterToolbar>
        <FilterGroup>
          <FilterLabel>Type d&apos;évènement</FilterLabel>
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
            {cityFilter && !filterOptions.cities.some(city => String(city.id) === cityFilter) &&
              <option value={cityFilter}>{filterOptions.cities.find(city => city.name.toLocaleLowerCase() === cityFilter.toLocaleLowerCase())?.name ?? cityFilter}</option>}
            {filterOptions.cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Date</FilterLabel>
          <DatePickerControl ref={datePickerRef}>
            <FilterDateInput
              id="explorer-date"
              type="text"
              value="Choisir une date"
              aria-label={selectedDate ? `Date sélectionnée : ${selectedDate.toLocaleDateString('fr-FR')}. Cliquer pour modifier` : 'Choisir une date'}
              readOnly
              aria-haspopup="dialog"
              onClick={() => setCalendarOpen(true)}
            />
            <CalendarButton type="button" aria-label="Choisir une date" title="Choisir une date"
              aria-expanded={calendarOpen} onClick={() => setCalendarOpen(value => !value)}>
              <FaCalendarDays aria-hidden="true" />
            </CalendarButton>
            {calendarOpen && <CalendarPopover role="dialog" aria-label="Calendrier de sélection de date">
              <CalendarHeader>
                <CalendarMonthButton type="button" aria-label="Mois précédent"
                  onClick={() => setViewMonth(month => new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                  <FaChevronLeft aria-hidden="true" />
                </CalendarMonthButton>
                <strong aria-live="polite">{viewMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</strong>
                <CalendarMonthButton type="button" aria-label="Mois suivant"
                  onClick={() => setViewMonth(month => new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                  <FaChevronRight aria-hidden="true" />
                </CalendarMonthButton>
              </CalendarHeader>
              <CalendarWeekdays aria-hidden="true">
                {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(day => <span key={day}>{day}</span>)}
              </CalendarWeekdays>
              <CalendarDays>
                {calendarDays.map((day, index) => day ? (
                  <CalendarDay key={day.toISOString()} type="button"
                    $selected={Boolean(selectedDate && selectedDate.getFullYear() === day.getFullYear() && selectedDate.getMonth() === day.getMonth() && selectedDate.getDate() === day.getDate())}
                    $today={day.toDateString() === new Date().toDateString()}
                    aria-label={day.toLocaleDateString('fr-FR', { dateStyle: 'full' })}
                    aria-pressed={Boolean(selectedDate && selectedDate.getFullYear() === day.getFullYear() && selectedDate.getMonth() === day.getMonth() && selectedDate.getDate() === day.getDate())}
                    onClick={() => {
                      const value = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
                      updateFilter('date', value)
                      setCalendarOpen(false)
                    }}>{day.getDate()}</CalendarDay>
                ) : <span key={`blank-${index}`} />)}
              </CalendarDays>
              <CalendarFooter>
                <button type="button" onClick={() => { updateFilter('date', ''); setCalendarOpen(false) }}>Effacer</button>
                <button type="button" onClick={() => {
                  const today = new Date()
                  const value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                  setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                  updateFilter('date', value)
                  setCalendarOpen(false)
                }}>Aujourd’hui</button>
              </CalendarFooter>
            </CalendarPopover>}
          </DatePickerControl>
        </FilterGroup>
      </FilterToolbar>

      <FilterMetaRow>
        <FilterSummary>
          {isLoading
            ? 'Chargement des résultats...'
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
        <ExplorerStateText>Chargement des évènements de l&apos;explorer...</ExplorerStateText>
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
            ? "Aucun évènement à venir ne correspond aux organisateurs que tu suis pour le moment."
            : 'Aucun évènement publié ne correspond à ces filtres pour le moment.'}
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

      <ExplorerArchiveDock>
        <ExplorerArchiveButton type="button" onClick={() => navigate('/corbeille')}>
          <ExplorerArchiveIcon viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 3.75h6l.75 1.5h3a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1 0-1.5h3L9 3.75Zm-.75 6a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0V10.5a.75.75 0 0 1 .75-.75Zm4.5 0a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0V10.5a.75.75 0 0 1 .75-.75Zm4.5 0a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0V10.5a.75.75 0 0 1 .75-.75ZM6 8.25h12l-.8 10.14a1.5 1.5 0 0 1-1.49 1.36H8.29A1.5 1.5 0 0 1 6.8 18.39L6 8.25Z"
              fill="currentColor"
            />
          </ExplorerArchiveIcon>
          Voir la corbeille publique des évènements passés
        </ExplorerArchiveButton>
      </ExplorerArchiveDock>

      <FeatureSpotlight />
    </ExplorerSection>
  )
}
