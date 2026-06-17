import { useEffect, useMemo, useState } from 'react'
import { createPromotionCampaign, getPromotionOptions } from '../../api/promotions'
import type { PromotionChannelCode, PromotionDuration, PromotionOptions } from '../../types/promotion'
import {
  BoosterButton,
  BoosterChannel,
  BoosterChannelCopy,
  BoosterChannelHead,
  BoosterChannels,
  BoosterDuration,
  BoosterDurationButton,
  BoosterHeader,
  BoosterMessage,
  BoosterPanel,
  BoosterPrice,
  BoosterSummary,
  BoosterText,
  BoosterTitle,
  BoosterTotal,
} from './promotionBoosterPanelElements'

const durationLabels: Record<PromotionDuration, string> = {
  '7_days': '1 semaine',
  '14_days': '2 semaines',
  '30_days': '1 mois',
}

const channelContent: Record<PromotionChannelCode, { title: string; copy: string }> = {
  LAUNCH_PACK: { title: 'Pack Lancement', copy: "Mise en avant sur l’accueil et priorité dans Explorer." },
  SOCIAL_INFLUENCER: { title: 'Réseaux et influenceurs', copy: "Diffusion operee par l’équipe EventFlow sur les canaux sociaux." },
  NEWSLETTER: { title: 'Newsletter', copy: 'Mise en avant auprès des abonnés EventFlow et de ton audience.' },
}

function readApiMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const message = (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
    if (message) return String(message)
  }
  return 'Impossible de traiter la demande Booster.'
}

export function PromotionBoosterPanel({ eventId, eventStatus }: { eventId: number; eventStatus: string }) {
  const [duration, setDuration] = useState<PromotionDuration>('7_days')
  const [selectedChannels, setSelectedChannels] = useState<PromotionChannelCode[]>([])
  const [options, setOptions] = useState<PromotionOptions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getPromotionOptions(eventId, duration)
      .then((data) => { if (mounted) setOptions(data) })
      .catch((nextError) => { if (mounted) setError(readApiMessage(nextError)) })
      .finally(() => { if (mounted) setIsLoading(false) })
    return () => { mounted = false }
  }, [duration, eventId])

  const selectedRates = useMemo(
    () => options?.rates.filter((rate) => rate.duration === duration && selectedChannels.includes(rate.channelCode)) ?? [],
    [duration, options, selectedChannels],
  )
  const total = selectedRates.reduce((sum, rate) => sum + Number(rate.priceAmount), 0)
  const currency = selectedRates[0]?.currency ?? 'EUR'

  function toggleChannel(channel: PromotionChannelCode) {
    if (channel === 'LAUNCH_PACK' && options && !options.launchPack.available) return
    setSelectedChannels((current) => current.includes(channel)
      ? current.filter((item) => item !== channel)
      : [...current, channel])
  }

  async function submit() {
    setMessage(null)
    setError(null)
    setIsSubmitting(true)
    try {
      await createPromotionCampaign(eventId, { duration, channels: selectedChannels })
      setSelectedChannels([])
      setMessage("Demande envoyée. L'équipe EventFlow doit maintenant la valider avant paiement.")
    } catch (nextError) {
      setError(readApiMessage(nextError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BoosterPanel>
      <BoosterHeader>
        <div>
          <BoosterTitle>Booster cet évènement</BoosterTitle>
          <BoosterText>Choisis une durée et les canaux utiles. Le tarif final est recalculé par EventFlow.</BoosterText>
        </div>
        <BoosterDuration>
          {(options?.durations ?? ['7_days', '14_days', '30_days']).map((item) => (
            <BoosterDurationButton key={item} type="button" $active={duration === item} onClick={() => setDuration(item)}>
              {durationLabels[item]}
            </BoosterDurationButton>
          ))}
        </BoosterDuration>
      </BoosterHeader>

      {eventStatus !== 'published' ? <BoosterMessage $error>Publié d’abord cet évènement pour activer Booster.</BoosterMessage> : null}
      {error ? <BoosterMessage $error>{error}</BoosterMessage> : null}
      {message ? <BoosterMessage>{message}</BoosterMessage> : null}

      <BoosterChannels>
        {(options?.channels ?? ['LAUNCH_PACK', 'SOCIAL_INFLUENCER', 'NEWSLETTER']).map((channel) => {
          const disabled = channel === 'LAUNCH_PACK' && options !== null && !options.launchPack.available
          const rate = options?.rates.find((item) => item.channelCode === channel && item.duration === duration)
          return (
            <BoosterChannel key={channel} $disabled={disabled} $selected={selectedChannels.includes(channel)}>
              <BoosterChannelHead>
                <input type="checkbox" checked={selectedChannels.includes(channel)} disabled={disabled} onChange={() => toggleChannel(channel)} />
                {channelContent[channel].title}
              </BoosterChannelHead>
              <BoosterChannelCopy>{disabled ? 'Les 3 emplacements sont déjà réservés sur cette période.' : channelContent[channel].copy}</BoosterChannelCopy>
              <BoosterPrice>{rate ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: rate.currency }).format(Number(rate.priceAmount)) : 'Tarif indisponible'}</BoosterPrice>
            </BoosterChannel>
          )
        })}
      </BoosterChannels>

      <BoosterSummary>
        <BoosterTotal>Total : {new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(total)}</BoosterTotal>
        <BoosterButton type="button" disabled={isLoading || isSubmitting || eventStatus !== 'published' || selectedChannels.length === 0} onClick={() => void submit()}>
          {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
        </BoosterButton>
      </BoosterSummary>
    </BoosterPanel>
  )
}
