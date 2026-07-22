import { jsPDF } from 'jspdf'
import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { QRCode } from 'react-qr-code'
import { useNavigate, useParams } from 'react-router-dom'
import { getBackendPublicUrl } from '../../api/client'
import { getMyTicket } from '../../api/tickets'
import type { TicketRecord } from '../../types/ticket'
import {
  MyTicketsActions,
  MyTicketsCardText,
  MyTicketsPrimaryButton,
  MyTicketsSecondaryButton,
  MyTicketsStatusMessage,
  TicketDetailCard,
  TicketDetailCardTitle,
  TicketDetailCodeBadge,
  TicketDetailCodePanel,
  TicketDetailCodeValue,
  TicketDetailEyebrow,
  TicketDetailHeader,
  TicketDetailHero,
  TicketDetailHeroText,
  TicketDetailNote,
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

function formatCurrency(value: number, currency: string | null): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency ?? 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function sanitizeFilenamePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Impossible de préparer l’image du billet.'))
    }

    reader.onerror = () => {
      reject(new Error('Impossible de préparer l’image du billet.'))
    }

    reader.readAsDataURL(blob)
  })
}

function toExportAssetUrl(assetUrl: string | null): string | null {
  if (!assetUrl) {
    return null
  }

  try {
    const resolvedUrl = new URL(assetUrl, window.location.origin)
    const backendOrigin = new URL(getBackendPublicUrl()).origin

    if (resolvedUrl.origin === backendOrigin) {
      return `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`
    }

    return resolvedUrl.toString()
  } catch {
    return assetUrl
  }
}

export function TicketDetailPage() {
  const navigate = useNavigate()
  const { ticketId: rawTicketId } = useParams()
  const ticketId = Number.parseInt(rawTicketId ?? '', 10)
  const hasValidTicketId = Number.isFinite(ticketId) && ticketId > 0
  const exportCardRef = useRef<HTMLDivElement | null>(null)
  const [ticket, setTicket] = useState<TicketRecord | null>(null)
  const [isLoading, setIsLoading] = useState(hasValidTicketId)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [downloadState, setDownloadState] = useState<'png' | 'pdf' | null>(null)
  const [exportCoverImage, setExportCoverImage] = useState<string | null>(null)

  useEffect(() => {
    if (!hasValidTicketId) {
      return
    }

    let isMounted = true

    async function loadTicket() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getMyTicket(ticketId)

        if (isMounted) {
          setTicket(response.ticket)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        const status =
          typeof error === 'object' &&
          error !== null &&
          'response' in error
            ? (error as { response?: { status?: unknown } }).response?.status
            : null

        if (status === 404) {
          setErrorMessage('Ce billet est introuvable ou ne t appartient pas.')
        } else if (status === 401) {
          setErrorMessage('Connecte-toi pour voir ce billet.')
        } else {
          setErrorMessage('Impossible de charger ce billet pour le moment.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadTicket()

    return () => {
      isMounted = false
    }
  }, [hasValidTicketId, ticketId])

  const ticketFileBaseName = useMemo(() => {
    if (!ticket) {
      return 'eventflow-ticket'
    }

    const eventPart = sanitizeFilenamePart(ticket?.event.title ?? 'eventflow')
    const codePart = sanitizeFilenamePart(ticket?.displayCode)

    return `${eventPart || 'eventflow'}-${codePart || 'ticket'}`
  }, [ticket])

  const proxiedCoverUrl = useMemo(
    () => toExportAssetUrl(ticket?.event.coverImageUrl ?? null),
    [ticket?.event.coverImageUrl]
  )

  const exportCoverSrc = exportCoverImage ?? proxiedCoverUrl

  useEffect(() => {
    const abortController = new AbortController()
    let isCancelled = false

    async function prepareExportCover() {
      if (!proxiedCoverUrl) {
        setExportCoverImage(null)
        return
      }

      try {
        const response = await fetch(proxiedCoverUrl, {
          credentials: 'include',
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error('Impossible de charger l’image de l’évènement.')
        }

        const blob = await response.blob()
        const dataUrl = await blobToDataUrl(blob)

        if (!isCancelled) {
          setExportCoverImage(dataUrl)
        }
      } catch {
        if (!isCancelled) {
          setExportCoverImage(null)
        }
      }
    }

    void prepareExportCover()

    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [proxiedCoverUrl])

  async function renderTicketImage(): Promise<{ dataUrl: string; width: number; height: number }> {
    if (!exportCardRef.current) {
      throw new Error('Le billet à exporter est indisponible.')
    }

    await document.fonts.ready.catch(() => undefined)
    await new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve)
      })
    })

    const canvas = await html2canvas(exportCardRef.current, {
      backgroundColor: '#f6f1eb',
      scale: 2,
      useCORS: true,
      logging: false,
      imageTimeout: 0,
    })

    const dataUrl = canvas.toDataURL('image/png')

    return {
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    }
  }

  async function handleDownloadImage() {
    if (!ticket || downloadState) {
      return
    }

    setDownloadState('png')
    setFeedbackMessage(null)

    try {
      const { dataUrl } = await renderTicketImage()
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${ticketFileBaseName}.png`
      link.click()
      setFeedbackMessage('Billet telecharge en image.')
    } catch (error) {
      setFeedbackMessage(
        error instanceof Error && error.message
          ? error.message
          : `Impossible de telecharger le billet en image (${String(error)}).`
      )
    } finally {
      setDownloadState(null)
    }
  }

  async function handleDownloadPdf() {
    if (!ticket || downloadState) {
      return
    }

    setDownloadState('pdf')
    setFeedbackMessage(null)

    try {
      const { dataUrl, width, height } = await renderTicketImage()
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
      })

      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height)
      pdf.save(`${ticketFileBaseName}.pdf`)
      setFeedbackMessage('Billet telecharge en PDF.')
    } catch (error) {
      setFeedbackMessage(
        error instanceof Error && error.message
          ? error.message
          : `Impossible de telecharger le billet en PDF (${String(error)}).`
      )
    } finally {
      setDownloadState(null)
    }
  }

  const displayedIsLoading = hasValidTicketId ? isLoading : false
  const displayedErrorMessage = hasValidTicketId
    ? errorMessage
    : 'Billet introuvable.'

  if (displayedIsLoading) {
    return (
      <TicketDetailShell>
        <TicketDetailState>Chargement du billet...</TicketDetailState>
      </TicketDetailShell>
    )
  }

  if (!ticket) {
    return (
      <TicketDetailShell>
        <TicketDetailState>{displayedErrorMessage ?? 'Billet indisponible.'}</TicketDetailState>
        <MyTicketsActions>
          <MyTicketsPrimaryButton
            type="button"
            onClick={() => navigate('/mes-billets')}
          >
            Retour à mes billets
          </MyTicketsPrimaryButton>
        </MyTicketsActions>
      </TicketDetailShell>
    )
  }

  return (
    <TicketDetailShell>
      <TicketDetailHeader>
        <TicketDetailHero $imageUrl={ticket.event.coverImageUrl ?? undefined}>
          <TicketDetailHeroText>
            <TicketDetailEyebrow>Billet confirmé</TicketDetailEyebrow>
            <TicketDetailTitle>{ticket.event.title ?? 'évènement EventFlow'}</TicketDetailTitle>
            <TicketDetailSubtitle>
              {ticket.ticketType.name ?? 'Billet'} - {ticket.displayCode}
            </TicketDetailSubtitle>
          </TicketDetailHeroText>
        </TicketDetailHero>

        <TicketDetailCard>
          <TicketDetailCardTitle>QR code du billet</TicketDetailCardTitle>
          <TicketDetailCodePanel>
            <TicketDetailCodeBadge>Billet payé</TicketDetailCodeBadge>
            {ticket.qrToken ? (
              <TicketDetailQrWrap>
                <QRCode
                  value={ticket.qrToken}
                  size={208}
                  bgColor="#FFFFFF"
                  fgColor="#1c140f"
                  style={{ width: '100%', height: 'auto' }}
                />
                <TicketDetailQrLogo aria-hidden="true" />
              </TicketDetailQrWrap>
            ) : null}
            <TicketDetailCodeValue>
              Code billet : {ticket.displayCode}
            </TicketDetailCodeValue>
            <MyTicketsCardText>
              {formatDateTime(ticket.event.startsAt)}
            </MyTicketsCardText>
            <MyTicketsCardText>
              {ticket.event.venue ?? 'Lieu à confirmer'}
            </MyTicketsCardText>
            <TicketDetailNote>
              Télécharge ce billet en image ou en PDF pour l’envoyer directement à la personne qui doit entrer avec ce QR.
            </TicketDetailNote>
          </TicketDetailCodePanel>
        </TicketDetailCard>

        {feedbackMessage ? <MyTicketsStatusMessage>{feedbackMessage}</MyTicketsStatusMessage> : null}

        <MyTicketsActions>
          <MyTicketsPrimaryButton
            type="button"
            onClick={handleDownloadImage}
            disabled={null !== downloadState}
          >
            {downloadState === 'png' ? 'Préparation image...' : 'Partager en image'}
          </MyTicketsPrimaryButton>
          <MyTicketsPrimaryButton
            type="button"
            onClick={handleDownloadPdf}
            disabled={null !== downloadState}
          >
            {downloadState === 'pdf' ? 'Préparation PDF...' : 'Télécharger en PDF'}
          </MyTicketsPrimaryButton>
          <MyTicketsSecondaryButton
            type="button"
            onClick={() => navigate('/mes-billets')}
          >
            Retour à mes billets
          </MyTicketsSecondaryButton>
          {ticket.event.id ? (
            <MyTicketsSecondaryButton
              type="button"
              onClick={() => navigate(`/events/${ticket.event.id}`)}
            >
              Voir l&apos;évènement
            </MyTicketsSecondaryButton>
          ) : null}
        </MyTicketsActions>
      </TicketDetailHeader>

      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          pointerEvents: 'none',
          opacity: 1,
        }}
      >
        <div
          ref={exportCardRef}
          style={{
            width: '920px',
            display: 'grid',
            gap: '22px',
            padding: '36px',
            borderRadius: '28px',
            background: '#f6f1eb',
            color: '#1e1713',
            boxSizing: 'border-box',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div
            style={{
              minHeight: '220px',
              display: 'grid',
              alignContent: 'end',
              gap: '10px',
              padding: '28px',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(160deg, rgba(226, 139, 82, 0.48), rgba(54, 39, 31, 0.92))',
              color: '#fffaf4',
            }}
          >
            {exportCoverSrc ? (
              <img
                src={exportCoverSrc}
                alt=""
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : null}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(18, 14, 12, 0.1), rgba(18, 14, 12, 0.62))',
              }}
            />
            <span
              style={{
                display: 'inline-flex',
                width: 'fit-content',
                padding: '8px 12px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.16)',
                fontSize: '14px',
                fontWeight: 800,
                textTransform: 'uppercase',
                position: 'relative',
                zIndex: 1,
              }}
            >
              EventFlow - billet payé
            </span>
            <div style={{ display: 'grid', gap: '6px', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '46px', fontWeight: 800, lineHeight: 1.05 }}>
                {ticket.event.title ?? 'évènement EventFlow'}
              </div>
              <div style={{ fontSize: '24px', opacity: 0.92 }}>
                {ticket.ticketType.name ?? 'Billet'} - {ticket.displayCode}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 0.9fr',
              gap: '22px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: '16px',
                padding: '24px',
                borderRadius: '22px',
                background: '#fffaf5',
                border: '1px solid #eadfd4',
                overflow: 'hidden',
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 800 }}>Billet à présenter</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#72655d' }}>
                    Date
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 700 }}>
                    {formatDateTime(ticket.event.startsAt)}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#72655d' }}>
                    Lieu
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 700 }}>
                    {ticket.event.venue ?? 'Lieu à confirmer'}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#72655d' }}>
                    Commande
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 700 }}>
                    {ticket.order.reference ?? 'Référence indisponible'}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#72655d' }}>
                    Montant
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 700 }}>
                    {formatCurrency(ticket.amount, ticket.order.currency)}
                  </span>
                </div>
              </div>
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: '18px',
                  background: 'rgba(226, 139, 82, 0.12)',
                  color: '#5e4030',
                  fontSize: '18px',
                  lineHeight: 1.6,
                }}
              >
                Ce billet peut être envoyé tel quel
                à la personne qui doit se faire scanner.
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                alignContent: 'center',
                justifyItems: 'center',
                gap: '16px',
                padding: '24px',
                borderRadius: '22px',
                background: '#ffffff',
                border: '1px solid #eadfd4',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  padding: '8px 12px',
                  borderRadius: '999px',
                  background: 'rgba(28, 20, 15, 0.08)',
                  color: '#4f3728',
                  fontSize: '14px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                }}
              >
                QR code du billet
              </div>
              <div
                style={{
                  position: 'relative',
                  width: '340px',
                  padding: '20px',
                  borderRadius: '24px',
                  background: '#ffffff',
                  border: '1px solid #eadfd4',
                  overflow: 'hidden',
                }}
              >
                <QRCode
                  value={ticket.qrToken ?? ticket.displayCode}
                  size={300}
                  bgColor="#FFFFFF"
                  fgColor="#1c140f"
                  style={{ width: '100%', height: 'auto' }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: '42px',
                    height: '42px',
                    padding: '8px',
                    borderRadius: '16px',
                    background: '#ffffff url("/eventflow-logo-mobile.png") center / 135% auto no-repeat',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 0 1px rgba(28, 20, 15, 0.1), 0 10px 22px rgba(28, 20, 15, 0.14)',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#1e1713',
                }}
              >
                {ticket.displayCode}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TicketDetailShell>
  )
}
