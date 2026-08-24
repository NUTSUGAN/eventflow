import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  createStripeCheckoutSession,
  getOrder,
} from '../../api/orders'
import type { PreparedOrder } from '../../types/order'
import {
  OrderPreparationActions,
  OrderPreparationCard,
  OrderPreparationCardTitle,
  OrderPreparationCheckoutButton,
  OrderPreparationError,
  OrderPreparationEyebrow,
  OrderPreparationHero,
  OrderPreparationHint,
  OrderPreparationList,
  OrderPreparationListRow,
  OrderPreparationLabel,
  OrderPreparationPrimaryButton,
  OrderPreparationSection,
  OrderPreparationSecondaryButton,
  OrderPreparationState,
  OrderPreparationSuccess,
  OrderPreparationText,
  OrderPreparationTitle,
  OrderPreparationValue,
} from '../OrderPreparationPage/orderPreparationPageElements'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatOrderStatusLabel(status: string): string {
  switch (status) {
    case 'pending_payment':
      return 'En attente de paiement'
    case 'paid':
      return 'Payée'
    case 'cancelled':
      return 'Annulée'
    case 'expired':
      return 'Expiree'
    default:
      return status
  }
}

function formatPaymentLabel(order: PreparedOrder): string {
  if (order.payment?.provider === 'free') {
    return 'Gratuit - confirmé'
  }

  if (order.payment?.provider && order.payment?.status) {
    return `${order.payment.provider} - ${order.payment.status}`
  }

  return order.payment?.status ?? 'inconnu'
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
  ) {
    return String(
      (error as { response?: { data?: { message?: unknown } } }).response?.data?.message,
    )
  }

  return fallback
}

export function OrderCheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState<PreparedOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLaunchingStripe, setIsLaunchingStripe] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const orderId = useMemo(() => {
    const rawOrderId = searchParams.get('orderId')

    if (!rawOrderId) {
      return null
    }

    const parsed = Number.parseInt(rawOrderId, 10)

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }, [searchParams])

  const isSuccessReturn = location.pathname === '/checkout/success'
  const isCancelReturn = location.pathname === '/checkout/cancel'

  useEffect(() => {
    let isMounted = true
    let pollTimeoutId: number | null = null

    async function loadOrderOnce(showFallback = true) {
      if (!orderId) {
        if (isMounted && showFallback) {
          setErrorMessage('Impossible de retrouver la commande À payer.')
          setIsLoading(false)
        }

        return null
      }

      try {
        const response = await getOrder(orderId)

        if (!isMounted) {
          return response.order
        }

        setOrder(response.order)
        setErrorMessage(null)

        return response.order
      } catch (error) {
        if (isMounted && showFallback) {
          setErrorMessage(extractApiErrorMessage(error, 'Impossible de charger cette commande.'))
        }

        return null
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    async function loadWithPolling(attempt = 0) {
      const loadedOrder = await loadOrderOnce(false)

      if (!isMounted) {
        return
      }

      if (!loadedOrder) {
        setErrorMessage('Impossible de vérifier cette commande après le paiement.')
        setIsLoading(false)

        return
      }

      if ('paid' === loadedOrder.status || attempt >= 6) {
        setIsLoading(false)
        return
      }

      pollTimeoutId = window.setTimeout(() => {
        void loadWithPolling(attempt + 1)
      }, 1500)
    }

    if (isSuccessReturn) {
      void loadWithPolling()
    } else {
      void loadOrderOnce()
    }

    return () => {
      isMounted = false

      if (null !== pollTimeoutId) {
        window.clearTimeout(pollTimeoutId)
      }
    }
  }, [isSuccessReturn, orderId])

  async function handleStartStripeCheckout() {
    if (!order || !orderId || isLaunchingStripe || !order.canStartCheckout) {
      return
    }

    setIsLaunchingStripe(true)
    setErrorMessage(null)

    try {
      const response = await createStripeCheckoutSession(orderId)
      window.location.assign(response.checkoutUrl)
    } catch (error) {
      setErrorMessage(
        extractApiErrorMessage(
          error,
          'Impossible de lancer la session de paiement Stripe pour le moment.',
        ),
      )
      setIsLaunchingStripe(false)
    }
  }

  if (!orderId) {
    return (
      <OrderPreparationSection>
        <OrderPreparationHero>
          <OrderPreparationEyebrow>Paiement</OrderPreparationEyebrow>
          <OrderPreparationTitle>Commande introuvable</OrderPreparationTitle>
          <OrderPreparationError>
            Impossible de retrouver la commande À payer pour le moment.
          </OrderPreparationError>
          <OrderPreparationActions>
            <OrderPreparationSecondaryButton
              type="button"
              onClick={() => navigate('/explorer')}
            >
              Retour à Explorer
            </OrderPreparationSecondaryButton>
          </OrderPreparationActions>
        </OrderPreparationHero>
      </OrderPreparationSection>
    )
  }

  if (isLoading) {
    return (
      <OrderPreparationSection>
        <OrderPreparationHero>
          <OrderPreparationEyebrow>Paiement</OrderPreparationEyebrow>
          <OrderPreparationTitle>
            {isSuccessReturn ? 'Confirmation du paiement...' : 'Chargement de la commande...'}
          </OrderPreparationTitle>
          <OrderPreparationState>
            {isSuccessReturn
              ? 'On’attend la confirmation finale de Stripe pour mettre à jour la commande.'
              : 'On recharge ta commande avant de lancer le paiement.'}
          </OrderPreparationState>
        </OrderPreparationHero>
      </OrderPreparationSection>
    )
  }

  if (!order) {
    return (
      <OrderPreparationSection>
        <OrderPreparationHero>
          <OrderPreparationEyebrow>Paiement</OrderPreparationEyebrow>
          <OrderPreparationTitle>Commande indisponible</OrderPreparationTitle>
          <OrderPreparationError>
            {errorMessage ?? 'Impossible de charger cette commande pour le moment.'}
          </OrderPreparationError>
          <OrderPreparationActions>
            <OrderPreparationSecondaryButton
              type="button"
              onClick={() => navigate('/explorer')}
            >
              Retour à Explorer
            </OrderPreparationSecondaryButton>
          </OrderPreparationActions>
        </OrderPreparationHero>
      </OrderPreparationSection>
    )
  }

  const paymentAlreadyCompleted = order.status === 'paid'
  const isFreeOrder = order.payment?.provider === 'free' || order.total <= 0
  const checkoutTitle = paymentAlreadyCompleted
    ? isFreeOrder
      ? 'Réservation confirmée'
      : 'Paiement confirmé'
    : isSuccessReturn
      ? 'Confirmation en cours'
      : isCancelReturn
        ? 'Paiement interrompu'
        : 'Finaliser le paiement'
  const checkoutIntro = paymentAlreadyCompleted
    ? isFreeOrder
      ? `La commande gratuite ${order.reference} est confirmée. Ta place est réservée.`
      : `Le paiement Stripe de la commande ${order.reference} a bien été confirmé.`
    : isSuccessReturn
      ? `Stripe a bien renvoyé le navigateur, mais la commande ${order.reference} attend encore sa confirmation finale.`
      : isCancelReturn
        ? `Tu peux relancer le paiement Stripe pour la commande ${order.reference} quand tu veux.`
        : `La commande ${order.reference} est prête. On peut maintenant la rediriger vers Stripe pour payer les billets.`

  return (
    <OrderPreparationSection>
      <OrderPreparationHero>
        <OrderPreparationEyebrow>Paiement</OrderPreparationEyebrow>
        <OrderPreparationTitle>{checkoutTitle}</OrderPreparationTitle>
        <OrderPreparationText>{checkoutIntro}</OrderPreparationText>

        {errorMessage ? <OrderPreparationError>{errorMessage}</OrderPreparationError> : null}

        {paymentAlreadyCompleted ? (
          <OrderPreparationSuccess>
            {isFreeOrder
              ? 'Billet confirmé. Aucun paiement Stripe n’est nécessaire.'
              : 'Paiement reçu. Le statut de la commande est maintenant à jour.'}
          </OrderPreparationSuccess>
        ) : null}

        {isCancelReturn ? (
          <OrderPreparationHint>
            Aucun billet nest confirmé tant que Stripe na pas valide le paiement.
          </OrderPreparationHint>
        ) : null}

        {!paymentAlreadyCompleted && !isSuccessReturn && !isCancelReturn ? (
          <OrderPreparationSuccess>
            Le stock reste non deduit tant que Stripe na pas confirmé le paiement.
          </OrderPreparationSuccess>
        ) : null}

        <OrderPreparationCard>
          <OrderPreparationCardTitle>Recapitulatif de commande</OrderPreparationCardTitle>
          <OrderPreparationList>
            <OrderPreparationListRow>
              <OrderPreparationLabel>Commande</OrderPreparationLabel>
              <OrderPreparationValue>#{order.id}</OrderPreparationValue>
            </OrderPreparationListRow>
            <OrderPreparationListRow>
              <OrderPreparationLabel>Référence</OrderPreparationLabel>
              <OrderPreparationValue>{order.reference}</OrderPreparationValue>
            </OrderPreparationListRow>
            <OrderPreparationListRow>
              <OrderPreparationLabel>évènement</OrderPreparationLabel>
              <OrderPreparationValue>{order.event.title ?? 'À confirmer'}</OrderPreparationValue>
            </OrderPreparationListRow>
            <OrderPreparationListRow>
              <OrderPreparationLabel>Statut</OrderPreparationLabel>
              <OrderPreparationValue>{formatOrderStatusLabel(order.status)}</OrderPreparationValue>
            </OrderPreparationListRow>
            <OrderPreparationListRow>
              <OrderPreparationLabel>Total</OrderPreparationLabel>
              <OrderPreparationValue>{formatCurrency(order.total)}</OrderPreparationValue>
            </OrderPreparationListRow>
            {order.payment ? (
              <OrderPreparationListRow>
                <OrderPreparationLabel>Paiement</OrderPreparationLabel>
                <OrderPreparationValue>{formatPaymentLabel(order)}</OrderPreparationValue>
              </OrderPreparationListRow>
            ) : null}
          </OrderPreparationList>

          {isSuccessReturn && !paymentAlreadyCompleted ? (
            <OrderPreparationState>
              Stripe a redirige le navigateur. Si la confirmation tarde, recharge simplement
              cette page dans quelques secondes.
            </OrderPreparationState>
          ) : null}

          {paymentAlreadyCompleted ? (
            <OrderPreparationHint>
              {isFreeOrder
                ? 'Tu peux maintenant retrouver ton billet et son QR code.'
                : 'Tu peux maintenant revenir à l’évènement ou poursuivre ailleurs dans EventFlow.'}
            </OrderPreparationHint>
          ) : order.canStartCheckout ? (
            <OrderPreparationHint>
              Le paiement est géré sur la page Stripe hebergee, puis on revient ici pour la confirmation.
            </OrderPreparationHint>
          ) : (
            <OrderPreparationState>
              Cette commande ne peut plus lancer une nouvelle session de paiement.
            </OrderPreparationState>
          )}

          <OrderPreparationActions>
            {paymentAlreadyCompleted ? (
              <>
                <OrderPreparationPrimaryButton
                  type="button"
                  onClick={() => navigate('/mes-billets')}
                >
                  Voir mes billets
                </OrderPreparationPrimaryButton>
                <OrderPreparationSecondaryButton
                  type="button"
                  onClick={() =>
                    order.event.id
                      ? navigate(`/events/${order.event.id}`)
                      : navigate('/explorer')
                  }
                >
                  Retour à l’évènement
                </OrderPreparationSecondaryButton>
              </>
            ) : (
              <OrderPreparationCheckoutButton
                type="button"
                onClick={handleStartStripeCheckout}
                disabled={isLaunchingStripe || !order.canStartCheckout}
              >
                {isLaunchingStripe ? 'Redirection vers Stripe...' : 'Payer avec Stripe'}
              </OrderPreparationCheckoutButton>
            )}

            {!paymentAlreadyCompleted ? (
              <OrderPreparationSecondaryButton
                type="button"
                onClick={() => navigate(-1)}
              >
                Retour
              </OrderPreparationSecondaryButton>
            ) : null}
          </OrderPreparationActions>
        </OrderPreparationCard>
      </OrderPreparationHero>
    </OrderPreparationSection>
  )
}
