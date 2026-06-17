import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser, logoutUser, readCachedCurrentUser } from '../../api/auth'
import { getSearchSuggestions } from '../../api/events'
import type { AuthUser } from '../../types/auth'
import type {
  SearchSuggestionEvent,
  SearchSuggestionOrganizer,
} from '../../types/event'
import {
  AuthButton,
  Brand,
  BrandImage,
  ExploreButton,
  MobileMenuAuthButton,
  MobileMenuButton,
  MobileMenuLink,
  MobileMenuPanel,
  MobileMenuProfileCard,
  MobileMenuProfileEmail,
  MobileMenuProfileIdentity,
  MobileMenuProfileName,
  MobileMenuProfileText,
  NavbarContainer,
  NavbarInner,
  OrganizerLink,
  ProfileAvatar,
  ProfileButton,
  ProfileButtonText,
  ProfileDropdown,
  ProfileDropdownAction,
  ProfileDropdownEmail,
  ProfileDropdownHeader,
  ProfileDropdownName,
  ProfileMenuWrapper,
  SearchBox,
  SearchField,
  SearchForm,
  SearchIcon,
  SearchInput,
  SearchSuggestionAvatar,
  SearchSuggestionButton,
  SearchSuggestionContent,
  SearchSuggestionCover,
  SearchSuggestionHeading,
  SearchSuggestionList,
  SearchSuggestionMeta,
  SearchSuggestionSection,
  SearchSuggestionStatus,
  SearchSuggestionTitle,
  SearchSuggestionsPanel,
} from './navbarElements'

function formatSuggestionDate(date: string | null): string | null {
  if (!date) {
    return null
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function getOrganizerInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const searchBoxRef = useRef<HTMLDivElement | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const isSearchRoute =
    location.pathname === '/' || location.pathname === '/explorer'
  const initialRouteSearch =
    isSearchRoute
      ? new URLSearchParams(location.search).get('search') ?? ''
      : ''
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(initialRouteSearch)
  const [eventSuggestions, setEventSuggestions] = useState<SearchSuggestionEvent[]>(
    [],
  )
  const [organizerSuggestions, setOrganizerSuggestions] = useState<
    SearchSuggestionOrganizer[]
  >([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(
    () => readCachedCurrentUser() ?? null,
  )
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchBoxRef.current &&
        event.target instanceof Node &&
        !searchBoxRef.current.contains(event.target)
      ) {
        setIsSearchOpen(false)
      }

      if (
        profileMenuRef.current &&
        event.target instanceof Node &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadCurrentUser() {
      try {
        const user = await getCurrentUser()

        if (isMounted) {
          setCurrentUser(user)
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null)
        }
      }
    }

    void loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    const trimmedQuery = searchQuery.trim()

    if (trimmedQuery.length < 3) {
      return
    }

    let isCancelled = false
    const timeoutId = window.setTimeout(async () => {
      setIsSearchLoading(true)

      try {
        const response = await getSearchSuggestions(trimmedQuery)

        if (!isCancelled) {
          setEventSuggestions(response.events)
          setOrganizerSuggestions(response.organizers)
          setIsSearchOpen(true)
        }
      } catch {
        if (!isCancelled) {
          setEventSuggestions([])
          setOrganizerSuggestions([])
        }
      } finally {
        if (!isCancelled) {
          setIsSearchLoading(false)
        }
      }
    }, 250)

    return () => {
      isCancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [searchQuery])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedQuery = searchQuery.trim()

    setIsSearchOpen(false)
    setIsMobileMenuOpen(false)

    if ('' === trimmedQuery) {
      navigate('/explorer')
      return
    }

    navigate(`/explorer?search=${encodeURIComponent(trimmedQuery)}`)
  }

  function handleEventSelect(eventId: number) {
    setIsSearchOpen(false)
    setSearchQuery('')
    navigate(`/events/${eventId}`)
  }

  function handleOrganizerSelect(organizerId: number) {
    setIsSearchOpen(false)
    setSearchQuery('')
    navigate(`/organizers/${organizerId}`)
  }

  function handleExploreNavigation() {
    setIsMobileMenuOpen(false)
    navigate('/explorer')
  }

  async function handleOrganizerNavigation() {
    setIsSearchOpen(false)
    setIsMobileMenuOpen(false)
    setIsProfileMenuOpen(false)

    if (currentUser) {
      try {
        const refreshedUser = await getCurrentUser(true)
        setCurrentUser(refreshedUser)

        const userHasOrganizerAccess =
          refreshedUser.role === 'ROLE_ORGANIZER' ||
          refreshedUser.role === 'ROLE_ADMIN'

        navigate(userHasOrganizerAccess ? '/organizer/dashboard' : '/organizer-access')
      } catch {
        handleAuthNavigation('login', 'organizer')
      }

      return
    }

    handleAuthNavigation('register', 'organizer')
  }

  const hasOrganizerAccess =
    currentUser?.role === 'ROLE_ORGANIZER' || currentUser?.role === 'ROLE_ADMIN'

  function handleAuthNavigation(mode: 'login' | 'register', intent: '' | 'organizer' = '') {
    setIsSearchOpen(false)
    setIsMobileMenuOpen(false)
    setIsProfileMenuOpen(false)

    const params = new URLSearchParams({ mode })

    if (intent) {
      params.set('intent', intent)
    }

    navigate(`/auth?${params.toString()}`)
  }

  async function handleLogout() {
    try {
      await logoutUser()
    } catch {
      // Front state still resets to avoid leaving the UI stuck.
    } finally {
      setCurrentUser(null)
      setIsProfileMenuOpen(false)
      setIsMobileMenuOpen(false)
      window.location.assign('/auth?mode=login')
    }
  }

  function handleProfileNavigation() {
    setIsProfileMenuOpen(false)
    setIsMobileMenuOpen(false)
    navigate('/account')
  }

  function handleMyTicketsNavigation() {
    setIsProfileMenuOpen(false)
    setIsMobileMenuOpen(false)
    navigate('/mes-billets')
  }

  function handleMyOrdersNavigation() {
    setIsProfileMenuOpen(false)
    setIsMobileMenuOpen(false)
    navigate('/mes-commandes')
  }

  function handleOrganizerStaffNavigation() {
    setIsProfileMenuOpen(false)
    setIsMobileMenuOpen(false)
    navigate('/organizer/staff')
  }

  function handleStaffScanNavigation() {
    setIsProfileMenuOpen(false)
    setIsMobileMenuOpen(false)
    navigate('/staff/scan')
  }

  function getUserInitials(user: AuthUser): string {
    return `${user.firstName} ${user.lastName}`
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
  }

  const currentUserFullName =
    currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : ''

  const hasSuggestions = eventSuggestions.length > 0 || organizerSuggestions.length > 0

  return (
    <NavbarContainer>
      <NavbarInner>
        <Brand to="/" aria-label="Retour à l’accueil EventFlow">
          <picture>
            <source media="(max-width: 840px)" srcSet="/eventflow-logo-mobile.png" />
            <BrandImage src="/eventflow-logo.png" alt="EventFlow" />
          </picture>
        </Brand>

        <SearchBox ref={searchBoxRef}>
          <SearchForm role="search" aria-label="Recherche d’évènements" onSubmit={handleSearchSubmit}>
            <SearchField>
              <SearchIcon viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.44 4.44 1.06-1.06-4.44-4.44A6.5 6.5 0 0 0 10.5 4Zm0 1.5a5 5 0 1 1 0 10a5 5 0 0 1 0-10Z"
                  fill="currentColor"
                />
              </SearchIcon>
              <SearchInput
                type="search"
                value={searchQuery}
                placeholder="Rechercher un évènement ou un organisateur"
                onChange={(event) => {
                  const nextQuery = event.target.value
                  setSearchQuery(nextQuery)

                  if (nextQuery.trim().length < 3) {
                    setEventSuggestions([])
                    setOrganizerSuggestions([])
                    setIsSearchLoading(false)
                  }

                  setIsSearchOpen(true)
                }}
                onFocus={() => {
                  if (searchQuery.trim() !== '') {
                    setIsSearchOpen(true)
                  }
                }}
                aria-label="Rechercher un évènement ou un organisateur"
                aria-autocomplete="list"
                aria-expanded={isSearchOpen}
                aria-controls="site-search-suggestions"
              />
            </SearchField>
          </SearchForm>

          {isSearchOpen && searchQuery.trim() !== '' ? (
            <SearchSuggestionsPanel id="site-search-suggestions">
              {searchQuery.trim().length < 3 ? (
                <SearchSuggestionStatus>
                  Saisis au moins 3 lettres pour voir des suggestions d&apos;évènements et d&apos;organisateurs.
                </SearchSuggestionStatus>
              ) : isSearchLoading ? (
                <SearchSuggestionStatus>
                  Recherche en cours...
                </SearchSuggestionStatus>
              ) : hasSuggestions ? (
                <>
                  {eventSuggestions.length > 0 ? (
                    <SearchSuggestionSection>
                      <SearchSuggestionHeading>évènements</SearchSuggestionHeading>
                      <SearchSuggestionList>
                        {eventSuggestions.map((eventSuggestion) => (
                          <SearchSuggestionButton
                            key={`event-${eventSuggestion.id}`}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleEventSelect(eventSuggestion.id)}
                          >
                            <SearchSuggestionCover
                              $imageUrl={eventSuggestion.coverImageUrl ?? undefined}
                            />
                            <SearchSuggestionContent>
                              <SearchSuggestionTitle>
                                {eventSuggestion.title}
                              </SearchSuggestionTitle>
                              <SearchSuggestionMeta>
                                {[
                                  eventSuggestion.category,
                                  eventSuggestion.city,
                                  formatSuggestionDate(eventSuggestion.startsAt),
                                ]
                                  .filter(Boolean)
                                  .join(' - ')}
                              </SearchSuggestionMeta>
                            </SearchSuggestionContent>
                          </SearchSuggestionButton>
                        ))}
                      </SearchSuggestionList>
                    </SearchSuggestionSection>
                  ) : null}

                  {organizerSuggestions.length > 0 ? (
                    <SearchSuggestionSection>
                      <SearchSuggestionHeading>Organisateurs</SearchSuggestionHeading>
                      <SearchSuggestionList>
                        {organizerSuggestions.map((organizerSuggestion) => (
                          <SearchSuggestionButton
                            key={`organizer-${organizerSuggestion.id}`}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleOrganizerSelect(organizerSuggestion.id)}
                          >
                            <SearchSuggestionAvatar
                              $imageUrl={organizerSuggestion.profilePhoto ?? undefined}
                            >
                              {!organizerSuggestion.profilePhoto
                                ? getOrganizerInitials(organizerSuggestion.fullName)
                                : null}
                            </SearchSuggestionAvatar>
                            <SearchSuggestionContent>
                              <SearchSuggestionTitle>
                                {organizerSuggestion.fullName}
                              </SearchSuggestionTitle>
                              <SearchSuggestionMeta>
                                Voir son profil public et ses évènements publiés
                              </SearchSuggestionMeta>
                            </SearchSuggestionContent>
                          </SearchSuggestionButton>
                        ))}
                      </SearchSuggestionList>
                    </SearchSuggestionSection>
                  ) : null}
                </>
              ) : (
                <SearchSuggestionStatus>
                  Aucune proposition pour cette recherche.
                </SearchSuggestionStatus>
              )}
            </SearchSuggestionsPanel>
          ) : null}
        </SearchBox>

        <ExploreButton type="button" onClick={handleExploreNavigation}>
          EXPLORER
        </ExploreButton>
        <OrganizerLink
          type="button"
          onClick={handleOrganizerNavigation}
        >
          {hasOrganizerAccess ? 'ESPACE ORGANISATEUR' : 'JE SUIS ORGANISATEUR'}
        </OrganizerLink>
        {currentUser ? (
          <ProfileMenuWrapper ref={profileMenuRef}>
            <ProfileButton
              type="button"
              onClick={() => setIsProfileMenuOpen((value) => !value)}
              aria-expanded={isProfileMenuOpen}
              aria-haspopup="menu"
            >
              <ProfileAvatar $imageUrl={currentUser.profilePhoto ?? undefined}>
                {!currentUser.profilePhoto ? getUserInitials(currentUser) : null}
              </ProfileAvatar>
              <ProfileButtonText>Mon profil</ProfileButtonText>
            </ProfileButton>

            {isProfileMenuOpen ? (
              <ProfileDropdown>
                <ProfileDropdownHeader>
                  <ProfileDropdownName>{currentUserFullName}</ProfileDropdownName>
                  <ProfileDropdownEmail>{currentUser.email}</ProfileDropdownEmail>
                </ProfileDropdownHeader>
                <ProfileDropdownAction type="button" onClick={handleProfileNavigation}>
                  Voir mon profil
                </ProfileDropdownAction>
                <ProfileDropdownAction type="button" onClick={handleMyTicketsNavigation}>
                  Mes billets
                </ProfileDropdownAction>
                <ProfileDropdownAction type="button" onClick={handleMyOrdersNavigation}>
                  Mes commandes
                </ProfileDropdownAction>
                {currentUser.canAccessStaffTools ? (
                  <ProfileDropdownAction type="button" onClick={handleStaffScanNavigation}>
                    Scanner billets
                  </ProfileDropdownAction>
                ) : null}
                {currentUser.canManageStaff ? (
                  <ProfileDropdownAction type="button" onClick={handleOrganizerStaffNavigation}>
                    Mon staff
                  </ProfileDropdownAction>
                ) : null}
                <ProfileDropdownAction
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                      navigate(hasOrganizerAccess ? '/organizer/dashboard' : '/organizer-access')
                  }}
                >
                  {hasOrganizerAccess ? 'Espace organisateur' : 'Devenir organisateur'}
                </ProfileDropdownAction>
                {currentUser.role === 'ROLE_ADMIN' ? (
                  <ProfileDropdownAction
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      navigate('/admin')
                    }}
                  >
                    Console admin
                  </ProfileDropdownAction>
                ) : null}
                <ProfileDropdownAction type="button" onClick={handleLogout}>
                  Se déconnecter
                </ProfileDropdownAction>
              </ProfileDropdown>
            ) : null}
          </ProfileMenuWrapper>
        ) : (
          <AuthButton
            id="site-auth-cta"
            type="button"
            onClick={() => handleAuthNavigation('login')}
          >
            Se connecter / S&apos;inscrire
          </AuthButton>
        )}

        <MobileMenuButton
          type="button"
          aria-label="Ouvrir le menu principal"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </MobileMenuButton>
      </NavbarInner>

      {isMobileMenuOpen ? (
        <MobileMenuPanel>
          {currentUser ? (
            <MobileMenuProfileCard>
              <MobileMenuProfileIdentity>
                <ProfileAvatar $imageUrl={currentUser.profilePhoto ?? undefined}>
                  {!currentUser.profilePhoto ? getUserInitials(currentUser) : null}
                </ProfileAvatar>
                <MobileMenuProfileText>
                  <MobileMenuProfileName>{currentUserFullName}</MobileMenuProfileName>
                  <MobileMenuProfileEmail>{currentUser.email}</MobileMenuProfileEmail>
                </MobileMenuProfileText>
              </MobileMenuProfileIdentity>
              <MobileMenuLink type="button" onClick={handleProfileNavigation}>
                Voir mon profil
              </MobileMenuLink>
              <MobileMenuLink type="button" onClick={handleMyTicketsNavigation}>
                Mes billets
              </MobileMenuLink>
              <MobileMenuLink type="button" onClick={handleMyOrdersNavigation}>
                Mes commandes
              </MobileMenuLink>
              {currentUser.canAccessStaffTools ? (
                <MobileMenuLink type="button" onClick={handleStaffScanNavigation}>
                  Scanner billets
                </MobileMenuLink>
              ) : null}
              {currentUser.canManageStaff ? (
                <MobileMenuLink type="button" onClick={handleOrganizerStaffNavigation}>
                  Mon staff
                </MobileMenuLink>
              ) : null}
              <MobileMenuLink
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  navigate(hasOrganizerAccess ? '/organizer/dashboard' : '/organizer-access')
                }}
              >
                {hasOrganizerAccess ? 'Espace organisateur' : 'Devenir organisateur'}
              </MobileMenuLink>
              {currentUser.role === 'ROLE_ADMIN' ? (
                <MobileMenuLink
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    navigate('/admin')
                  }}
                >
                  Console admin
                </MobileMenuLink>
              ) : null}
              <MobileMenuAuthButton type="button" onClick={handleLogout}>
                Se déconnecter
              </MobileMenuAuthButton>
            </MobileMenuProfileCard>
          ) : null}

          <MobileMenuLink type="button" onClick={handleExploreNavigation}>
            Explorer
          </MobileMenuLink>
          {!currentUser ? (
            <>
              <MobileMenuLink
                type="button"
                onClick={handleOrganizerNavigation}
              >
                Je suis organisateur
              </MobileMenuLink>
              <MobileMenuAuthButton
                id="site-auth-cta-mobile"
                type="button"
                onClick={() => handleAuthNavigation('login')}
              >
                Se connecter / S&apos;inscrire
              </MobileMenuAuthButton>
            </>
          ) : null}
        </MobileMenuPanel>
      ) : null}
    </NavbarContainer>
  )
}
