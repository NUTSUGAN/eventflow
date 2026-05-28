import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode'
import { getCurrentUser } from '../../api/auth'
import {
  getStaffScanEvents,
  submitStaffScanCheckin,
} from '../../api/staff'
import type {
  StaffScanCheckinResponse,
  StaffScanEventSummary,
} from '../../types/staff'
import {
  StaffScanActions,
  StaffScanCameraViewport,
  StaffScanEyebrow,
  StaffScanField,
  StaffScanGrid,
  StaffScanHero,
  StaffScanHiddenInput,
  StaffScanInlineText,
  StaffScanLabel,
  StaffScanMessage,
  StaffScanPanel,
  StaffScanPanelTitle,
  StaffScanResultCard,
  StaffScanResultGrid,
  StaffScanResultItem,
  StaffScanResultLabel,
  StaffScanResultMeta,
  StaffScanResultTitle,
  StaffScanResultValue,
  StaffScanSecondaryButton,
  StaffScanSection,
  StaffScanSelect,
  StaffScanStatusPill,
  StaffScanText,
  StaffScanTitle,
} from './staffScanPageElements'

function formatDateLabel(value: string | null): string {
  if (!value) {
    return 'Date a confirmer'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function readApiMessage(error: unknown, fallback: string): string {
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

function translateScannerMessage(message: string): string {
  const normalizedMessage = message.trim()

  if (normalizedMessage === '') {
    return 'Une erreur de lecture QR est survenue.'
  }

  if (
    normalizedMessage.includes('No MultiFormat Readers were able to detect the code')
  ) {
    return 'Aucun QR code lisible n a ete detecte dans cette image.'
  }

  if (
    normalizedMessage.includes('HTML Element with id=staff-scan-camera-region not found')
  ) {
    return 'Le module de lecture QR n a pas pu s initialiser correctement. Recharge la page puis reessaie.'
  }

  if (
    normalizedMessage.includes('Permission denied') ||
    normalizedMessage.includes('NotAllowedError')
  ) {
    return 'L acces a la camera a ete refuse. Autorise la webcam puis reessaie.'
  }

  if (
    normalizedMessage.includes('Requested device not found') ||
    normalizedMessage.includes('NotFoundError')
  ) {
    return 'Aucune camera compatible n a ete detectee sur cet appareil.'
  }

  if (
    normalizedMessage.includes('NotReadableError') ||
    normalizedMessage.includes('Device in use') ||
    normalizedMessage.includes('device in use') ||
    normalizedMessage.includes('TrackStartError') ||
    normalizedMessage.includes('Could not start video source')
  ) {
    return 'La camera est deja utilisee par une autre application.'
  }

  return normalizedMessage
}

function readCameraMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim() !== '') {
    return translateScannerMessage(error.message)
  }

  if (typeof error === 'string' && error.trim() !== '') {
    return translateScannerMessage(error)
  }

  return fallback
}

type StaffScanPanelNotice = {
  tone: 'neutral' | 'success' | 'danger'
  label: string
  title: string
  message: string
  details?: string
}

function resultTone(
  result: StaffScanCheckinResponse['result'] | null,
): 'success' | 'danger' | 'neutral' {
  if (result === 'valid') {
    return 'success'
  }

  if (result === 'invalid' || result === 'already_used') {
    return 'danger'
  }

  return 'neutral'
}

export function StaffScanPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const isSubmittingRef = useRef(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastCameraScanRef = useRef<{ token: string; at: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<StaffScanEventSummary[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [scanValue, setScanValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isFileScanning, setIsFileScanning] = useState(false)
  const [cameraMessage, setCameraMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'neutral' | 'success' | 'danger'>('neutral')
  const [scanResult, setScanResult] = useState<StaffScanCheckinResponse | null>(null)
  const [scanPanelNotice, setScanPanelNotice] = useState<StaffScanPanelNotice | null>(null)
  const canUseCamera =
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined'
  const cameraRegionId = 'staff-scan-camera-region'

  useEffect(() => {
    let isMounted = true

    async function loadPage() {
      setIsLoading(true)

      try {
        const currentUser = await getCurrentUser(true)

        if (!currentUser.canAccessStaffTools) {
          navigate('/explorer', { replace: true })
          return
        }

        const response = await getStaffScanEvents()

        if (!isMounted) {
          return
        }

        setEvents(response.events)
        setSelectedEventId((current) => current ?? response.events[0]?.id ?? null)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setStatusTone('danger')
        setStatusMessage(
          readApiMessage(error, 'Impossible de charger les evenements de scan.'),
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPage()

    return () => {
      isMounted = false
    }
  }, [navigate])

  useEffect(() => {
    if (!inputRef.current) {
      return
    }

    if (isCameraActive) {
      return
    }

    inputRef.current.focus()
  }, [isCameraActive, selectedEventId, isLoading])

  useEffect(() => {
    return () => {
      void stopCameraScan()
    }
  }, [])

  useEffect(() => {
    const normalizedToken = scanValue.trim()

    if (normalizedToken.length < 16 || !selectedEventId || isSubmitting) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void submitScan(normalizedToken)
    }, 220)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isSubmitting, scanValue, selectedEventId])

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  )

  async function submitScan(rawToken?: string) {
    const scanPayload = (rawToken ?? scanValue).trim()

    if (scanPayload === '' || !selectedEventId || isSubmittingRef.current) {
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)
    setStatusMessage(null)
    setScanValue('')
    setScanPanelNotice(null)

    try {
      const response = await submitStaffScanCheckin(selectedEventId, scanPayload)
      setScanResult(response)
      setStatusTone(response.result === 'valid' ? 'success' : 'danger')
      setStatusMessage(response.message)

      if (!response.ticket) {
        setScanPanelNotice({
          tone: response.result === 'valid' ? 'success' : 'danger',
          label:
            response.result === 'already_used'
              ? 'Billet deja utilise'
              : response.result === 'invalid'
                ? 'Billet invalide'
                : 'Scan traite',
          title: selectedEvent?.title ?? 'Resultat du scan',
          message: response.message,
          details: 'Aucun billet detaille n a pu etre rattache a ce scan.',
        })
      }
    } catch (error) {
      setScanResult(null)
      setStatusTone('danger')
      const translatedMessage = readApiMessage(
        error,
        'Impossible de valider ce scan pour le moment.',
      )
      setStatusMessage(translatedMessage)
      setScanPanelNotice({
        tone: 'danger',
        label: 'Scan refuse',
        title: selectedEvent?.title ?? 'Resultat du scan',
        message: translatedMessage,
      })
    } finally {
      isSubmittingRef.current = false
      setIsSubmitting(false)
      window.setTimeout(() => {
        inputRef.current?.focus()
      }, 10)
    }
  }

  async function ensureScanner(): Promise<Html5Qrcode> {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(cameraRegionId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      })
    }

    return scannerRef.current
  }

  async function stopCameraScan() {
    const scanner = scannerRef.current

    if (!scanner) {
      setIsCameraActive(false)
      setIsCameraStarting(false)
      return
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop()
      }
    } catch {
      // Best effort cleanup.
    }

    try {
      scanner.clear()
    } catch {
      // Best effort cleanup.
    }

    setIsCameraActive(false)
    setIsCameraStarting(false)
  }

  async function handleCameraDecoded(decodedText: string) {
    const normalizedToken = decodedText.trim()

    if (normalizedToken.length < 8) {
      return
    }

    const now = Date.now()
    const lastCameraScan = lastCameraScanRef.current

    if (
      lastCameraScan &&
      lastCameraScan.token === normalizedToken &&
      now - lastCameraScan.at < 1800
    ) {
      return
    }

    lastCameraScanRef.current = {
      token: normalizedToken,
      at: now,
    }

    setScanValue(normalizedToken)
    await submitScan(normalizedToken)
  }

  async function startCameraScan() {
    if (!selectedEventId || isCameraStarting || isSubmitting) {
      return
    }

    if (!canUseCamera) {
      setStatusTone('danger')
      setScanResult(null)
      setScanPanelNotice({
        tone: 'danger',
        label: 'Camera indisponible',
        title: selectedEvent?.title ?? 'Lecture camera impossible',
        message: 'Cette machine ne propose pas de camera web exploitable.',
      })
      setStatusMessage('Cette machine ne propose pas de camera web exploitable.')
      return
    }

    setStatusMessage(null)
    setCameraMessage(null)
    setIsCameraStarting(true)

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 0)
      })

      const scanner = await ensureScanner()
      const cameras = await Html5Qrcode.getCameras()

      if (cameras.length === 0) {
        throw new Error('Aucune camera detectee sur cet appareil.')
      }

      const preferredCamera =
        cameras.find((camera) => /back|rear|environment|world/i.test(camera.label)) ??
        cameras[0]

      await scanner.start(
        preferredCamera.id,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
        },
        (decodedText) => {
          void handleCameraDecoded(decodedText)
        },
        () => {
          // On garde le bruit d'erreur de lecture silencieux pendant le cadrage.
        },
      )

      setIsCameraActive(true)
      setCameraMessage('Camera active. Vise le QR code du billet.')
    } catch (error) {
      const translatedMessage = readCameraMessage(
        error,
        'Impossible de demarrer la camera pour le scan.',
      )
      setScanResult(null)
      setScanPanelNotice({
        tone: 'danger',
        label: 'Camera indisponible',
        title: selectedEvent?.title ?? 'Lecture camera impossible',
        message: translatedMessage,
      })
      setStatusTone('danger')
      setStatusMessage(translatedMessage)
      await stopCameraScan()
    } finally {
      setIsCameraStarting(false)
    }
  }

  async function handleImageSelection(
    changeEvent: ChangeEvent<HTMLInputElement>,
  ) {
    const imageFile = changeEvent.target.files?.[0]
    changeEvent.target.value = ''

    if (!imageFile || !selectedEventId) {
      return
    }

    setStatusMessage(null)
    setCameraMessage(null)
    setIsFileScanning(true)

    try {
      if (isCameraActive) {
        await stopCameraScan()
      }

      const scanner = await ensureScanner()
      const decodedText = await scanner.scanFile(imageFile, false)

      setCameraMessage('QR detecte depuis une image locale.')
      await submitScan(decodedText)
    } catch (error) {
      const translatedMessage = readCameraMessage(
        error,
        'Impossible de lire un QR code dans cette image.',
      )
      setScanResult(null)
      setScanPanelNotice({
        tone: 'danger',
        label: 'Image illisible',
        title: selectedEvent?.title ?? 'Lecture image impossible',
        message: translatedMessage,
        details: 'Utilise une capture plus nette, bien centree, avec un QR contraste sur fond clair.',
      })
      setStatusTone('danger')
      setStatusMessage(translatedMessage)
    } finally {
      setIsFileScanning(false)
    }
  }

  return (
    <StaffScanSection>
      <StaffScanHero>
        <StaffScanEyebrow>Controle d acces</StaffScanEyebrow>
        <StaffScanTitle>Scanner les billets</StaffScanTitle>
        <StaffScanText>
          Cette premiere version marche a la fois avec un scanner type Tera
          branche en mode clavier, avec la camera du navigateur, ou depuis une
          image du billet. EventFlow verifie ensuite le billet cote API.
        </StaffScanText>

        <StaffScanGrid>
          <StaffScanPanel>
            <StaffScanPanelTitle>Poste de scan</StaffScanPanelTitle>
            <StaffScanField>
              <StaffScanLabel htmlFor="staff-scan-event">Evenement actif</StaffScanLabel>
              <StaffScanSelect
                id="staff-scan-event"
                value={selectedEventId ?? ''}
                onChange={(changeEvent) =>
                  setSelectedEventId(Number.parseInt(changeEvent.target.value, 10))
                }
                disabled={events.length === 0}
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title ?? 'Evenement sans titre'} - {event.organizer.displayName}
                  </option>
                ))}
              </StaffScanSelect>
            </StaffScanField>

            <StaffScanHiddenInput
              id="staff-scan-token"
              ref={inputRef}
              type="text"
              value={scanValue}
              onChange={(changeEvent) => setScanValue(changeEvent.target.value)}
              onPaste={(clipboardEvent) => {
                clipboardEvent.preventDefault()
              }}
              onKeyDown={(keyboardEvent) => {
                if (keyboardEvent.key === 'Enter') {
                  keyboardEvent.preventDefault()
                  void submitScan()
                }
              }}
              aria-label="Reception du scan QR"
              autoComplete="off"
              spellCheck={false}
              disabled={!selectedEventId || isSubmitting || isLoading}
            />

            <StaffScanActions>
              <StaffScanSecondaryButton
                type="button"
                onClick={() =>
                  void (isCameraActive ? stopCameraScan() : startCameraScan())
                }
                disabled={!selectedEventId || isCameraStarting || isFileScanning}
              >
                {isCameraActive
                  ? 'Arreter la camera'
                  : isCameraStarting
                    ? 'Demarrage camera...'
                    : 'Scanner avec la camera'}
              </StaffScanSecondaryButton>
              <StaffScanSecondaryButton
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedEventId || isSubmitting || isCameraStarting || isFileScanning}
              >
                {isFileScanning ? 'Lecture image...' : 'Scanner depuis une image'}
              </StaffScanSecondaryButton>
              <StaffScanSecondaryButton
                type="button"
                onClick={() => navigate('/organizer/staff')}
              >
                Gerer le staff
              </StaffScanSecondaryButton>
            </StaffScanActions>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelection}
              hidden
            />

            <StaffScanCameraViewport
              $visible={isCameraActive || isCameraStarting}
            >
              <div id={cameraRegionId} />
            </StaffScanCameraViewport>

            {statusMessage ? (
              <StaffScanMessage $tone={statusTone}>{statusMessage}</StaffScanMessage>
            ) : null}

            {cameraMessage ? (
              <StaffScanMessage $tone="neutral">{cameraMessage}</StaffScanMessage>
            ) : null}

            <StaffScanInlineText>
              Astuce Tera: si le scanner envoie directement le texte du QR sans
              suffixe, cette page sait tout de meme le traiter apres une courte
              pause. Si un Enter est envoye, la validation part tout de suite.
            </StaffScanInlineText>
            <StaffScanInlineText>
              Astuce web: sur ordinateur tu peux autoriser la webcam, et sur
              mobile tu peux aussi charger une capture d ecran du billet si la
              camera n est pas disponible.
            </StaffScanInlineText>
          </StaffScanPanel>

          <StaffScanPanel>
            <StaffScanPanelTitle>Resultat du dernier scan</StaffScanPanelTitle>
            <StaffScanStatusPill
              $tone={
                scanResult
                  ? resultTone(scanResult.result)
                  : scanPanelNotice?.tone ?? 'neutral'
              }
            >
              {scanResult?.result === 'valid'
                ? 'Billet valide'
                : scanResult?.result === 'already_used'
                  ? 'Billet deja utilise'
                  : scanResult?.result === 'invalid'
                    ? 'Billet invalide'
                    : scanPanelNotice?.label ?? 'Pret a scanner'}
            </StaffScanStatusPill>

            {isLoading ? (
              <StaffScanInlineText>Chargement du contexte de scan...</StaffScanInlineText>
            ) : events.length === 0 ? (
              <StaffScanInlineText>
                Aucun evenement accessible pour le moment. Ajoute un membre au
                staff ou ouvre un evenement organisateur a scanner.
              </StaffScanInlineText>
            ) : scanResult?.ticket ? (
              <StaffScanResultCard>
                <StaffScanResultTitle>
                  {scanResult.ticket.event.title ?? 'Evenement sans titre'}
                </StaffScanResultTitle>
                <StaffScanResultMeta>
                  {scanResult.ticket.ticketType.name ?? 'Billet EventFlow'} -{' '}
                  {scanResult.ticket.displayCode}
                </StaffScanResultMeta>
                <StaffScanResultGrid>
                  <StaffScanResultItem>
                    <StaffScanResultLabel>Client</StaffScanResultLabel>
                    <StaffScanResultValue>
                      {scanResult.ticket.customer.displayName}
                    </StaffScanResultValue>
                  </StaffScanResultItem>
                  <StaffScanResultItem>
                    <StaffScanResultLabel>Email</StaffScanResultLabel>
                    <StaffScanResultValue>
                      {scanResult.ticket.customer.email ?? 'Email indisponible'}
                    </StaffScanResultValue>
                  </StaffScanResultItem>
                  <StaffScanResultItem>
                    <StaffScanResultLabel>Commande</StaffScanResultLabel>
                    <StaffScanResultValue>
                      {scanResult.ticket.order.reference ?? 'Reference indisponible'}
                    </StaffScanResultValue>
                  </StaffScanResultItem>
                  <StaffScanResultItem>
                    <StaffScanResultLabel>Lieu</StaffScanResultLabel>
                    <StaffScanResultValue>
                      {scanResult.ticket.event.venue ?? scanResult.ticket.event.city ?? 'Lieu a confirmer'}
                    </StaffScanResultValue>
                  </StaffScanResultItem>
                  <StaffScanResultItem>
                    <StaffScanResultLabel>Debut</StaffScanResultLabel>
                    <StaffScanResultValue>
                      {formatDateLabel(scanResult.ticket.event.startsAt)}
                    </StaffScanResultValue>
                  </StaffScanResultItem>
                  <StaffScanResultItem>
                    <StaffScanResultLabel>Dernier scan</StaffScanResultLabel>
                    <StaffScanResultValue>
                      {formatDateLabel(
                        scanResult.ticket.usedAt ?? scanResult.checkin.scannedAt,
                      )}
                    </StaffScanResultValue>
                  </StaffScanResultItem>
                </StaffScanResultGrid>
              </StaffScanResultCard>
            ) : scanPanelNotice ? (
              <StaffScanResultCard>
                <StaffScanResultTitle>{scanPanelNotice.title}</StaffScanResultTitle>
                <StaffScanResultMeta>{scanPanelNotice.message}</StaffScanResultMeta>
                {scanPanelNotice.details ? (
                  <StaffScanResultMeta>{scanPanelNotice.details}</StaffScanResultMeta>
                ) : null}
              </StaffScanResultCard>
            ) : (
              <StaffScanInlineText>
                {selectedEvent
                  ? `Poste pret pour ${selectedEvent.title ?? 'cet evenement'}.`
                  : 'Choisis un evenement puis scanne un billet.'}
              </StaffScanInlineText>
            )}
          </StaffScanPanel>
        </StaffScanGrid>
      </StaffScanHero>
    </StaffScanSection>
  )
}
