import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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

export function OrderCheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const orderId = searchParams.get('orderId')
  const reference = searchParams.get('reference')
  const eventTitle = searchParams.get('eventTitle')
  const totalRaw = searchParams.get('total')

  const total = useMemo(() => {
    if (!totalRaw) {
      return null
    }

    const parsed = Number.parseFloat(totalRaw)
    return Number.isFinite(parsed) ? parsed : null
  }, [totalRaw])

  if (!orderId || !reference || total === null) {
    return (
      <OrderPreparationSection>
        <OrderPreparationHero>
          <OrderPreparationEyebrow>Paiement</OrderPreparationEyebrow>
          <OrderPreparationTitle>Commande introuvable</OrderPreparationTitle>
          <OrderPreparationError>
            Impossible de retrouver la commande a payer pour le moment.
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
        <OrderPreparationEyebrow>Paiement</OrderPreparationEyebrow>
        <OrderPreparationTitle>Continuer vers le paiement</OrderPreparationTitle>
        <OrderPreparationText>
          On a bien prepare ta commande. La prochaine etape branchera ici la session
          de paiement pour <strong>{eventTitle || 'ton evenement'}</strong>.
        </OrderPreparationText>
        <OrderPreparationSuccess>
          Ta commande est en attente de paiement. Le stock ne sera deduit qu apres la confirmation du paiement.
        </OrderPreparationSuccess>

        <OrderPreparationCard>
          <OrderPreparationCardTitle>Recapitulatif de commande</OrderPreparationCardTitle>
          <OrderPreparationList>
            <OrderPreparationListRow>
              <OrderPreparationLabel>Commande</OrderPreparationLabel>
              <OrderPreparationValue>#{orderId}</OrderPreparationValue>
            </OrderPreparationListRow>
            <OrderPreparationListRow>
              <OrderPreparationLabel>Reference</OrderPreparationLabel>
              <OrderPreparationValue>{reference}</OrderPreparationValue>
            </OrderPreparationListRow>
            <OrderPreparationListRow>
              <OrderPreparationLabel>Evenement</OrderPreparationLabel>
              <OrderPreparationValue>{eventTitle || 'A confirmer'}</OrderPreparationValue>
            </OrderPreparationListRow>
            <OrderPreparationListRow>
              <OrderPreparationLabel>Statut</OrderPreparationLabel>
              <OrderPreparationValue>En attente de paiement</OrderPreparationValue>
            </OrderPreparationListRow>
            <OrderPreparationListRow>
              <OrderPreparationLabel>Total</OrderPreparationLabel>
              <OrderPreparationValue>{formatCurrency(total)}</OrderPreparationValue>
            </OrderPreparationListRow>
          </OrderPreparationList>
          <OrderPreparationHint>
            Le raccordement au prestataire de paiement sera branche sur cette page dans
            la prochaine etape.
          </OrderPreparationHint>
          <OrderPreparationState>
            Ici, on preparera ensuite la redirection vers le paiement puis la
            confirmation finale des billets.
          </OrderPreparationState>
          <OrderPreparationActions>
            <OrderPreparationCheckoutButton type="button" disabled>
              Paiement a brancher
            </OrderPreparationCheckoutButton>
            <OrderPreparationSecondaryButton
              type="button"
              onClick={() => navigate(-1)}
            >
              Retour a la preparation
            </OrderPreparationSecondaryButton>
          </OrderPreparationActions>
        </OrderPreparationCard>
      </OrderPreparationHero>
    </OrderPreparationSection>
  )
}
