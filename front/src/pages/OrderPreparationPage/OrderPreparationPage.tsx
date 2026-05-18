import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCurrentUser } from '../../api/auth'
import { getPublicEventById } from '../../api/events'
import { prepareOrder } from '../../api/orders'
import type { EventDetail, EventTicketType } from '../../types/event'
import type { PreparedOrder } from '../../types/order'
import {
  OrderPreparationActions,
  OrderPreparationCard,
  OrderPreparationCardTitle,
  OrderPreparationCheckoutButton,
  OrderPreparationError,
  OrderPreparationEyebrow,
  OrderPreparationField,
  OrderPreparationFieldLabel,
  OrderPreparationGrid,
  OrderPreparationHero,
  OrderPreparationHint,
  OrderPreparationInput,
  OrderPreparationLabel,
  OrderPreparationList,
  OrderPreparationListRow,
  OrderPreparationPrimaryButton,
  OrderPreparationSecondaryButton,
  OrderPreparationSection,
  OrderPreparationState,
  OrderPreparationSuccess,
  OrderPreparationText,
  OrderPreparationTitle,
  OrderPreparationValue,
} from './orderPreparationPageElements'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'Date a confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatOrderStatusLabel(status: string): string {
  switch (status) {
    case 'pending_payment':
      return 'En attente de paiement'
    case 'paid':
      return 'Payee'
    case 'cancelled':
      return 'Annulee'
    case 'expired':
      return 'Expirée'
    default:
      return status
  }
}

function resolveAvailableStock(ticketType: EventTicketType | null): number {
  if (!ticketType) {
    return 0
  }

  if (
    ticketType.availableStock !== null &&
    ticketType.availableStock !== undefined
  ) {
    return ticketType.availableStock
  }

  return ticketType.stock ?? 0
}

export function OrderPreparationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [preparedOrder, setPreparedOrder] = useState<PreparedOrder | null>(null)

  const eventId = searchParams.get('eventId')
  const ticketTypeId = Number(searchParams.get('ticketTypeId'))

  useEffect(() => {
    let isMounted = true

    async function loadPreparation() {
      if (!eventId || !Number.isFinite(ticketTypeId) || ticketTypeId <= 0) {
        if (isMounted) {
          setErrorMessage('Impossible de retrouver le billet a preparer.')
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        await getCurrentUser()
      } catch {
        if (isMounted) {
          navigate('/auth?mode=login', { replace: true })
        }
        return
      }

      try {
        const eventDetail = await getPublicEventById(eventId)

        if (isMounted) {
          setEvent(eventDetail)
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Impossible de charger l'evenement pour cette commande.")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPreparation()

    return () => {
      isMounted = false
    }
  }, [eventId, navigate, ticketTypeId])

  const selectedTicketType = useMemo<EventTicketType | null>(() => {
    if (!event) {
      return null
    }

    return event.ticketTypes.find((ticket) => ticket.id === ticketTypeId) ?? null
  }, [event, ticketTypeId])

  const maxAllowedQuantity = useMemo(() => {
    if (!selectedTicketType) {
      return 0
    }

    const availableStock = resolveAvailableStock(selectedTicketType)

    if (
      selectedTicketType.maxPerOrder !== null &&
      selectedTicketType.maxPerOrder !== undefined
    ) {
      return Math.max(
        0,
        Math.min(selectedTicketType.maxPerOrder, availableStock),
      )
    }

    return Math.max(0, availableStock)
  }, [selectedTicketType])

  const hasAvailableStock = maxAllowedQuantity > 0

  const effectiveQuantity = useMemo(
    () =>
      maxAllowedQuantity === 0
        ? 0
        : Math.max(1, Math.min(quantity, maxAllowedQuantity)),
    [maxAllowedQuantity, quantity],
  )

  const previewTotal = useMemo(() => {
    if (selectedTicketType?.basePrice === null || !selectedTicketType) {
      return null
    }

    return selectedTicketType.basePrice * effectiveQuantity
  }, [effectiveQuantity, selectedTicketType])

  async function handlePrepareOrder() {
    if (!selectedTicketType || isSubmitting || !hasAvailableStock) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await prepareOrder({
            items: [
              {
                ticketTypeId: selectedTicketType.id,
                quantity: effectiveQuantity,
              },
            ],
          })

      setPreparedOrder(response.order)
      setSuccessMessage(response.message)
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
      ) {
        setErrorMessage(
          String(
            (error as { response?: { data?: { message?: unknown } } }).response?.data?.message,
          ),
        )
      } else {
        setErrorMessage('Impossible de preparer la commande pour le moment.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleContinueToPayment() {
    if (!preparedOrder || !event) {
      return
    }

    const checkoutUrl = new URL('/checkout', window.location.origin)
    checkoutUrl.searchParams.set('orderId', String(preparedOrder.id))
    checkoutUrl.searchParams.set('reference', preparedOrder.reference)
    checkoutUrl.searchParams.set('total', String(preparedOrder.total))
    checkoutUrl.searchParams.set('eventTitle', preparedOrder.event.title ?? event.title)

    navigate(`${checkoutUrl.pathname}${checkoutUrl.search}`)
  }

  if (isLoading) {
    return (
      <OrderPreparationSection>
        <OrderPreparationHero>
          <OrderPreparationEyebrow>Commande</OrderPreparationEyebrow>
          <OrderPreparationTitle>Preparation de la commande...</OrderPreparationTitle>
          <OrderPreparationState>
            On verifie ta session et le billet selectionne.
          </OrderPreparationState>
        </OrderPreparationHero>
      </OrderPreparationSection>
    )
  }

  if (!event || !selectedTicketType) {
    return (
      <OrderPreparationSection>
        <OrderPreparationHero>
          <OrderPreparationEyebrow>Commande</OrderPreparationEyebrow>
          <OrderPreparationTitle>Billet introuvable</OrderPreparationTitle>
          <OrderPreparationError>
            {errorMessage ?? "Le billet demande n'est pas disponible."}
          </OrderPreparationError>
          <OrderPreparationActions>
            <OrderPreparationSecondaryButton
              type="button"
              onClick={() => navigate('/explorer')}
            >
              Retour a Explorer
            </OrderPreparationSecondaryButton>
          </OrderPreparationActions>
        </OrderPreparationHero>
      </OrderPreparationSection>
    )
  }

  return (
    <OrderPreparationSection>
      <OrderPreparationHero>
        <OrderPreparationEyebrow>Commande</OrderPreparationEyebrow>
        <OrderPreparationTitle>Preparation de commande</OrderPreparationTitle>
        <OrderPreparationText>
          On prepare ici la commande avant paiement pour <strong>{event.title}</strong>.
        </OrderPreparationText>

        {errorMessage ? <OrderPreparationError>{errorMessage}</OrderPreparationError> : null}
        {successMessage ? (
          <OrderPreparationSuccess>{successMessage}</OrderPreparationSuccess>
        ) : null}

        <OrderPreparationGrid>
          <OrderPreparationCard>
            <OrderPreparationCardTitle>Billet selectionne</OrderPreparationCardTitle>
            <OrderPreparationList>
              <OrderPreparationListRow>
                <OrderPreparationLabel>Nom</OrderPreparationLabel>
                <OrderPreparationValue>{selectedTicketType.name}</OrderPreparationValue>
              </OrderPreparationListRow>
              <OrderPreparationListRow>
                <OrderPreparationLabel>Evenement</OrderPreparationLabel>
                <OrderPreparationValue>{event.title}</OrderPreparationValue>
              </OrderPreparationListRow>
              <OrderPreparationListRow>
                <OrderPreparationLabel>Date</OrderPreparationLabel>
                <OrderPreparationValue>{formatDateTime(event.startsAt)}</OrderPreparationValue>
              </OrderPreparationListRow>
              <OrderPreparationListRow>
                <OrderPreparationLabel>Prix unitaire</OrderPreparationLabel>
                <OrderPreparationValue>
                  {formatCurrency(selectedTicketType.basePrice ?? 0)}
                </OrderPreparationValue>
              </OrderPreparationListRow>
              <OrderPreparationListRow>
                <OrderPreparationLabel>Stock restant</OrderPreparationLabel>
                <OrderPreparationValue>
                  {resolveAvailableStock(selectedTicketType)}
                </OrderPreparationValue>
              </OrderPreparationListRow>
            </OrderPreparationList>

            <OrderPreparationField>
              <OrderPreparationFieldLabel>Quantite</OrderPreparationFieldLabel>
              <OrderPreparationInput
                type="number"
                min={hasAvailableStock ? '1' : '0'}
                max={maxAllowedQuantity > 0 ? maxAllowedQuantity : undefined}
                value={hasAvailableStock ? effectiveQuantity : 0}
                disabled={!hasAvailableStock}
                onChange={(event) =>
                  setQuantity(Math.max(1, Number.parseInt(event.target.value || '1', 10)))
                }
              />
              <OrderPreparationHint>
                {!hasAvailableStock
                  ? 'Ce billet est complet pour le moment.'
                  : selectedTicketType.maxPerOrder
                  ? `Maximum ${selectedTicketType.maxPerOrder} billet(s) par commande.`
                  : 'Aucune limite specifique par commande sur ce billet.'}
              </OrderPreparationHint>
            </OrderPreparationField>

            <OrderPreparationActions>
              <OrderPreparationPrimaryButton
                type="button"
                onClick={handlePrepareOrder}
                disabled={isSubmitting || !hasAvailableStock}
              >
                {isSubmitting
                  ? 'Preparation en cours...'
                  : hasAvailableStock
                    ? 'Preparer la commande'
                    : 'Billet indisponible'}
              </OrderPreparationPrimaryButton>
              <OrderPreparationSecondaryButton
                type="button"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                Retour a l evenement
              </OrderPreparationSecondaryButton>
            </OrderPreparationActions>
          </OrderPreparationCard>

          <OrderPreparationCard>
            <OrderPreparationCardTitle>Recapitulatif</OrderPreparationCardTitle>
            <OrderPreparationList>
              <OrderPreparationListRow>
                <OrderPreparationLabel>Prix unitaire</OrderPreparationLabel>
                <OrderPreparationValue>
                  {formatCurrency(selectedTicketType.basePrice ?? 0)}
                </OrderPreparationValue>
              </OrderPreparationListRow>
              <OrderPreparationListRow>
                <OrderPreparationLabel>Quantite</OrderPreparationLabel>
                <OrderPreparationValue>{effectiveQuantity}</OrderPreparationValue>
              </OrderPreparationListRow>
              <OrderPreparationListRow>
                <OrderPreparationLabel>Total estime</OrderPreparationLabel>
                <OrderPreparationValue>
                  {previewTotal !== null ? formatCurrency(previewTotal) : 'Tarif a venir'}
                </OrderPreparationValue>
              </OrderPreparationListRow>
            </OrderPreparationList>

            {preparedOrder ? (
              <>
                <OrderPreparationCardTitle>Commande creee</OrderPreparationCardTitle>
                <OrderPreparationList>
                  <OrderPreparationListRow>
                    <OrderPreparationLabel>Reference</OrderPreparationLabel>
                    <OrderPreparationValue>{preparedOrder.reference}</OrderPreparationValue>
                  </OrderPreparationListRow>
                  <OrderPreparationListRow>
                    <OrderPreparationLabel>Statut</OrderPreparationLabel>
                    <OrderPreparationValue>
                      {formatOrderStatusLabel(preparedOrder.status)}
                    </OrderPreparationValue>
                  </OrderPreparationListRow>
                  <OrderPreparationListRow>
                    <OrderPreparationLabel>Total</OrderPreparationLabel>
                    <OrderPreparationValue>
                      {formatCurrency(preparedOrder.total)}
                    </OrderPreparationValue>
                  </OrderPreparationListRow>
                </OrderPreparationList>
                <OrderPreparationHint>
                  La prochaine etape branchera le paiement sur cette commande preparee.
                </OrderPreparationHint>
                <OrderPreparationCheckoutButton
                  type="button"
                  onClick={handleContinueToPayment}
                >
                  Continuer vers le paiement
                </OrderPreparationCheckoutButton>
              </>
            ) : (
              <OrderPreparationHint>
                Le backend calculera le total final, verifiera le stock disponible et creera
                la commande avant paiement.
              </OrderPreparationHint>
            )}
          </OrderPreparationCard>
        </OrderPreparationGrid>
      </OrderPreparationHero>
    </OrderPreparationSection>
  )
}
