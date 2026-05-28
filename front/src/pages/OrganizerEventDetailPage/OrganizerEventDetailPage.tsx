import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { getBackendPublicUrl } from '../../api/client'
import { getMyOrganizerApplication } from '../../api/organizerApplication'
import {
  getOrganizerEvent,
  getOrganizerEventFormOptions,
  updateOrganizerEvent,
} from '../../api/organizerEvents'
import {
  createOrganizerTicketType,
  deleteOrganizerTicketType,
  getOrganizerTicketTypes,
  updateOrganizerTicketType,
} from '../../api/organizerTicketTypes'
import type { AuthUser } from '../../types/auth'
import type {
  OrganizerEventFormOptions,
  OrganizerEventSummary,
} from '../../types/organizerEvent'
import type {
  OrganizerTicketType,
  OrganizerTicketTypePayload,
} from '../../types/organizerTicketType'
import {
  OrganizerEventDetailActions,
  OrganizerEventDetailBackButton,
  OrganizerEventDetailCover,
  OrganizerEventDetailDangerButton,
  OrganizerEventDetailError,
  OrganizerEventDetailEyebrow,
  OrganizerEventDetailField,
  OrganizerEventDetailForm,
  OrganizerEventDetailGrid,
  OrganizerEventDetailHero,
  OrganizerEventDetailHeroContent,
  OrganizerEventDetailHint,
  OrganizerEventDetailInfoPanel,
  OrganizerEventDetailInfoText,
  OrganizerEventDetailInfoTitle,
  OrganizerEventDetailInput,
  OrganizerEventDetailLabel,
  OrganizerEventDetailMediaCard,
  OrganizerEventDetailMediaGrid,
  OrganizerEventDetailMediaLabel,
  OrganizerEventDetailMediaPreview,
  OrganizerEventDetailPrimaryButton,
  OrganizerEventDetailScanStaffCard,
  OrganizerEventDetailScanStaffHeader,
  OrganizerEventDetailScanStaffList,
  OrganizerEventDetailScanStaffMeta,
  OrganizerEventDetailScanStaffName,
  OrganizerEventDetailScanStaffTotal,
  OrganizerEventDetailScanStat,
  OrganizerEventDetailScanStatLabel,
  OrganizerEventDetailScanStatValue,
  OrganizerEventDetailScanSummaryGrid,
  OrganizerEventDetailSecondaryButton,
  OrganizerEventDetailSection,
  OrganizerEventDetailSelect,
  OrganizerEventDetailShell,
  OrganizerEventDetailSplitEyebrow,
  OrganizerEventDetailSplitHeader,
  OrganizerEventDetailSplitSection,
  OrganizerEventDetailSplitText,
  OrganizerEventDetailSplitTitle,
  OrganizerEventDetailState,
  OrganizerEventDetailStatusBadge,
  OrganizerEventDetailSuccess,
  OrganizerEventDetailText,
  OrganizerEventDetailTextarea,
  OrganizerEventDetailTicketBadge,
  OrganizerEventDetailTicketCard,
  OrganizerEventDetailTicketCardActions,
  OrganizerEventDetailTicketCardHeader,
  OrganizerEventDetailTicketCardText,
  OrganizerEventDetailTicketCardTitle,
  OrganizerEventDetailTicketCreateCard,
  OrganizerEventDetailTicketGrid,
  OrganizerEventDetailTicketHeader,
  OrganizerEventDetailTicketList,
  OrganizerEventDetailTicketSection,
  OrganizerEventDetailTicketStat,
  OrganizerEventDetailTicketStatLabel,
  OrganizerEventDetailTicketStatValue,
  OrganizerEventDetailTicketStats,
  OrganizerEventDetailTicketText,
  OrganizerEventDetailTicketTitle,
  OrganizerEventDetailTitle,
  OrganizerEventDetailDivider,
} from './organizerEventDetailPageElements'

const emptyOptions: OrganizerEventFormOptions = {
  categories: [],
}

type OrganizerEventEditFormState = {
  title: string
  description: string
  categoryId: string
  locationAddress: string
  locationCity: string
  locationPostalCode: string
  locationCountry: string
  locationLatitude: string
  locationLongitude: string
  startDatetime: string
  endDatetime: string
  capacity: string
  status: string
  thumbnailPhoto: File | null
  coverPhoto: File | null
}

const initialEventForm: OrganizerEventEditFormState = {
  title: '',
  description: '',
  categoryId: '',
  locationAddress: '',
  locationCity: '',
  locationPostalCode: '',
  locationCountry: 'France',
  locationLatitude: '',
  locationLongitude: '',
  startDatetime: '',
  endDatetime: '',
  capacity: '',
  status: 'draft',
  thumbnailPhoto: null,
  coverPhoto: null,
}

const initialTicketForm: OrganizerTicketTypePayload = {
  name: '',
  description: '',
  price: '',
  stock: '',
  salesStartAt: '',
  salesEndAt: '',
  maxPerOrder: '',
  isActive: true,
}

function formatDateTimeLocal(date: Date): string {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)

  return localDate.toISOString().slice(0, 16)
}

function formatApiDateToInput(value: string | null): string {
  if (!value) {
    return ''
  }

  return formatDateTimeLocal(new Date(value))
}

function addMinutesToDateTimeLocal(value: string, minutes: number): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  date.setMinutes(date.getMinutes() + minutes)

  return formatDateTimeLocal(date)
}

function formatOrganizerDate(value: string | null): string {
  if (!value) {
    return 'Date a confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatCurrencyFromString(value: string): string {
  const amount = Number.parseFloat(value)

  if (!Number.isFinite(amount)) {
    return 'Tarif invalide'
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatStatusLabel(status: string): string {
  return status === 'published' ? 'Public' : 'Brouillon'
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

function buildEventFormFromEvent(
  event: OrganizerEventSummary,
): OrganizerEventEditFormState {
  return {
    title: event.title,
    description: event.description,
    categoryId: event.category.id !== null ? String(event.category.id) : '',
    locationAddress: event.location.address ?? '',
    locationCity: event.location.city ?? '',
    locationPostalCode: event.location.postalCode ?? '',
    locationCountry: event.location.country ?? 'France',
    locationLatitude: event.location.latitude ?? '',
    locationLongitude: event.location.longitude ?? '',
    startDatetime: formatApiDateToInput(event.startDatetime),
    endDatetime: formatApiDateToInput(event.endDatetime),
    capacity: event.capacity !== null ? String(event.capacity) : '',
    status: event.status ?? 'draft',
    thumbnailPhoto: null,
    coverPhoto: null,
  }
}

function buildTicketFormFromTicketType(
  ticketType: OrganizerTicketType,
): OrganizerTicketTypePayload {
  return {
    name: ticketType.name,
    description: ticketType.description ?? '',
    price: ticketType.price,
    stock: String(ticketType.stock),
    salesStartAt: formatApiDateToInput(ticketType.salesStartAt),
    salesEndAt: formatApiDateToInput(ticketType.salesEndAt),
    maxPerOrder:
      ticketType.maxPerOrder !== null ? String(ticketType.maxPerOrder) : '',
    isActive: ticketType.isActive,
  }
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
  ) {
    return String(
      (error as { response?: { data?: { message?: unknown } } }).response?.data
        ?.message,
    )
  }

  return fallback
}

export function OrganizerEventDetailPage() {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const [searchParams] = useSearchParams()
  const ticketSectionRef = useRef<HTMLElement | null>(null)
  const initialTicketFocusHandledRef = useRef(false)
  const [currentDateTime] = useState(() => formatDateTimeLocal(new Date()))
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [event, setEvent] = useState<OrganizerEventSummary | null>(null)
  const [options, setOptions] = useState<OrganizerEventFormOptions>(emptyOptions)
  const [ticketTypes, setTicketTypes] = useState<OrganizerTicketType[]>([])
  const [eventForm, setEventForm] = useState<OrganizerEventEditFormState>(
    initialEventForm,
  )
  const [ticketForm, setTicketForm] = useState<OrganizerTicketTypePayload>(
    initialTicketForm,
  )
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null)
  const [editingTicketForm, setEditingTicketForm] =
    useState<OrganizerTicketTypePayload>(initialTicketForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [isSavingTicket, setIsSavingTicket] = useState(false)
  const [deletingTicketId, setDeletingTicketId] = useState<number | null>(null)
  const [eventErrorMessage, setEventErrorMessage] = useState<string | null>(null)
  const [eventSuccessMessage, setEventSuccessMessage] = useState<string | null>(null)
  const [ticketErrorMessage, setTicketErrorMessage] = useState<string | null>(null)
  const [ticketSuccessMessage, setTicketSuccessMessage] = useState<string | null>(null)

  const selectedCategory = useMemo(
    () =>
      options.categories.find(
        (category) => String(category.id) === eventForm.categoryId,
      ),
    [eventForm.categoryId, options.categories],
  )

  const existingStartDatetimeInput = event?.startDatetime
    ? formatApiDateToInput(event.startDatetime)
    : ''

  const editableMinimumStartDatetime =
    existingStartDatetimeInput.trim() !== '' &&
    new Date(existingStartDatetimeInput) < new Date(currentDateTime)
      ? existingStartDatetimeInput
      : currentDateTime

  const minimumEndDatetime = useMemo(() => {
    if (eventForm.startDatetime.trim() !== '') {
      return addMinutesToDateTimeLocal(eventForm.startDatetime, 1)
    }

    return editableMinimumStartDatetime
  }, [editableMinimumStartDatetime, eventForm.startDatetime])

  const eventCreatedAt = event?.createdAt ?? null

  const minimumTicketSalesStart = useMemo(() => {
    if (!eventCreatedAt) {
      return formatDateTimeLocal(new Date())
    }

    return formatDateTimeLocal(new Date(eventCreatedAt))
  }, [eventCreatedAt])

  const minimumTicketSalesEnd = useMemo(() => {
    if (ticketForm.salesStartAt.trim() !== '') {
      return addMinutesToDateTimeLocal(ticketForm.salesStartAt, 1)
    }

    return minimumTicketSalesStart
  }, [minimumTicketSalesStart, ticketForm.salesStartAt])

  const eventCapacity = event?.capacity ?? 0

  const allocatedTicketStock = useMemo(
    () => ticketTypes.reduce((total, ticketType) => total + ticketType.stock, 0),
    [ticketTypes],
  )

  const remainingTicketCapacity = Math.max(0, eventCapacity - allocatedTicketStock)

  const editingTicket = useMemo(
    () =>
      editingTicketId !== null
        ? ticketTypes.find((ticketType) => ticketType.id === editingTicketId) ?? null
        : null,
    [editingTicketId, ticketTypes],
  )

  const editableRemainingCapacityForCurrentTicket = Math.max(
    0,
    remainingTicketCapacity + (editingTicket?.stock ?? 0),
  )

  const createdFromEventSetup = searchParams.get('created') === '1'
  const shouldFocusTickets = searchParams.get('focus') === 'tickets'
  const ticketSectionMessage =
    ticketSuccessMessage ??
    (createdFromEventSetup
      ? "Evenement cree avec succes. Tu peux maintenant ajouter les billets de cet evenement."
      : null)
  const scanStats = event?.scanStats ?? null
  const scanStaffMembers = scanStats?.staffMembers ?? []

  function revealTicketSection() {
    window.requestAnimationFrame(() => {
      ticketSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  useEffect(() => {
    let isMounted = true

    async function loadOrganizerEventDetail() {
      if (!eventId) {
        setEventErrorMessage("Impossible de retrouver l'evenement organisateur demande.")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setEventErrorMessage(null)
      setEventSuccessMessage(null)
      setTicketErrorMessage(null)
      setTicketSuccessMessage(null)

      try {
        const user = await getCurrentUser(true)

        if (user.role !== 'ROLE_ORGANIZER' && user.role !== 'ROLE_ADMIN') {
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

        const [organizerEventResponse, organizerOptions, organizerTicketTypes] =
          await Promise.all([
            getOrganizerEvent(Number(eventId)),
            getOrganizerEventFormOptions(),
            getOrganizerTicketTypes(Number(eventId)),
          ])

        if (isMounted) {
          setCurrentUser(user)
          setEvent(organizerEventResponse.event)
          setOptions(organizerOptions)
          setEventForm(buildEventFormFromEvent(organizerEventResponse.event))
          setTicketTypes(organizerTicketTypes)
        }
      } catch (error) {
        if (isMounted) {
          setEventErrorMessage(
            extractErrorMessage(
              error,
              "Impossible de charger la fiche organisateur de l'evenement pour le moment.",
            ),
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadOrganizerEventDetail()

    return () => {
      isMounted = false
    }
  }, [eventId, navigate])

  useEffect(() => {
    if (isLoading || !event || initialTicketFocusHandledRef.current) {
      return
    }

    if (!shouldFocusTickets) {
      return
    }

    initialTicketFocusHandledRef.current = true

    revealTicketSection()
  }, [event, isLoading, shouldFocusTickets])

  async function handleEventSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()

    if (!eventId || isSavingEvent) {
      return
    }

    if (
      eventForm.title.trim() === '' ||
      eventForm.description.trim() === '' ||
      eventForm.categoryId.trim() === '' ||
      eventForm.locationAddress.trim() === '' ||
      eventForm.locationCity.trim() === '' ||
      eventForm.locationPostalCode.trim() === '' ||
      eventForm.locationCountry.trim() === ''
    ) {
      setEventErrorMessage(
        'Renseigne le titre, la description, la categorie et toutes les informations de lieu avant de sauvegarder.',
      )
      return
    }

    if (
      !Number.isFinite(Number(eventForm.capacity)) ||
      Number(eventForm.capacity) <= 0
    ) {
      setEventErrorMessage('La capacite doit etre un entier positif.')
      return
    }

    const startDatetime = new Date(eventForm.startDatetime)
    const endDatetime = new Date(eventForm.endDatetime)
    const now = new Date()

    if (Number.isNaN(startDatetime.getTime()) || Number.isNaN(endDatetime.getTime())) {
      setEventErrorMessage('Renseigne des dates valides pour le debut et la fin.')
      return
    }

    const existingStartDatetime = event?.startDatetime
      ? new Date(formatApiDateToInput(event.startDatetime))
      : null
    const isKeepingExistingPastStartDatetime =
      existingStartDatetime !== null &&
      !Number.isNaN(existingStartDatetime.getTime()) &&
      existingStartDatetime.getTime() === startDatetime.getTime()

    if (startDatetime < now && !isKeepingExistingPastStartDatetime) {
      setEventErrorMessage('La date de debut ne peut pas etre dans le passe.')
      return
    }

    if (endDatetime <= startDatetime) {
      setEventErrorMessage('La date de fin doit etre posterieure a la date de debut.')
      return
    }

    setIsSavingEvent(true)
    setEventErrorMessage(null)
    setEventSuccessMessage(null)

    try {
      const payload = new FormData()
      payload.append('title', eventForm.title)
      payload.append('description', eventForm.description)
      payload.append('categoryId', eventForm.categoryId)
      payload.append('locationAddress', eventForm.locationAddress)
      payload.append('locationCity', eventForm.locationCity)
      payload.append('locationPostalCode', eventForm.locationPostalCode)
      payload.append('locationCountry', eventForm.locationCountry)
      payload.append('locationLatitude', eventForm.locationLatitude)
      payload.append('locationLongitude', eventForm.locationLongitude)
      payload.append('startDatetime', eventForm.startDatetime)
      payload.append('endDatetime', eventForm.endDatetime)
      payload.append('capacity', eventForm.capacity)
      payload.append('status', eventForm.status)

      if (eventForm.thumbnailPhoto) {
        payload.append('thumbnailPhoto', eventForm.thumbnailPhoto)
      }

      if (eventForm.coverPhoto) {
        payload.append('coverPhoto', eventForm.coverPhoto)
      }

      const response = await updateOrganizerEvent(Number(eventId), payload)
      const updatedEvent = {
        ...response.event,
        scanStats: response.event.scanStats ?? event?.scanStats,
      }

      setEvent(updatedEvent)
      setEventForm(buildEventFormFromEvent(updatedEvent))
      setEventSuccessMessage(response.message)
    } catch (error) {
      setEventErrorMessage(
        extractErrorMessage(
          error,
          "Impossible de mettre a jour la fiche evenement pour le moment.",
        ),
      )
    } finally {
      setIsSavingEvent(false)
    }
  }

  async function handleTicketCreate(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()

    if (!eventId || isSavingTicket) {
      return
    }

    setIsSavingTicket(true)
    setTicketErrorMessage(null)
    setTicketSuccessMessage(null)

    try {
      const response = await createOrganizerTicketType(Number(eventId), ticketForm)

      setTicketTypes((current) => [response.ticketType, ...current])
      setTicketForm(initialTicketForm)
      setTicketSuccessMessage(response.message)
      revealTicketSection()
    } catch (error) {
      setTicketErrorMessage(
        extractErrorMessage(error, 'Impossible de creer le billet pour le moment.'),
      )
      revealTicketSection()
    } finally {
      setIsSavingTicket(false)
    }
  }

  async function handleTicketUpdate(
    ticketTypeId: number,
    submitEvent: FormEvent<HTMLFormElement>,
  ) {
    submitEvent.preventDefault()

    if (isSavingTicket) {
      return
    }

    setIsSavingTicket(true)
    setTicketErrorMessage(null)
    setTicketSuccessMessage(null)

    try {
      const response = await updateOrganizerTicketType(ticketTypeId, editingTicketForm)

      setTicketTypes((current) =>
        current.map((ticketType) =>
          ticketType.id === ticketTypeId ? response.ticketType : ticketType,
        ),
      )
      setEditingTicketId(null)
      setEditingTicketForm(initialTicketForm)
      setTicketSuccessMessage(response.message)
      revealTicketSection()
    } catch (error) {
      setTicketErrorMessage(
        extractErrorMessage(
          error,
          'Impossible de mettre a jour le billet pour le moment.',
        ),
      )
      revealTicketSection()
    } finally {
      setIsSavingTicket(false)
    }
  }

  async function handleTicketDelete(ticketTypeId: number) {
    if (deletingTicketId !== null) {
      return
    }

    setDeletingTicketId(ticketTypeId)
    setTicketErrorMessage(null)
    setTicketSuccessMessage(null)

    try {
      const response = await deleteOrganizerTicketType(ticketTypeId)

      setTicketTypes((current) =>
        current.filter((ticketType) => ticketType.id !== ticketTypeId),
      )
      setTicketSuccessMessage(response.message)
      revealTicketSection()

      if (editingTicketId === ticketTypeId) {
        setEditingTicketId(null)
        setEditingTicketForm(initialTicketForm)
      }
    } catch (error) {
      setTicketErrorMessage(
        extractErrorMessage(error, 'Impossible de supprimer le billet pour le moment.'),
      )
      revealTicketSection()
    } finally {
      setDeletingTicketId(null)
    }
  }

  if (isLoading) {
    return (
      <OrganizerEventDetailSection>
        <OrganizerEventDetailShell>
          <OrganizerEventDetailState>
            Chargement de la fiche organisateur de l evenement...
          </OrganizerEventDetailState>
        </OrganizerEventDetailShell>
      </OrganizerEventDetailSection>
    )
  }

  if (eventErrorMessage && !event) {
    return (
      <OrganizerEventDetailSection>
        <OrganizerEventDetailShell>
          <OrganizerEventDetailBackButton
            type="button"
            onClick={() => navigate('/organizer/events')}
          >
            Revenir a mes evenements
          </OrganizerEventDetailBackButton>
          <OrganizerEventDetailError>{eventErrorMessage}</OrganizerEventDetailError>
        </OrganizerEventDetailShell>
      </OrganizerEventDetailSection>
    )
  }

  return (
    <OrganizerEventDetailSection>
      <OrganizerEventDetailShell>
        <OrganizerEventDetailBackButton
          type="button"
          onClick={() => navigate('/organizer/events')}
        >
          Revenir a mes evenements
        </OrganizerEventDetailBackButton>

        <OrganizerEventDetailHero>
          <OrganizerEventDetailCover
            $imageUrl={resolveMediaUrl(event?.coverPhoto ?? event?.thumbnailPhoto ?? null)}
          />
          <OrganizerEventDetailHeroContent>
            <OrganizerEventDetailEyebrow>Espace organisateur</OrganizerEventDetailEyebrow>
            <OrganizerEventDetailTitle>{event?.title ?? 'Fiche evenement'}</OrganizerEventDetailTitle>
            <OrganizerEventDetailText>
              {currentUser
                ? `${currentUser.firstName}, tu peux maintenant mettre a jour toute la fiche evenement ici, puis gerer les billets juste en dessous.`
                : "Retrouve ici la fiche organisateur de ton evenement et sa billetterie."}
            </OrganizerEventDetailText>
            <OrganizerEventDetailStatusBadge $published={event?.status === 'published'}>
              {formatStatusLabel(event?.status ?? 'draft')}
            </OrganizerEventDetailStatusBadge>

            <OrganizerEventDetailInfoPanel>
              <OrganizerEventDetailInfoTitle>Resume de la fiche</OrganizerEventDetailInfoTitle>
              <OrganizerEventDetailInfoText>
                {event?.category.name ?? 'Categorie'} - {event?.location.city ?? 'Ville'}
              </OrganizerEventDetailInfoText>
              <OrganizerEventDetailInfoText>
                Debut: {formatOrganizerDate(event?.startDatetime ?? null)}
              </OrganizerEventDetailInfoText>
              <OrganizerEventDetailInfoText>
                Capacite maximale: {event?.capacity ?? 0} place(s)
              </OrganizerEventDetailInfoText>
            </OrganizerEventDetailInfoPanel>
          </OrganizerEventDetailHeroContent>
        </OrganizerEventDetailHero>

        <OrganizerEventDetailSplitSection>
          <OrganizerEventDetailSplitHeader>
            <OrganizerEventDetailSplitEyebrow>Evenement</OrganizerEventDetailSplitEyebrow>
            <OrganizerEventDetailSplitTitle>Fiche evenement</OrganizerEventDetailSplitTitle>
            <OrganizerEventDetailSplitText>
              Mets a jour ici la fiche publique complete de ton evenement : contenu, lieu, dates, medias et statut.
            </OrganizerEventDetailSplitText>
          </OrganizerEventDetailSplitHeader>

          {eventErrorMessage ? (
            <OrganizerEventDetailError>{eventErrorMessage}</OrganizerEventDetailError>
          ) : null}
          {eventSuccessMessage ? (
            <OrganizerEventDetailSuccess>{eventSuccessMessage}</OrganizerEventDetailSuccess>
          ) : null}

          <OrganizerEventDetailForm onSubmit={handleEventSubmit}>
            <OrganizerEventDetailGrid>
              <OrganizerEventDetailField>
                <OrganizerEventDetailLabel>Titre</OrganizerEventDetailLabel>
                <OrganizerEventDetailInput
                  value={eventForm.title}
                  onChange={(changeEvent) =>
                    setEventForm((current) => ({
                      ...current,
                      title: changeEvent.target.value,
                    }))
                  }
                  placeholder="Soiree Tech EventFlow"
                  required
                />
              </OrganizerEventDetailField>

              <OrganizerEventDetailField>
                <OrganizerEventDetailLabel>Capacite</OrganizerEventDetailLabel>
                <OrganizerEventDetailInput
                  type="number"
                  min="1"
                  value={eventForm.capacity}
                  onChange={(changeEvent) =>
                    setEventForm((current) => ({
                      ...current,
                      capacity: changeEvent.target.value,
                    }))
                  }
                  placeholder="150"
                  required
                />
                <OrganizerEventDetailHint>
                  La capacite ne peut pas descendre sous le stock deja alloue aux billets.
                </OrganizerEventDetailHint>
              </OrganizerEventDetailField>
            </OrganizerEventDetailGrid>

            <OrganizerEventDetailField>
              <OrganizerEventDetailLabel>Description</OrganizerEventDetailLabel>
              <OrganizerEventDetailTextarea
                value={eventForm.description}
                onChange={(changeEvent) =>
                  setEventForm((current) => ({
                    ...current,
                    description: changeEvent.target.value,
                  }))
                }
                required
              />
            </OrganizerEventDetailField>

            <OrganizerEventDetailField>
              <OrganizerEventDetailLabel>Categorie</OrganizerEventDetailLabel>
              <OrganizerEventDetailSelect
                value={eventForm.categoryId}
                onChange={(changeEvent) =>
                  setEventForm((current) => ({
                    ...current,
                    categoryId: changeEvent.target.value,
                  }))
                }
                required
              >
                <option value="">Choisir une categorie</option>
                {options.categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </OrganizerEventDetailSelect>
              {selectedCategory?.description ? (
                <OrganizerEventDetailHint>{selectedCategory.description}</OrganizerEventDetailHint>
              ) : (
                <OrganizerEventDetailHint>
                  Choisis la categorie qui correspond le mieux au tri public de cet evenement.
                </OrganizerEventDetailHint>
              )}
            </OrganizerEventDetailField>

            <OrganizerEventDetailGrid>
              <OrganizerEventDetailField>
                <OrganizerEventDetailLabel>Adresse</OrganizerEventDetailLabel>
                <OrganizerEventDetailInput
                  value={eventForm.locationAddress}
                  onChange={(changeEvent) =>
                    setEventForm((current) => ({
                      ...current,
                      locationAddress: changeEvent.target.value,
                    }))
                  }
                  placeholder="10 Rue de l Example"
                  required
                />
              </OrganizerEventDetailField>

              <OrganizerEventDetailField>
                <OrganizerEventDetailLabel>Ville</OrganizerEventDetailLabel>
                <OrganizerEventDetailInput
                  value={eventForm.locationCity}
                  onChange={(changeEvent) =>
                    setEventForm((current) => ({
                      ...current,
                      locationCity: changeEvent.target.value,
                    }))
                  }
                  placeholder="Paris"
                  required
                />
              </OrganizerEventDetailField>
            </OrganizerEventDetailGrid>

            <OrganizerEventDetailGrid>
              <OrganizerEventDetailField>
                <OrganizerEventDetailLabel>Code postal</OrganizerEventDetailLabel>
                <OrganizerEventDetailInput
                  value={eventForm.locationPostalCode}
                  onChange={(changeEvent) =>
                    setEventForm((current) => ({
                      ...current,
                      locationPostalCode: changeEvent.target.value,
                    }))
                  }
                  placeholder="75010"
                  required
                />
              </OrganizerEventDetailField>

              <OrganizerEventDetailField>
                <OrganizerEventDetailLabel>Pays</OrganizerEventDetailLabel>
                <OrganizerEventDetailInput
                  value={eventForm.locationCountry}
                  onChange={(changeEvent) =>
                    setEventForm((current) => ({
                      ...current,
                      locationCountry: changeEvent.target.value,
                    }))
                  }
                  placeholder="France"
                  required
                />
              </OrganizerEventDetailField>
            </OrganizerEventDetailGrid>

            <OrganizerEventDetailGrid>
              <OrganizerEventDetailField>
                <OrganizerEventDetailLabel>Latitude</OrganizerEventDetailLabel>
                <OrganizerEventDetailInput
                  type="number"
                  step="0.0000001"
                  value={eventForm.locationLatitude}
                  onChange={(changeEvent) =>
                    setEventForm((current) => ({
                      ...current,
                      locationLatitude: changeEvent.target.value,
                    }))
                  }
                  placeholder="48.8566000"
                />
                <OrganizerEventDetailHint>
                  Facultatif. Utile si tu veux positionner precisement le lieu.
                </OrganizerEventDetailHint>
              </OrganizerEventDetailField>

              <OrganizerEventDetailField>
                <OrganizerEventDetailLabel>Longitude</OrganizerEventDetailLabel>
                <OrganizerEventDetailInput
                  type="number"
                  step="0.0000001"
                  value={eventForm.locationLongitude}
                  onChange={(changeEvent) =>
                    setEventForm((current) => ({
                      ...current,
                      locationLongitude: changeEvent.target.value,
                    }))
                  }
                  placeholder="2.3522000"
                />
                <OrganizerEventDetailHint>
                  Facultatif. Laisse vide si tu n as pas encore les coordonnees.
                </OrganizerEventDetailHint>
              </OrganizerEventDetailField>
            </OrganizerEventDetailGrid>

            <OrganizerEventDetailGrid>
              <OrganizerEventDetailField>
                <OrganizerEventDetailLabel>Debut</OrganizerEventDetailLabel>
                <OrganizerEventDetailInput
                  type="datetime-local"
                  min={editableMinimumStartDatetime}
                  value={eventForm.startDatetime}
                  onChange={(changeEvent) =>
                    setEventForm((current) => {
                      const nextStartDatetime = changeEvent.target.value
                      let nextEndDatetime = current.endDatetime

                      if (
                        nextStartDatetime.trim() !== '' &&
                        (
                          nextEndDatetime.trim() === '' ||
                          new Date(nextEndDatetime) <= new Date(nextStartDatetime)
                        )
                      ) {
                        nextEndDatetime = addMinutesToDateTimeLocal(
                          nextStartDatetime,
                          60,
                        )
                      }

                      return {
                        ...current,
                        startDatetime: nextStartDatetime,
                        endDatetime: nextEndDatetime,
                      }
                    })
                  }
                  required
                />
                <OrganizerEventDetailHint>
                  Si ton evenement est deja passe, tu peux garder sa date actuelle pour modifier le reste de la fiche.
                </OrganizerEventDetailHint>
              </OrganizerEventDetailField>

              <OrganizerEventDetailField>
                <OrganizerEventDetailLabel>Fin</OrganizerEventDetailLabel>
                <OrganizerEventDetailInput
                  type="datetime-local"
                  min={minimumEndDatetime}
                  value={eventForm.endDatetime}
                  onChange={(changeEvent) =>
                    setEventForm((current) => ({
                      ...current,
                      endDatetime: changeEvent.target.value,
                    }))
                  }
                  required
                />
                <OrganizerEventDetailHint>
                  La fin doit toujours rester apres le debut.
                </OrganizerEventDetailHint>
              </OrganizerEventDetailField>
            </OrganizerEventDetailGrid>

            <OrganizerEventDetailMediaGrid>
              <OrganizerEventDetailMediaCard>
                <OrganizerEventDetailMediaLabel>Miniature actuelle</OrganizerEventDetailMediaLabel>
                <OrganizerEventDetailMediaPreview
                  $imageUrl={resolveMediaUrl(event?.thumbnailPhoto ?? null)}
                />
                <OrganizerEventDetailField>
                  <OrganizerEventDetailLabel>Remplacer la miniature</OrganizerEventDetailLabel>
                  <OrganizerEventDetailInput
                    type="file"
                    accept="image/*"
                    onChange={(changeEvent) =>
                      setEventForm((current) => ({
                        ...current,
                        thumbnailPhoto: changeEvent.target.files?.[0] ?? null,
                      }))
                    }
                  />
                </OrganizerEventDetailField>
                <OrganizerEventDetailHint>
                  Laisse vide pour conserver la miniature actuelle.
                </OrganizerEventDetailHint>
              </OrganizerEventDetailMediaCard>

              <OrganizerEventDetailMediaCard>
                <OrganizerEventDetailMediaLabel>Cover actuelle</OrganizerEventDetailMediaLabel>
                <OrganizerEventDetailMediaPreview
                  $imageUrl={resolveMediaUrl(event?.coverPhoto ?? null)}
                />
                <OrganizerEventDetailField>
                  <OrganizerEventDetailLabel>Remplacer la cover</OrganizerEventDetailLabel>
                  <OrganizerEventDetailInput
                    type="file"
                    accept="image/*"
                    onChange={(changeEvent) =>
                      setEventForm((current) => ({
                        ...current,
                        coverPhoto: changeEvent.target.files?.[0] ?? null,
                      }))
                    }
                  />
                </OrganizerEventDetailField>
                <OrganizerEventDetailHint>
                  Laisse vide pour conserver la cover actuelle.
                </OrganizerEventDetailHint>
              </OrganizerEventDetailMediaCard>
            </OrganizerEventDetailMediaGrid>

            <OrganizerEventDetailField>
              <OrganizerEventDetailLabel>Statut</OrganizerEventDetailLabel>
              <OrganizerEventDetailSelect
                value={eventForm.status}
                onChange={(changeEvent) =>
                  setEventForm((current) => ({
                    ...current,
                    status: changeEvent.target.value,
                  }))
                }
              >
                <option value="draft">Brouillon</option>
                <option value="published">Public</option>
              </OrganizerEventDetailSelect>
              <OrganizerEventDetailHint>
                Garde le statut en brouillon tant que la fiche ou la billetterie ne sont pas prêtes.
              </OrganizerEventDetailHint>
            </OrganizerEventDetailField>

            <OrganizerEventDetailActions>
              <OrganizerEventDetailPrimaryButton type="submit" disabled={isSavingEvent}>
                {isSavingEvent ? 'Mise a jour en cours...' : 'Mettre a jour la fiche'}
              </OrganizerEventDetailPrimaryButton>
              {event?.status === 'published' ? (
                <OrganizerEventDetailSecondaryButton
                  type="button"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  Voir la fiche publique
                </OrganizerEventDetailSecondaryButton>
              ) : null}
            </OrganizerEventDetailActions>
          </OrganizerEventDetailForm>
        </OrganizerEventDetailSplitSection>

        <OrganizerEventDetailDivider />

        <OrganizerEventDetailSplitSection>
          <OrganizerEventDetailSplitHeader>
            <OrganizerEventDetailSplitEyebrow>Scan</OrganizerEventDetailSplitEyebrow>
            <OrganizerEventDetailSplitTitle>Activite du staff</OrganizerEventDetailSplitTitle>
            <OrganizerEventDetailSplitText>
              Suis le nombre de scans realises pour cet evenement, avec le detail
              par membre du staff ou organisateur ayant utilise le poste de scan.
            </OrganizerEventDetailSplitText>
          </OrganizerEventDetailSplitHeader>

          <OrganizerEventDetailScanSummaryGrid>
            <OrganizerEventDetailScanStat>
              <OrganizerEventDetailScanStatLabel>Total scans</OrganizerEventDetailScanStatLabel>
              <OrganizerEventDetailScanStatValue>
                {scanStats?.totalScans ?? 0}
              </OrganizerEventDetailScanStatValue>
            </OrganizerEventDetailScanStat>
            <OrganizerEventDetailScanStat>
              <OrganizerEventDetailScanStatLabel>Valides</OrganizerEventDetailScanStatLabel>
              <OrganizerEventDetailScanStatValue>
                {scanStats?.validScans ?? 0}
              </OrganizerEventDetailScanStatValue>
            </OrganizerEventDetailScanStat>
            <OrganizerEventDetailScanStat>
              <OrganizerEventDetailScanStatLabel>Deja utilises</OrganizerEventDetailScanStatLabel>
              <OrganizerEventDetailScanStatValue>
                {scanStats?.alreadyUsedScans ?? 0}
              </OrganizerEventDetailScanStatValue>
            </OrganizerEventDetailScanStat>
            <OrganizerEventDetailScanStat>
              <OrganizerEventDetailScanStatLabel>Invalides</OrganizerEventDetailScanStatLabel>
              <OrganizerEventDetailScanStatValue>
                {scanStats?.invalidScans ?? 0}
              </OrganizerEventDetailScanStatValue>
            </OrganizerEventDetailScanStat>
          </OrganizerEventDetailScanSummaryGrid>

          {scanStaffMembers.length > 0 ? (
            <OrganizerEventDetailScanStaffList>
              {scanStaffMembers.map((staffSummary) => (
                <OrganizerEventDetailScanStaffCard
                  key={staffSummary.staffUser.id ?? staffSummary.staffUser.email ?? staffSummary.staffUser.displayName}
                >
                  <OrganizerEventDetailScanStaffHeader>
                    <div>
                      <OrganizerEventDetailScanStaffName>
                        {staffSummary.staffUser.displayName}
                      </OrganizerEventDetailScanStaffName>
                      <OrganizerEventDetailScanStaffMeta>
                        {staffSummary.staffUser.email ?? 'Email indisponible'}
                      </OrganizerEventDetailScanStaffMeta>
                    </div>
                    <OrganizerEventDetailScanStaffTotal>
                      {staffSummary.totalScans} scan(s)
                    </OrganizerEventDetailScanStaffTotal>
                  </OrganizerEventDetailScanStaffHeader>

                  <OrganizerEventDetailTicketStats>
                    <OrganizerEventDetailTicketStat>
                      <OrganizerEventDetailTicketStatLabel>Total</OrganizerEventDetailTicketStatLabel>
                      <OrganizerEventDetailTicketStatValue>
                        {staffSummary.totalScans}
                      </OrganizerEventDetailTicketStatValue>
                    </OrganizerEventDetailTicketStat>
                    <OrganizerEventDetailTicketStat>
                      <OrganizerEventDetailTicketStatLabel>Valides</OrganizerEventDetailTicketStatLabel>
                      <OrganizerEventDetailTicketStatValue>
                        {staffSummary.validScans}
                      </OrganizerEventDetailTicketStatValue>
                    </OrganizerEventDetailTicketStat>
                    <OrganizerEventDetailTicketStat>
                      <OrganizerEventDetailTicketStatLabel>Deja utilises</OrganizerEventDetailTicketStatLabel>
                      <OrganizerEventDetailTicketStatValue>
                        {staffSummary.alreadyUsedScans}
                      </OrganizerEventDetailTicketStatValue>
                    </OrganizerEventDetailTicketStat>
                    <OrganizerEventDetailTicketStat>
                      <OrganizerEventDetailTicketStatLabel>Invalides</OrganizerEventDetailTicketStatLabel>
                      <OrganizerEventDetailTicketStatValue>
                        {staffSummary.invalidScans}
                      </OrganizerEventDetailTicketStatValue>
                    </OrganizerEventDetailTicketStat>
                  </OrganizerEventDetailTicketStats>
                </OrganizerEventDetailScanStaffCard>
              ))}
            </OrganizerEventDetailScanStaffList>
          ) : (
            <OrganizerEventDetailState>
              Aucun scan n a encore ete enregistre pour cet evenement.
            </OrganizerEventDetailState>
          )}
        </OrganizerEventDetailSplitSection>

        <OrganizerEventDetailDivider />

        <OrganizerEventDetailSplitSection ref={ticketSectionRef}>
          <OrganizerEventDetailSplitHeader>
            <OrganizerEventDetailSplitEyebrow>Billets</OrganizerEventDetailSplitEyebrow>
            <OrganizerEventDetailSplitTitle>Billets de cet evenement</OrganizerEventDetailSplitTitle>
            <OrganizerEventDetailSplitText>
              Gere ici la billetterie liee a cet evenement, avec son stock, ses dates de vente et sa visibilite.
            </OrganizerEventDetailSplitText>
          </OrganizerEventDetailSplitHeader>

          {ticketErrorMessage ? (
            <OrganizerEventDetailError>{ticketErrorMessage}</OrganizerEventDetailError>
          ) : null}
          {ticketSectionMessage ? (
            <OrganizerEventDetailSuccess>{ticketSectionMessage}</OrganizerEventDetailSuccess>
          ) : null}

          <OrganizerEventDetailTicketSection>
          <OrganizerEventDetailTicketHeader>
            <div>
              <OrganizerEventDetailTicketTitle>Gestion des billets</OrganizerEventDetailTicketTitle>
              <OrganizerEventDetailTicketText>
                Chaque billet est lie a cet evenement. Son stock total s aligne sur la capacite de la fiche et ses dates de vente restent bornees par le calendrier de l evenement.
              </OrganizerEventDetailTicketText>
            </div>
          </OrganizerEventDetailTicketHeader>

          <OrganizerEventDetailTicketGrid>
            <OrganizerEventDetailTicketCreateCard>
              <OrganizerEventDetailInfoTitle>Creer un billet</OrganizerEventDetailInfoTitle>
              <OrganizerEventDetailInfoText>
                Definis un type de billet, son prix, son stock et sa fenetre de vente.
              </OrganizerEventDetailInfoText>
              <OrganizerEventDetailHint>
                Il reste actuellement {remainingTicketCapacity} place(s) a attribuer
                sur {eventCapacity} pour cet evenement.
              </OrganizerEventDetailHint>

              <OrganizerEventDetailForm onSubmit={handleTicketCreate}>
                <OrganizerEventDetailField>
                  <OrganizerEventDetailLabel>Nom du billet</OrganizerEventDetailLabel>
                  <OrganizerEventDetailInput
                    value={ticketForm.name}
                    onChange={(changeEvent) =>
                      setTicketForm((current) => ({
                        ...current,
                        name: changeEvent.target.value,
                      }))
                    }
                    placeholder="Standard"
                    required
                  />
                </OrganizerEventDetailField>

                <OrganizerEventDetailField>
                  <OrganizerEventDetailLabel>Description</OrganizerEventDetailLabel>
                  <OrganizerEventDetailTextarea
                    value={ticketForm.description}
                    onChange={(changeEvent) =>
                      setTicketForm((current) => ({
                        ...current,
                        description: changeEvent.target.value,
                      }))
                    }
                    placeholder="Acces general, placement libre..."
                  />
                </OrganizerEventDetailField>

                <OrganizerEventDetailGrid>
                  <OrganizerEventDetailField>
                    <OrganizerEventDetailLabel>Prix</OrganizerEventDetailLabel>
                    <OrganizerEventDetailInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={ticketForm.price}
                      onChange={(changeEvent) =>
                        setTicketForm((current) => ({
                          ...current,
                          price: changeEvent.target.value,
                        }))
                      }
                      placeholder="29.90"
                      required
                    />
                  </OrganizerEventDetailField>

                  <OrganizerEventDetailField>
                    <OrganizerEventDetailLabel>Stock</OrganizerEventDetailLabel>
                    <OrganizerEventDetailInput
                      type="number"
                      min="0"
                      max={remainingTicketCapacity > 0 ? remainingTicketCapacity : 0}
                      value={ticketForm.stock}
                      onChange={(changeEvent) =>
                        setTicketForm((current) => ({
                          ...current,
                          stock: changeEvent.target.value,
                        }))
                      }
                      placeholder="100"
                      required
                    />
                    <OrganizerEventDetailHint>
                      Tu peux encore attribuer jusqu a {remainingTicketCapacity} place(s)
                      a un nouveau billet, dans la limite des {eventCapacity} places de
                      l evenement.
                    </OrganizerEventDetailHint>
                  </OrganizerEventDetailField>
                </OrganizerEventDetailGrid>

                <OrganizerEventDetailGrid>
                  <OrganizerEventDetailField>
                    <OrganizerEventDetailLabel>Debut de vente</OrganizerEventDetailLabel>
                    <OrganizerEventDetailInput
                      type="datetime-local"
                      min={minimumTicketSalesStart}
                      value={ticketForm.salesStartAt}
                      onChange={(changeEvent) =>
                        setTicketForm((current) => {
                          const nextSalesStartAt = changeEvent.target.value
                          let nextSalesEndAt = current.salesEndAt

                          if (
                            nextSalesStartAt.trim() !== '' &&
                            (
                              nextSalesEndAt.trim() === '' ||
                              new Date(nextSalesEndAt) <= new Date(nextSalesStartAt)
                            )
                          ) {
                            nextSalesEndAt = addMinutesToDateTimeLocal(
                              nextSalesStartAt,
                              60,
                            )
                          }

                          return {
                            ...current,
                            salesStartAt: nextSalesStartAt,
                            salesEndAt: nextSalesEndAt,
                          }
                        })
                      }
                      required
                    />
                  </OrganizerEventDetailField>

                  <OrganizerEventDetailField>
                    <OrganizerEventDetailLabel>Fin de vente</OrganizerEventDetailLabel>
                    <OrganizerEventDetailInput
                      type="datetime-local"
                      min={minimumTicketSalesEnd}
                      value={ticketForm.salesEndAt}
                      onChange={(changeEvent) =>
                        setTicketForm((current) => ({
                          ...current,
                          salesEndAt: changeEvent.target.value,
                        }))
                      }
                      required
                    />
                    <OrganizerEventDetailHint>
                      La vente doit se terminer avant le debut de l evenement.
                    </OrganizerEventDetailHint>
                  </OrganizerEventDetailField>
                </OrganizerEventDetailGrid>

                <OrganizerEventDetailGrid>
                  <OrganizerEventDetailField>
                    <OrganizerEventDetailLabel>Maximum par commande</OrganizerEventDetailLabel>
                    <OrganizerEventDetailInput
                      type="number"
                      min="1"
                      value={ticketForm.maxPerOrder}
                      onChange={(changeEvent) =>
                        setTicketForm((current) => ({
                          ...current,
                          maxPerOrder: changeEvent.target.value,
                        }))
                      }
                      placeholder="4"
                    />
                  </OrganizerEventDetailField>

                  <OrganizerEventDetailField>
                    <OrganizerEventDetailLabel>Visibilite du billet</OrganizerEventDetailLabel>
                    <OrganizerEventDetailSelect
                      value={ticketForm.isActive ? 'active' : 'inactive'}
                      onChange={(changeEvent) =>
                        setTicketForm((current) => ({
                          ...current,
                          isActive: changeEvent.target.value === 'active',
                        }))
                      }
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </OrganizerEventDetailSelect>
                  </OrganizerEventDetailField>
                </OrganizerEventDetailGrid>

                <OrganizerEventDetailActions>
                  <OrganizerEventDetailPrimaryButton
                    type="submit"
                    disabled={isSavingTicket}
                  >
                    {isSavingTicket ? 'Creation en cours...' : 'Creer le billet'}
                  </OrganizerEventDetailPrimaryButton>
                </OrganizerEventDetailActions>
              </OrganizerEventDetailForm>
            </OrganizerEventDetailTicketCreateCard>

            <OrganizerEventDetailTicketList>
              {ticketTypes.length > 0 ? (
                ticketTypes.map((ticketType) => (
                  <OrganizerEventDetailTicketCard key={ticketType.id}>
                    <OrganizerEventDetailTicketCardHeader>
                      <div>
                        <OrganizerEventDetailTicketCardTitle>
                          {ticketType.name}
                        </OrganizerEventDetailTicketCardTitle>
                        <OrganizerEventDetailTicketCardText>
                          {ticketType.description ?? 'Aucune description pour ce billet.'}
                        </OrganizerEventDetailTicketCardText>
                      </div>
                      <OrganizerEventDetailTicketBadge $active={ticketType.isActive}>
                        {ticketType.isActive ? 'Actif' : 'Inactif'}
                      </OrganizerEventDetailTicketBadge>
                    </OrganizerEventDetailTicketCardHeader>

                    <OrganizerEventDetailTicketStats>
                      <OrganizerEventDetailTicketStat>
                        <OrganizerEventDetailTicketStatLabel>Prix</OrganizerEventDetailTicketStatLabel>
                        <OrganizerEventDetailTicketStatValue>
                          {formatCurrencyFromString(ticketType.price)}
                        </OrganizerEventDetailTicketStatValue>
                      </OrganizerEventDetailTicketStat>
                      <OrganizerEventDetailTicketStat>
                        <OrganizerEventDetailTicketStatLabel>Stock total</OrganizerEventDetailTicketStatLabel>
                        <OrganizerEventDetailTicketStatValue>{ticketType.stock}</OrganizerEventDetailTicketStatValue>
                      </OrganizerEventDetailTicketStat>
                      <OrganizerEventDetailTicketStat>
                        <OrganizerEventDetailTicketStatLabel>Vendus</OrganizerEventDetailTicketStatLabel>
                        <OrganizerEventDetailTicketStatValue>{ticketType.reservedQuantity}</OrganizerEventDetailTicketStatValue>
                      </OrganizerEventDetailTicketStat>
                      <OrganizerEventDetailTicketStat>
                        <OrganizerEventDetailTicketStatLabel>Disponible</OrganizerEventDetailTicketStatLabel>
                        <OrganizerEventDetailTicketStatValue>{ticketType.availableStock}</OrganizerEventDetailTicketStatValue>
                      </OrganizerEventDetailTicketStat>
                    </OrganizerEventDetailTicketStats>

                    <OrganizerEventDetailTicketCardText>
                      Vente: {formatOrganizerDate(ticketType.salesStartAt)} {'->'} {formatOrganizerDate(ticketType.salesEndAt)}
                    </OrganizerEventDetailTicketCardText>
                    <OrganizerEventDetailTicketCardText>
                      Max par commande: {ticketType.maxPerOrder ?? 'Non limite'}
                    </OrganizerEventDetailTicketCardText>

                    {editingTicketId === ticketType.id ? (
                      <OrganizerEventDetailForm
                        onSubmit={(submitEvent) =>
                          void handleTicketUpdate(ticketType.id, submitEvent)
                        }
                      >
                        <OrganizerEventDetailField>
                          <OrganizerEventDetailLabel>Nom du billet</OrganizerEventDetailLabel>
                          <OrganizerEventDetailInput
                            value={editingTicketForm.name}
                            onChange={(changeEvent) =>
                              setEditingTicketForm((current) => ({
                                ...current,
                                name: changeEvent.target.value,
                              }))
                            }
                            required
                          />
                        </OrganizerEventDetailField>
                        <OrganizerEventDetailField>
                          <OrganizerEventDetailLabel>Description</OrganizerEventDetailLabel>
                          <OrganizerEventDetailTextarea
                            value={editingTicketForm.description}
                            onChange={(changeEvent) =>
                              setEditingTicketForm((current) => ({
                                ...current,
                                description: changeEvent.target.value,
                              }))
                            }
                          />
                        </OrganizerEventDetailField>
                        <OrganizerEventDetailGrid>
                          <OrganizerEventDetailField>
                            <OrganizerEventDetailLabel>Prix</OrganizerEventDetailLabel>
                            <OrganizerEventDetailInput
                              type="number"
                              min="0"
                              step="0.01"
                              value={editingTicketForm.price}
                              onChange={(changeEvent) =>
                                setEditingTicketForm((current) => ({
                                  ...current,
                                  price: changeEvent.target.value,
                                }))
                              }
                              required
                            />
                          </OrganizerEventDetailField>
                          <OrganizerEventDetailField>
                            <OrganizerEventDetailLabel>Stock</OrganizerEventDetailLabel>
                            <OrganizerEventDetailInput
                              type="number"
                              min="0"
                              max={
                                editableRemainingCapacityForCurrentTicket > 0
                                  ? editableRemainingCapacityForCurrentTicket
                                  : 0
                              }
                              value={editingTicketForm.stock}
                              onChange={(changeEvent) =>
                                setEditingTicketForm((current) => ({
                                  ...current,
                                  stock: changeEvent.target.value,
                                }))
                              }
                              required
                            />
                            <OrganizerEventDetailHint>
                              Pour ce billet, tu peux monter jusqu a{' '}
                              {editableRemainingCapacityForCurrentTicket} place(s)
                              sans depasser la capacite globale de l evenement.
                            </OrganizerEventDetailHint>
                          </OrganizerEventDetailField>
                        </OrganizerEventDetailGrid>
                        <OrganizerEventDetailGrid>
                          <OrganizerEventDetailField>
                            <OrganizerEventDetailLabel>Debut de vente</OrganizerEventDetailLabel>
                            <OrganizerEventDetailInput
                              type="datetime-local"
                              value={editingTicketForm.salesStartAt}
                              onChange={(changeEvent) =>
                                setEditingTicketForm((current) => ({
                                  ...current,
                                  salesStartAt: changeEvent.target.value,
                                }))
                              }
                              required
                            />
                          </OrganizerEventDetailField>
                          <OrganizerEventDetailField>
                            <OrganizerEventDetailLabel>Fin de vente</OrganizerEventDetailLabel>
                            <OrganizerEventDetailInput
                              type="datetime-local"
                              value={editingTicketForm.salesEndAt}
                              onChange={(changeEvent) =>
                                setEditingTicketForm((current) => ({
                                  ...current,
                                  salesEndAt: changeEvent.target.value,
                                }))
                              }
                              required
                            />
                          </OrganizerEventDetailField>
                        </OrganizerEventDetailGrid>
                        <OrganizerEventDetailGrid>
                          <OrganizerEventDetailField>
                            <OrganizerEventDetailLabel>Maximum par commande</OrganizerEventDetailLabel>
                            <OrganizerEventDetailInput
                              type="number"
                              min="1"
                              value={editingTicketForm.maxPerOrder}
                              onChange={(changeEvent) =>
                                setEditingTicketForm((current) => ({
                                  ...current,
                                  maxPerOrder: changeEvent.target.value,
                                }))
                              }
                            />
                          </OrganizerEventDetailField>
                          <OrganizerEventDetailField>
                            <OrganizerEventDetailLabel>Visibilite du billet</OrganizerEventDetailLabel>
                            <OrganizerEventDetailSelect
                              value={editingTicketForm.isActive ? 'active' : 'inactive'}
                              onChange={(changeEvent) =>
                                setEditingTicketForm((current) => ({
                                  ...current,
                                  isActive: changeEvent.target.value === 'active',
                                }))
                              }
                            >
                              <option value="active">Actif</option>
                              <option value="inactive">Inactif</option>
                            </OrganizerEventDetailSelect>
                          </OrganizerEventDetailField>
                        </OrganizerEventDetailGrid>
                        <OrganizerEventDetailActions>
                          <OrganizerEventDetailPrimaryButton
                            type="submit"
                            disabled={isSavingTicket}
                          >
                            {isSavingTicket ? 'Mise a jour...' : 'Enregistrer le billet'}
                          </OrganizerEventDetailPrimaryButton>
                          <OrganizerEventDetailSecondaryButton
                            type="button"
                            onClick={() => {
                              setEditingTicketId(null)
                              setEditingTicketForm(initialTicketForm)
                            }}
                          >
                            Annuler
                          </OrganizerEventDetailSecondaryButton>
                        </OrganizerEventDetailActions>
                      </OrganizerEventDetailForm>
                    ) : (
                      <OrganizerEventDetailTicketCardActions>
                        <OrganizerEventDetailSecondaryButton
                          type="button"
                          onClick={() => {
                            setEditingTicketId(ticketType.id)
                            setEditingTicketForm(buildTicketFormFromTicketType(ticketType))
                          }}
                        >
                          Modifier ce billet
                        </OrganizerEventDetailSecondaryButton>
                        <OrganizerEventDetailDangerButton
                          type="button"
                          onClick={() => void handleTicketDelete(ticketType.id)}
                          disabled={deletingTicketId === ticketType.id}
                        >
                          {deletingTicketId === ticketType.id
                            ? 'Suppression...'
                            : 'Supprimer'}
                        </OrganizerEventDetailDangerButton>
                      </OrganizerEventDetailTicketCardActions>
                    )}
                  </OrganizerEventDetailTicketCard>
                ))
              ) : (
                <OrganizerEventDetailState>
                  Aucun billet n est encore rattache a cet evenement. Cree le premier type de billet a gauche pour lancer la billetterie.
                </OrganizerEventDetailState>
              )}
            </OrganizerEventDetailTicketList>
          </OrganizerEventDetailTicketGrid>
          </OrganizerEventDetailTicketSection>
        </OrganizerEventDetailSplitSection>
      </OrganizerEventDetailShell>
    </OrganizerEventDetailSection>
  )
}
