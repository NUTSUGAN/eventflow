import { QRCode } from 'react-qr-code'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicGuestTicket } from '../../api/organizerGuestTickets'
import type { OrganizerGuestTicket } from '../../types/organizerGuestTicket'
import {
  MyTicketsCardText,
  TicketDetailCard,
  TicketDetailCardTitle,
  TicketDetailCodeBadge,
  TicketDetailCodePanel,
  TicketDetailCodeValue,
  TicketDetailEyebrow,
  TicketDetailHeader,
  TicketDetailHero,
  TicketDetailHeroText,
  TicketDetailQrLogo,
  TicketDetailQrWrap,
  TicketDetailShell,
  TicketDetailState,
  TicketDetailSubtitle,
  TicketDetailTitle,
} from '../MyTicketsPage/myTicketsPageElements'

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'Date à confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function GuestTicketPage() {
  const { token } = useParams()
  const hasToken = Boolean(token)
  const [guestTicket, setGuestTicket] = useState<OrganizerGuestTicket | null>(null)
  const [isLoading, setIsLoading] = useState(hasToken)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!hasToken) {
      return
    }

    let isMounted = true

    async function loadGuestTicket() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getPublicGuestTicket(token ?? '')

        if (isMounted) {
          setGuestTicket(response.guestTicket)
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Impossible de charger ce billet invité.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadGuestTicket()

    return () => {
      isMounted = false
    }
  }, [hasToken, token])

  const displayedIsLoading = hasToken ? isLoading : false
  const displayedErrorMessage = hasToken
    ? errorMessage
    : 'Billet invité introuvable.'

  if (displayedIsLoading) {
    return (
      <TicketDetailShell>
        <TicketDetailState>Chargement du billet invité...</TicketDetailState>
      </TicketDetailShell>
    )
  }

  if (!guestTicket || !guestTicket.qrToken) {
    return (
      <TicketDetailShell>
        <TicketDetailState>{displayedErrorMessage ?? 'Billet invité indisponible.'}</TicketDetailState>
      </TicketDetailShell>
    )
  }

  return (
    <TicketDetailShell>
      <TicketDetailHeader>
        <TicketDetailHero $imageUrl={guestTicket.event.coverImageUrl ?? undefined}>
          <TicketDetailHeroText>
            <TicketDetailEyebrow>Invitation EventFlow</TicketDetailEyebrow>
            <TicketDetailTitle>
              {guestTicket.event.title ?? 'Événement EventFlow'}
            </TicketDetailTitle>
            <TicketDetailSubtitle>
              {guestTicket.ticketType.name ?? 'Invitation'} -{' '}
              {guestTicket.displayCode}
            </TicketDetailSubtitle>
          </TicketDetailHeroText>
        </TicketDetailHero>

        <TicketDetailCard>
          <TicketDetailCardTitle>QR code à présenter au scan</TicketDetailCardTitle>
          <TicketDetailCodePanel>
            <TicketDetailCodeBadge>
              {guestTicket.hasCheckedIn ? 'Déjà scanné' : 'Invitation'}
            </TicketDetailCodeBadge>
            <TicketDetailQrWrap>
              <QRCode
                value={guestTicket.qrToken}
                size={208}
                bgColor="#FFFFFF"
                fgColor="#1c140f"
                style={{ width: '100%', height: 'auto' }}
              />
              <TicketDetailQrLogo aria-hidden="true" />
            </TicketDetailQrWrap>
            <TicketDetailCodeValue>
              Code billet : {guestTicket.displayCode}
            </TicketDetailCodeValue>
            <MyTicketsCardText>
              Invité : {guestTicket.recipientName ?? guestTicket.recipientEmail}
            </MyTicketsCardText>
            <MyTicketsCardText>
              {formatDateTime(guestTicket.event.startsAt)}
            </MyTicketsCardText>
            <MyTicketsCardText>
              {guestTicket.event.venue ?? 'Lieu à confirmer'}
            </MyTicketsCardText>
          </TicketDetailCodePanel>
        </TicketDetailCard>
      </TicketDetailHeader>
    </TicketDetailShell>
  )
}
