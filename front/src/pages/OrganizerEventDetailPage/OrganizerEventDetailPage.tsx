import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import {
  ADMIN_ORGANIZER_READ_ONLY_MESSAGE,
  canEditOrganizerResource,
  canUseOrganizerAdminTools,
  isAdminUser,
} from '../../auth/adminPermissions'
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
import {
  createOrganizerGuestTicket,
  getOrganizerGuestTickets,
} from '../../api/organizerGuestTickets'
import type { AuthUser } from '../../types/auth'
import type {
  OrganizerEventFormOptions,
  OrganizerEventSummary,
} from '../../types/organizerEvent'
import type {
  OrganizerTicketType,
  OrganizerTicketTypePayload,
} from '../../types/organizerTicketType'
import type {
  OrganizerGuestTicket,
  OrganizerGuestTicketPayload,
} from '../../types/organizerGuestTicket'
import {
  OrganizerEventDetailActions,
  OrganizerEventDetailBackButton,
  OrganizerEventDetailDangerButton,
  OrganizerEventDetailError,
  OrganizerEventDetailField,
  OrganizerEventDetailForm,
  OrganizerEventDetailGrid,
  OrganizerEventDetailGuestBadge,
  OrganizerEventDetailGuestCard,
  OrganizerEventDetailGuestGrid,
  OrganizerEventDetailGuestList,
  OrganizerEventDetailGuestMeta,
  OrganizerEventDetailGuestName,
  OrganizerEventDetailGuestSection,
  OrganizerEventDetailGuestText,
  OrganizerEventDetailHint,
  OrganizerEventDetailInfoText,
  OrganizerEventDetailInfoTitle,
  OrganizerEventDetailInput,
  OrganizerEventDetailLabel,
  OrganizerEventDetailLinkButton,
  OrganizerEventDetailMediaCard,
  OrganizerEventDetailMediaGrid,
  OrganizerEventDetailMediaLabel,
  OrganizerEventDetailMediaPreview,
  OrganizerEventDetailPrimaryButton,
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
  OrganizerEventDetailSuccess,
  OrganizerEventDetailTabButton,
  OrganizerEventDetailTabs,
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
  OrganizerEventDetailVideoPreview,
} from './organizerEventDetailPageElements'
import {
  formatCurrencyFromString,
  formatOrganizerDate,
  resolveMediaUrl,
} from './organizerEventDetailFormatters'
import {
  OrganizerEventBoosterSection,
  OrganizerEventHero,
  OrganizerEventOverviewSection,
  OrganizerEventScanSection,
} from './OrganizerEventDetailSections'

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
  eventVideo: File | null
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
  eventVideo: null,
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

const initialGuestTicketForm: OrganizerGuestTicketPayload = {
  recipientName: '',
  recipientEmail: '',
  ticketTypeId: '',
}

type OrganizerEventDetailTab = 'overview' | 'event' | 'booster' | 'scan' | 'tickets'

const organizerEventDetailTabs: Array<{
  id: OrganizerEventDetailTab
  label: string
}> = [
  { id: 'overview', label: 'Aperçu' },
  { id: 'event', label: 'évènement' },
  { id: 'booster', label: 'Booster' },
  { id: 'scan', label: 'Scan' },
  { id: 'tickets', label: 'Billets' },
]

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
    eventVideo: null,
  }
}

function isEventFinished(value: string | null): boolean {
  if (!value) {
    return false
  }

  const endDatetime = new Date(value)

  return !Number.isNaN(endDatetime.getTime()) && endDatetime < new Date()
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
  const [activeTab, setActiveTab] = useState<OrganizerEventDetailTab>(() =>
    searchParams.get('focus') === 'tickets' ? 'tickets' : 'overview',
  )
  const [currentDateTime] = useState(() => formatDateTimeLocal(new Date()))
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const isAdminReadOnly = isAdminUser(currentUser)
  const canEditOrganizerEvent = canEditOrganizerResource(currentUser)
  const [event, setEvent] = useState<OrganizerEventSummary | null>(null)
  const [options, setOptions] = useState<OrganizerEventFormOptions>(emptyOptions)
  const [ticketTypes, setTicketTypes] = useState<OrganizerTicketType[]>([])
  const [guestTickets, setGuestTickets] = useState<OrganizerGuestTicket[]>([])
  const [eventForm, setEventForm] = useState<OrganizerEventEditFormState>(
    initialEventForm,
  )
  const [ticketForm, setTicketForm] = useState<OrganizerTicketTypePayload>(
    initialTicketForm,
  )
  const [guestTicketForm, setGuestTicketForm] =
    useState<OrganizerGuestTicketPayload>(initialGuestTicketForm)
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null)
  const [editingTicketForm, setEditingTicketForm] =
    useState<OrganizerTicketTypePayload>(initialTicketForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [isSavingTicket, setIsSavingTicket] = useState(false)
  const [isSendingGuestTicket, setIsSendingGuestTicket] = useState(false)
  const [deletingTicketId, setDeletingTicketId] = useState<number | null>(null)
  const [eventErrorMessage, setEventErrorMessage] = useState<string | null>(null)
  const [eventSuccessMessage, setEventSuccessMessage] = useState<string | null>(null)
  const [ticketErrorMessage, setTicketErrorMessage] = useState<string | null>(null)
  const [ticketSuccessMessage, setTicketSuccessMessage] = useState<string | null>(null)
  const [guestTicketErrorMessage, setGuestTicketErrorMessage] = useState<string | null>(null)
  const [guestTicketSuccessMessage, setGuestTicketSuccessMessage] = useState<string | null>(null)

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

  const availableInvitationTicketTypes = useMemo(
    () =>
      ticketTypes.filter(
        (ticketType) => ticketType.isActive && ticketType.availableStock > 0,
      ),
    [ticketTypes],
  )

  const totalAvailableTickets = useMemo(
    () =>
      ticketTypes.reduce(
        (total, ticketType) => total + Math.max(0, ticketType.availableStock),
        0,
      ),
    [ticketTypes],
  )

  const guestTicketsCheckedIn = useMemo(
    () => guestTickets.filter((guestTicket) => guestTicket.hasCheckedIn).length,
    [guestTickets],
  )

  const createdFromEventSetup = searchParams.get('created') === '1'
  const shouldFocusTickets = searchParams.get('focus') === 'tickets'
  const ticketSectionMessage =
    ticketSuccessMessage ??
    (createdFromEventSetup
      ? "?v?nement cr?? avec succ?s. Tu peux maintenant ajouter les billets de cet ?v?nement."
      : null)
  const scanStats = event?.scanStats ?? null
  const scanStaffMembers = scanStats?.staffMembers ?? []
  const eventSales = event?.sales ?? {
    revenueTotal: '0.00',
    paidOrders: 0,
    ticketsSold: 0,
    currency: 'EUR',
  }
  const eventScans = event?.scans ?? {
    total: scanStats?.totalScans ?? 0,
    valid: scanStats?.validScans ?? 0,
    invalid: scanStats?.invalidScans ?? 0,
    alreadyUsed: scanStats?.alreadyUsedScans ?? 0,
  }
  const eventIsFinished = isEventFinished(event?.endDatetime ?? null)
  const staffScanParticipants = scanStaffMembers.filter(
    (staffSummary) => staffSummary.totalScans > 0,
  ).length

  function scrollToTicketSection() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        ticketSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    })
  }

  function revealTicketSection() {
    setActiveTab('tickets')
    scrollToTicketSection()
  }

  useEffect(() => {
    let isMounted = true

    async function loadOrganizerEventDetail() {
      if (!eventId) {
        setEventErrorMessage("Impossible de retrouver l’évènement organisateur demandé.")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setEventErrorMessage(null)
      setEventSuccessMessage(null)
      setTicketErrorMessage(null)
      setTicketSuccessMessage(null)
      setGuestTicketErrorMessage(null)
      setGuestTicketSuccessMessage(null)

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

        const [
          organizerEventResponse,
          organizerOptions,
          organizerTicketTypes,
          organizerGuestTickets,
        ] =
          await Promise.all([
            getOrganizerEvent(Number(eventId)),
            getOrganizerEventFormOptions(),
            getOrganizerTicketTypes(Number(eventId)),
            getOrganizerGuestTickets(Number(eventId)),
          ])

        if (isMounted) {
          setCurrentUser(user)
          setEvent(organizerEventResponse.event)
          setOptions(organizerOptions)
          setEventForm(buildEventFormFromEvent(organizerEventResponse.event))
          setTicketTypes(organizerTicketTypes)
          setGuestTickets(organizerGuestTickets.guestTickets)
        }
      } catch (error) {
        if (isMounted) {
          setEventErrorMessage(
            extractErrorMessage(
              error,
              "Impossible de charger la fiche organisateur de l’évènement pour le moment.",
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

    scrollToTicketSection()
  }, [event, isLoading, shouldFocusTickets])

  async function handleEventSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()

    if (!eventId || isSavingEvent) {
      return
    }

    if (!canEditOrganizerEvent) {
      setEventErrorMessage(ADMIN_ORGANIZER_READ_ONLY_MESSAGE)
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
        'Renseigne le titre, la description, la catégorie et toutes les informations de lieu avant de sauvegarder.',
      )
      return
    }

    if (
      !Number.isFinite(Number(eventForm.capacity)) ||
      Number(eventForm.capacity) <= 0
    ) {
      setEventErrorMessage('La capacité doit être un entier positif.')
      return
    }

    const startDatetime = new Date(eventForm.startDatetime)
    const endDatetime = new Date(eventForm.endDatetime)
    const now = new Date()

    if (Number.isNaN(startDatetime.getTime()) || Number.isNaN(endDatetime.getTime())) {
      setEventErrorMessage('Renseigne des dates valides pour le début et la fin.')
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
      setEventErrorMessage('La date de début ne peut pas être dans le passé.')
      return
    }

    if (endDatetime <= startDatetime) {
      setEventErrorMessage('La date de fin doit être postérieure à la date de début.')
      return
    }

    if (eventForm.eventVideo && endDatetime >= now) {
      setEventErrorMessage(
        'La vidéo souvenir peut être ajoutée uniquement quand l’évènement est terminé.',
      )
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

      if (eventForm.eventVideo) {
        payload.append('eventVideo', eventForm.eventVideo)
      }

      const response = await updateOrganizerEvent(Number(eventId), payload)
      const updatedEvent = {
        ...response.event,
        sales: response.event.sales ?? event?.sales,
        scans: response.event.scans ?? event?.scans,
        scanStats: response.event.scanStats ?? event?.scanStats,
      }

      setEvent(updatedEvent)
      setEventForm(buildEventFormFromEvent(updatedEvent))
      setEventSuccessMessage(response.message)
    } catch (error) {
      setEventErrorMessage(
        extractErrorMessage(
          error,
          "Impossible de mettre à jour la fiche évènement pour le moment.",
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

    if (!canEditOrganizerEvent) {
      setTicketErrorMessage(ADMIN_ORGANIZER_READ_ONLY_MESSAGE)
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
        extractErrorMessage(error, 'Impossible de créer le billet pour le moment.'),
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

    if (!canEditOrganizerEvent) {
      setTicketErrorMessage(ADMIN_ORGANIZER_READ_ONLY_MESSAGE)
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
          'Impossible de mettre à jour le billet pour le moment.',
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

    if (!canEditOrganizerEvent) {
      setTicketErrorMessage(ADMIN_ORGANIZER_READ_ONLY_MESSAGE)
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

  async function handleGuestTicketCreate(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault()

    if (!eventId || isSendingGuestTicket) {
      return
    }

    if (!canEditOrganizerEvent) {
      setGuestTicketErrorMessage(ADMIN_ORGANIZER_READ_ONLY_MESSAGE)
      return
    }

    if (
      guestTicketForm.recipientEmail.trim() === '' ||
      guestTicketForm.ticketTypeId.trim() === ''
    ) {
      setGuestTicketErrorMessage('Renseigne au minimum l’email et le billet à envoyer.')
      return
    }

    setIsSendingGuestTicket(true)
    setGuestTicketErrorMessage(null)
    setGuestTicketSuccessMessage(null)

    try {
      const response = await createOrganizerGuestTicket(
        Number(eventId),
        guestTicketForm,
      )
      const selectedTicketTypeId = Number(guestTicketForm.ticketTypeId)

      setGuestTickets((current) => [response.guestTicket, ...current])
      setTicketTypes((current) =>
        current.map((ticketType) =>
          ticketType.id === selectedTicketTypeId
            ? {
                ...ticketType,
                reservedQuantity: ticketType.reservedQuantity + 1,
                availableStock: Math.max(0, ticketType.availableStock - 1),
              }
            : ticketType,
        ),
      )
      setGuestTicketForm(initialGuestTicketForm)
      setGuestTicketSuccessMessage(
        response.message ?? 'Invitation créée et envoyée par email.',
      )
      revealTicketSection()
    } catch (error) {
      setGuestTicketErrorMessage(
        extractErrorMessage(error, 'Impossible de créer l’invitation pour le moment.'),
      )
      revealTicketSection()
    } finally {
      setIsSendingGuestTicket(false)
    }
  }

  async function copyGuestTicketLink(url: string | null) {
    if (!url) {
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setGuestTicketSuccessMessage('Lien du billet invité copié.')
    } catch {
      setGuestTicketErrorMessage('Impossible de copier le lien automatiquement.')
    }
  }

  if (isLoading) {
    return (
      <OrganizerEventDetailSection>
        <OrganizerEventDetailShell>
          <OrganizerEventDetailState>
            Chargement de la fiche organisateur de l’évènement...
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
            Revenir à mes évènements
          </OrganizerEventDetailBackButton>
          <OrganizerEventDetailError>{eventErrorMessage}</OrganizerEventDetailError>
        </OrganizerEventDetailShell>
      </OrganizerEventDetailSection>
    )
  }

  if (!event) {
    return (
      <OrganizerEventDetailSection>
        <OrganizerEventDetailShell>
          <OrganizerEventDetailState>
            La fiche organisateur de l’évènement n’est pas disponible.
          </OrganizerEventDetailState>
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
          Revenir à mes évènements
        </OrganizerEventDetailBackButton>

        <OrganizerEventHero event={event} currentUser={currentUser} />

        <OrganizerEventDetailTabs aria-label="Sections de la fiche évènement">
          {organizerEventDetailTabs.map((tab) => (
            <OrganizerEventDetailTabButton
              key={tab.id}
              type="button"
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </OrganizerEventDetailTabButton>
          ))}
        </OrganizerEventDetailTabs>

        {activeTab === 'overview' ? (
          <OrganizerEventOverviewSection
            eventSales={eventSales}
            eventScans={eventScans}
            staffScanParticipants={staffScanParticipants}
            ticketTypeCount={ticketTypes.length}
            totalAvailableTickets={totalAvailableTickets}
          />
        ) : null}

        {activeTab === 'event' ? (
        <OrganizerEventDetailSplitSection>
          <OrganizerEventDetailSplitHeader>
            <OrganizerEventDetailSplitEyebrow>évènement</OrganizerEventDetailSplitEyebrow>
            <OrganizerEventDetailSplitTitle>Fiche évènement</OrganizerEventDetailSplitTitle>
            <OrganizerEventDetailSplitText>
              Mets à jour ici la fiche publique complété de ton évènement : contenu, lieu, dates, medias et statut.
            </OrganizerEventDetailSplitText>
          </OrganizerEventDetailSplitHeader>

          {eventErrorMessage ? (
            <OrganizerEventDetailError>{eventErrorMessage}</OrganizerEventDetailError>
          ) : null}
          {eventSuccessMessage ? (
            <OrganizerEventDetailSuccess>{eventSuccessMessage}</OrganizerEventDetailSuccess>
          ) : null}
          {isAdminReadOnly ? (
            <OrganizerEventDetailState>
              {ADMIN_ORGANIZER_READ_ONLY_MESSAGE}
            </OrganizerEventDetailState>
          ) : null}

          <OrganizerEventDetailForm onSubmit={handleEventSubmit}>
            <fieldset
              disabled={!canEditOrganizerEvent}
              style={{ border: 0, display: 'contents', margin: 0, padding: 0 }}
            >
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
                <OrganizerEventDetailLabel>Capacité</OrganizerEventDetailLabel>
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
                  La capacité ne peut pas descendre sous le stock déjà alloué aux billets.
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
              <OrganizerEventDetailLabel>Catégorie</OrganizerEventDetailLabel>
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
                <option value="">Choisir une catégorie</option>
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
                  Choisis la catégorie qui correspond le mieux au tri public de cet évènement.
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
                  placeholder="10 Rue de l’Exemple"
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
                  Facultatif. Utile si tu veux positionner précisément le lieu.
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
                  Facultatif. Laisse vide si tu n’as pas encore les coordonnées.
                </OrganizerEventDetailHint>
              </OrganizerEventDetailField>
            </OrganizerEventDetailGrid>

            <OrganizerEventDetailGrid>
              <OrganizerEventDetailField>
                <OrganizerEventDetailLabel>Début</OrganizerEventDetailLabel>
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
                  Si ton évènement est déjà passé, tu peux garder sa date actuelle pour modifier le reste de la fiche.
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
                  La fin doit toujours rester après le début.
                </OrganizerEventDetailHint>
              </OrganizerEventDetailField>
            </OrganizerEventDetailGrid>

            <OrganizerEventDetailMediaGrid>
              <OrganizerEventDetailMediaCard>
                <OrganizerEventDetailMediaLabel>Miniature actuelle</OrganizerEventDetailMediaLabel>
                <OrganizerEventDetailMediaPreview
                  $imageUrl={resolveMediaUrl(event.thumbnailPhoto ?? null)}
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
                  $imageUrl={resolveMediaUrl(event.coverPhoto ?? null)}
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

              {eventIsFinished ? (
                <OrganizerEventDetailMediaCard>
                  <OrganizerEventDetailMediaLabel>Vidéo souvenir</OrganizerEventDetailMediaLabel>
                  {event.eventVideo ? (
                    <OrganizerEventDetailVideoPreview
                      controls
                      preload="metadata"
                      src={resolveMediaUrl(event.eventVideo)}
                    />
                  ) : (
                    <OrganizerEventDetailState>
                      Aucune vidéo souvenir n’est encore liée à cet évènement.
                    </OrganizerEventDetailState>
                  )}
                  <OrganizerEventDetailField>
                    <OrganizerEventDetailLabel>Ajouter ou remplacer la vidéo</OrganizerEventDetailLabel>
                    <OrganizerEventDetailInput
                      type="file"
                      accept="video/*"
                      onChange={(changeEvent) =>
                        setEventForm((current) => ({
                          ...current,
                          eventVideo: changeEvent.target.files?.[0] ?? null,
                        }))
                      }
                    />
                  </OrganizerEventDetailField>
                  <OrganizerEventDetailHint>
                    Visible par les clients depuis la corbeille publique des évènements passés.
                  </OrganizerEventDetailHint>
                </OrganizerEventDetailMediaCard>
              ) : (
                <OrganizerEventDetailMediaCard>
                  <OrganizerEventDetailMediaLabel>Vidéo souvenir</OrganizerEventDetailMediaLabel>
                  <OrganizerEventDetailState>
                    Tu pourras ajouter une vidéo locale quand l’évènement sera terminé.
                  </OrganizerEventDetailState>
                </OrganizerEventDetailMediaCard>
              )}
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
                {isSavingEvent ? 'Mise à jour en cours...' : 'Mettre à jour la fiche'}
              </OrganizerEventDetailPrimaryButton>
              {event.status === 'published' ? (
                <OrganizerEventDetailSecondaryButton
                  type="button"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  Voir la fiche publique
                </OrganizerEventDetailSecondaryButton>
              ) : null}
            </OrganizerEventDetailActions>
            </fieldset>
          </OrganizerEventDetailForm>
        </OrganizerEventDetailSplitSection>
        ) : null}

        {activeTab === 'booster' && event ? (
          <OrganizerEventBoosterSection event={event} isAdminReadOnly={isAdminReadOnly} />
        ) : null}

        {activeTab === 'scan' ? (
          <OrganizerEventScanSection scanStats={scanStats} />
        ) : null}

        {activeTab === 'tickets' ? (
        <OrganizerEventDetailSplitSection ref={ticketSectionRef}>
          <OrganizerEventDetailSplitHeader>
            <OrganizerEventDetailSplitEyebrow>Billets</OrganizerEventDetailSplitEyebrow>
            <OrganizerEventDetailSplitTitle>Billets de cet évènement</OrganizerEventDetailSplitTitle>
            <OrganizerEventDetailSplitText>
              Gère ici la billetterie liée à cet évènement, avec son stock, ses dates de vente et sa visibilite.
            </OrganizerEventDetailSplitText>
          </OrganizerEventDetailSplitHeader>

          {ticketErrorMessage ? (
            <OrganizerEventDetailError>{ticketErrorMessage}</OrganizerEventDetailError>
          ) : null}
          {ticketSectionMessage ? (
            <OrganizerEventDetailSuccess>{ticketSectionMessage}</OrganizerEventDetailSuccess>
          ) : null}
          {isAdminReadOnly ? (
            <OrganizerEventDetailState>
              {ADMIN_ORGANIZER_READ_ONLY_MESSAGE}
            </OrganizerEventDetailState>
          ) : null}

          <OrganizerEventDetailTicketSection>
          <OrganizerEventDetailTicketHeader>
            <div>
              <OrganizerEventDetailTicketTitle>Gestion des billets</OrganizerEventDetailTicketTitle>
              <OrganizerEventDetailTicketText>
                Chaque billet est lié à cet évènement. Son stock total s’aligne sur la capacité de la fiche et ses dates de vente restent bornées par le calendrier de l’évènement.
              </OrganizerEventDetailTicketText>
            </div>
          </OrganizerEventDetailTicketHeader>

          <OrganizerEventDetailTicketGrid>
            <OrganizerEventDetailTicketCreateCard style={{ display: canEditOrganizerEvent ? undefined : 'none' }}>
              <OrganizerEventDetailInfoTitle>Créer un billet</OrganizerEventDetailInfoTitle>
              <OrganizerEventDetailInfoText>
                Definis un type de billet, son prix, son stock et sa fenêtre de vente.
              </OrganizerEventDetailInfoText>
              <OrganizerEventDetailHint>
                Il reste actuellement {remainingTicketCapacity} place(s) à attribuer
                sur {eventCapacity} pour cet évènement.
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
                    placeholder="Accès général, placement libre..."
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
                      Tu peux encore attribuer jusqu’à {remainingTicketCapacity} place(s)
                      a un nouveau billet, dans la limit des {eventCapacity} places de
                      l’évènement.
                    </OrganizerEventDetailHint>
                  </OrganizerEventDetailField>
                </OrganizerEventDetailGrid>

                <OrganizerEventDetailGrid>
                  <OrganizerEventDetailField>
                    <OrganizerEventDetailLabel>Début de vente</OrganizerEventDetailLabel>
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
                      La vente doit se terminer avant le début de l’évènement.
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
                    <OrganizerEventDetailLabel>Visibilité du billet</OrganizerEventDetailLabel>
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
                    {isSavingTicket ? 'Création en cours...' : 'Créer le billet'}
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
                      Max par commande: {ticketType.maxPerOrder ?? 'Non limité'}
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
                              Pour ce billet, tu peux monter jusqu’à{' '}
                              {editableRemainingCapacityForCurrentTicket} place(s)
                              sans dépasser la capacité globale de l’évènement.
                            </OrganizerEventDetailHint>
                          </OrganizerEventDetailField>
                        </OrganizerEventDetailGrid>
                        <OrganizerEventDetailGrid>
                          <OrganizerEventDetailField>
                            <OrganizerEventDetailLabel>Début de vente</OrganizerEventDetailLabel>
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
                            <OrganizerEventDetailLabel>Visibilité du billet</OrganizerEventDetailLabel>
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
                            {isSavingTicket ? 'Mise à jour...' : 'Enregistrer le billet'}
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
                      <OrganizerEventDetailTicketCardActions style={{ display: canEditOrganizerEvent ? undefined : 'none' }}>
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
                  Aucun billet n’est encore rattaché à cet évènement. Crée le premier type de billet à gauche pour lancer la billetterie.
                </OrganizerEventDetailState>
              )}
            </OrganizerEventDetailTicketList>
          </OrganizerEventDetailTicketGrid>

          <OrganizerEventDetailGuestSection>
            <OrganizerEventDetailTicketHeader>
              <div>
                <OrganizerEventDetailTicketTitle>
                  Invitations nominatives
                </OrganizerEventDetailTicketTitle>
                <OrganizerEventDetailTicketText>
                  Crée un billet gratuit pour un invité, envoie-le par email et
                  suis ensuite s’il est passé au scan.
                </OrganizerEventDetailTicketText>
              </div>
              <OrganizerEventDetailGuestBadge $checkedIn={false}>
                {guestTicketsCheckedIn}/{guestTickets.length} venu(s)
              </OrganizerEventDetailGuestBadge>
            </OrganizerEventDetailTicketHeader>

            {guestTicketErrorMessage ? (
              <OrganizerEventDetailError>{guestTicketErrorMessage}</OrganizerEventDetailError>
            ) : null}
            {guestTicketSuccessMessage ? (
              <OrganizerEventDetailSuccess>{guestTicketSuccessMessage}</OrganizerEventDetailSuccess>
            ) : null}

            <OrganizerEventDetailGuestGrid>
              <OrganizerEventDetailTicketCreateCard style={{ display: canEditOrganizerEvent ? undefined : 'none' }}>
                <OrganizerEventDetailInfoTitle>Envoyer un billet invité</OrganizerEventDetailInfoTitle>
                <OrganizerEventDetailInfoText>
                  Le billet consomme une place disponible du type choisi et reste
                  scannable comme un billet classique.
                </OrganizerEventDetailInfoText>

                <OrganizerEventDetailForm onSubmit={handleGuestTicketCreate}>
                  <OrganizerEventDetailField>
                    <OrganizerEventDetailLabel>Nom de l’invité</OrganizerEventDetailLabel>
                    <OrganizerEventDetailInput
                      value={guestTicketForm.recipientName}
                      onChange={(changeEvent) =>
                        setGuestTicketForm((current) => ({
                          ...current,
                          recipientName: changeEvent.target.value,
                        }))
                      }
                      placeholder="Nina Scene"
                    />
                  </OrganizerEventDetailField>

                  <OrganizerEventDetailField>
                    <OrganizerEventDetailLabel>Email de l’invité</OrganizerEventDetailLabel>
                    <OrganizerEventDetailInput
                      type="email"
                      value={guestTicketForm.recipientEmail}
                      onChange={(changeEvent) =>
                        setGuestTicketForm((current) => ({
                          ...current,
                          recipientEmail: changeEvent.target.value,
                        }))
                      }
                      placeholder="invité@example.com"
                      required
                    />
                  </OrganizerEventDetailField>

                  <OrganizerEventDetailField>
                    <OrganizerEventDetailLabel>Billet à envoyer</OrganizerEventDetailLabel>
                    <OrganizerEventDetailSelect
                      value={guestTicketForm.ticketTypeId}
                      onChange={(changeEvent) =>
                        setGuestTicketForm((current) => ({
                          ...current,
                          ticketTypeId: changeEvent.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Choisir un billet disponible</option>
                      {availableInvitationTicketTypes.map((ticketType) => (
                        <option key={ticketType.id} value={String(ticketType.id)}>
                          {ticketType.name} - {ticketType.availableStock} dispo
                        </option>
                      ))}
                    </OrganizerEventDetailSelect>
                    <OrganizerEventDetailHint>
                      {availableInvitationTicketTypes.length > 0
                        ? `${totalAvailableTickets} place(s) encore disponible(s) sur les billets actifs.`
                        : 'Aucun billet actif avec du stock disponible pour créer une invitation.'}
                    </OrganizerEventDetailHint>
                  </OrganizerEventDetailField>

                  <OrganizerEventDetailActions>
                    <OrganizerEventDetailPrimaryButton
                      type="submit"
                      disabled={
                        isSendingGuestTicket ||
                        availableInvitationTicketTypes.length === 0
                      }
                    >
                      {isSendingGuestTicket
                        ? 'Envoi en cours...'
                        : 'Créer et envoyer'}
                    </OrganizerEventDetailPrimaryButton>
                  </OrganizerEventDetailActions>
                </OrganizerEventDetailForm>
              </OrganizerEventDetailTicketCreateCard>

              <OrganizerEventDetailGuestList>
                {guestTickets.length > 0 ? (
                  guestTickets.map((guestTicket) => (
                    <OrganizerEventDetailGuestCard key={guestTicket.id}>
                      <OrganizerEventDetailGuestMeta>
                        <OrganizerEventDetailGuestName>
                          {guestTicket.recipientName ?? 'Invité EventFlow'}
                        </OrganizerEventDetailGuestName>
                        <OrganizerEventDetailGuestText>
                          {guestTicket.recipientEmail ?? 'Email indisponible'}
                        </OrganizerEventDetailGuestText>
                        <OrganizerEventDetailGuestText>
                          {guestTicket.ticketType.name ?? 'Billet'} -{' '}
                          {guestTicket.displayCode}
                        </OrganizerEventDetailGuestText>
                        <OrganizerEventDetailGuestText>
                          Envoyé : {formatOrganizerDate(guestTicket.sentAt)}
                        </OrganizerEventDetailGuestText>
                        <OrganizerEventDetailGuestText>
                          Passage scan:{' '}
                          {guestTicket.usedAt
                            ? formatOrganizerDate(guestTicket.usedAt)
                            : 'pas encore scanné'}
                        </OrganizerEventDetailGuestText>
                      </OrganizerEventDetailGuestMeta>

                      <OrganizerEventDetailActions>
                        <OrganizerEventDetailGuestBadge
                          $checkedIn={guestTicket.hasCheckedIn}
                        >
                          {guestTicket.hasCheckedIn ? 'Venu' : 'Non scanné'}
                        </OrganizerEventDetailGuestBadge>
                        <OrganizerEventDetailLinkButton
                          type="button"
                          onClick={() => void copyGuestTicketLink(guestTicket.guestTicketUrl)}
                        >
                          Copier le lien
                        </OrganizerEventDetailLinkButton>
                      </OrganizerEventDetailActions>
                    </OrganizerEventDetailGuestCard>
                  ))
                ) : (
                  <OrganizerEventDetailState>
                    Aucun billet invité pour le moment. Crée une invitation pour
                    envoyer un QR par email et suivre son passage au scan.
                  </OrganizerEventDetailState>
                )}
              </OrganizerEventDetailGuestList>
            </OrganizerEventDetailGuestGrid>
          </OrganizerEventDetailGuestSection>
          </OrganizerEventDetailTicketSection>
        </OrganizerEventDetailSplitSection>
        ) : null}
      </OrganizerEventDetailShell>
    </OrganizerEventDetailSection>
  )
}
