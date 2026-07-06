import { PromotionBoosterPanel } from '../../components/PromotionBoosterPanel/PromotionBoosterPanel'
import type { AuthUser } from '../../types/auth'
import type {
  OrganizerEventSalesSummary,
  OrganizerEventScanStats,
  OrganizerEventScanSummary,
  OrganizerEventSummary,
} from '../../types/organizerEvent'
import { ADMIN_ORGANIZER_READ_ONLY_MESSAGE } from '../../auth/adminPermissions'
import {
  formatCurrencyAmount,
  formatOrganizerDate,
  formatStatusLabel,
  resolveMediaUrl,
} from './organizerEventDetailFormatters'
import {
  OrganizerEventDetailCover,
  OrganizerEventDetailEyebrow,
  OrganizerEventDetailHero,
  OrganizerEventDetailHeroContent,
  OrganizerEventDetailInfoPanel,
  OrganizerEventDetailInfoText,
  OrganizerEventDetailInfoTitle,
  OrganizerEventDetailOverviewGrid,
  OrganizerEventDetailOverviewStat,
  OrganizerEventDetailOverviewStatHint,
  OrganizerEventDetailOverviewStatLabel,
  OrganizerEventDetailOverviewStatValue,
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
  OrganizerEventDetailSplitEyebrow,
  OrganizerEventDetailSplitHeader,
  OrganizerEventDetailSplitSection,
  OrganizerEventDetailSplitText,
  OrganizerEventDetailSplitTitle,
  OrganizerEventDetailState,
  OrganizerEventDetailStatusBadge,
  OrganizerEventDetailText,
  OrganizerEventDetailTicketStat,
  OrganizerEventDetailTicketStatLabel,
  OrganizerEventDetailTicketStatValue,
  OrganizerEventDetailTicketStats,
  OrganizerEventDetailTitle,
} from './organizerEventDetailPageElements'

type HeroProps = {
  event: OrganizerEventSummary
  currentUser: AuthUser | null
}

export function OrganizerEventHero({ event, currentUser }: HeroProps) {
  return (
    <OrganizerEventDetailHero>
      <OrganizerEventDetailCover
        $imageUrl={resolveMediaUrl(event.coverPhoto ?? event.thumbnailPhoto ?? null)}
      />
      <OrganizerEventDetailHeroContent>
        <OrganizerEventDetailEyebrow>Espace organisateur</OrganizerEventDetailEyebrow>
        <OrganizerEventDetailTitle>{event.title ?? 'Fiche évènement'}</OrganizerEventDetailTitle>
        <OrganizerEventDetailText>
          {currentUser
            ? `${currentUser.firstName}, pilote cette fiche avec ses ventes, ses scans, sa billetterie et ses réglages depuis les onglets.`
            : 'Retrouve ici la fiche organisateur de ton évènement et sa billetterie.'}
        </OrganizerEventDetailText>
        <OrganizerEventDetailStatusBadge $published={event.status === 'published'}>
          {formatStatusLabel(event.status ?? 'draft')}
        </OrganizerEventDetailStatusBadge>

        <OrganizerEventDetailInfoPanel>
          <OrganizerEventDetailInfoTitle>Résumé de la fiche</OrganizerEventDetailInfoTitle>
          <OrganizerEventDetailInfoText>
            {event.category.name ?? 'Catégorie'} - {event.location.city ?? 'Ville'}
          </OrganizerEventDetailInfoText>
          <OrganizerEventDetailInfoText>
            Début : {formatOrganizerDate(event.startDatetime ?? null)}
          </OrganizerEventDetailInfoText>
          <OrganizerEventDetailInfoText>
            Capacité maximale : {event.capacity ?? 0} place(s)
          </OrganizerEventDetailInfoText>
        </OrganizerEventDetailInfoPanel>
      </OrganizerEventDetailHeroContent>
    </OrganizerEventDetailHero>
  )
}

type OverviewProps = {
  eventSales: OrganizerEventSalesSummary
  eventScans: OrganizerEventScanSummary
  staffScanParticipants: number
  ticketTypeCount: number
  totalAvailableTickets: number
}

export function OrganizerEventOverviewSection({
  eventSales,
  eventScans,
  staffScanParticipants,
  ticketTypeCount,
  totalAvailableTickets,
}: OverviewProps) {
  return (
    <OrganizerEventDetailSplitSection>
      <OrganizerEventDetailSplitHeader>
        <OrganizerEventDetailSplitEyebrow>Aperçu</OrganizerEventDetailSplitEyebrow>
        <OrganizerEventDetailSplitTitle>Performance de l’évènement</OrganizerEventDetailSplitTitle>
        <OrganizerEventDetailSplitText>
          Retrouve les chiffres clés de cette fiche avant de passer aux réglages, au scan ou aux billets.
        </OrganizerEventDetailSplitText>
      </OrganizerEventDetailSplitHeader>

      <OrganizerEventDetailOverviewGrid>
        <OrganizerEventDetailOverviewStat>
          <OrganizerEventDetailOverviewStatLabel>CA total</OrganizerEventDetailOverviewStatLabel>
          <OrganizerEventDetailOverviewStatValue>
            {formatCurrencyAmount(eventSales.revenueTotal)}
          </OrganizerEventDetailOverviewStatValue>
          <OrganizerEventDetailOverviewStatHint>
            Paiements confirmés uniquement
          </OrganizerEventDetailOverviewStatHint>
        </OrganizerEventDetailOverviewStat>

        <OrganizerEventDetailOverviewStat>
          <OrganizerEventDetailOverviewStatLabel>Commandes</OrganizerEventDetailOverviewStatLabel>
          <OrganizerEventDetailOverviewStatValue>
            {eventSales.paidOrders}
          </OrganizerEventDetailOverviewStatValue>
          <OrganizerEventDetailOverviewStatHint>
            Commandes payées sur cet évènement
          </OrganizerEventDetailOverviewStatHint>
        </OrganizerEventDetailOverviewStat>

        <OrganizerEventDetailOverviewStat>
          <OrganizerEventDetailOverviewStatLabel>Billets vendus</OrganizerEventDetailOverviewStatLabel>
          <OrganizerEventDetailOverviewStatValue>
            {eventSales.ticketsSold}
          </OrganizerEventDetailOverviewStatValue>
          <OrganizerEventDetailOverviewStatHint>
            Places vendues tous types confondus
          </OrganizerEventDetailOverviewStatHint>
        </OrganizerEventDetailOverviewStat>

        <OrganizerEventDetailOverviewStat>
          <OrganizerEventDetailOverviewStatLabel>Staff scan</OrganizerEventDetailOverviewStatLabel>
          <OrganizerEventDetailOverviewStatValue>
            {staffScanParticipants}
          </OrganizerEventDetailOverviewStatValue>
          <OrganizerEventDetailOverviewStatHint>
            Membre(s) ayant participé au scan
          </OrganizerEventDetailOverviewStatHint>
        </OrganizerEventDetailOverviewStat>
      </OrganizerEventDetailOverviewGrid>

      <OrganizerEventDetailScanSummaryGrid>
        <OrganizerEventDetailScanStat>
          <OrganizerEventDetailScanStatLabel>Scans total</OrganizerEventDetailScanStatLabel>
          <OrganizerEventDetailScanStatValue>{eventScans.total}</OrganizerEventDetailScanStatValue>
        </OrganizerEventDetailScanStat>
        <OrganizerEventDetailScanStat>
          <OrganizerEventDetailScanStatLabel>Scans validés</OrganizerEventDetailScanStatLabel>
          <OrganizerEventDetailScanStatValue>{eventScans.valid}</OrganizerEventDetailScanStatValue>
        </OrganizerEventDetailScanStat>
        <OrganizerEventDetailScanStat>
          <OrganizerEventDetailScanStatLabel>Types billets</OrganizerEventDetailScanStatLabel>
          <OrganizerEventDetailScanStatValue>{ticketTypeCount}</OrganizerEventDetailScanStatValue>
        </OrganizerEventDetailScanStat>
        <OrganizerEventDetailScanStat>
          <OrganizerEventDetailScanStatLabel>Places restantes</OrganizerEventDetailScanStatLabel>
          <OrganizerEventDetailScanStatValue>{totalAvailableTickets}</OrganizerEventDetailScanStatValue>
        </OrganizerEventDetailScanStat>
      </OrganizerEventDetailScanSummaryGrid>
    </OrganizerEventDetailSplitSection>
  )
}

type BoosterProps = {
  event: OrganizerEventSummary
  isAdminReadOnly: boolean
}

export function OrganizerEventBoosterSection({ event, isAdminReadOnly }: BoosterProps) {
  return (
    <OrganizerEventDetailSplitSection>
      {isAdminReadOnly ? (
        <OrganizerEventDetailState>{ADMIN_ORGANIZER_READ_ONLY_MESSAGE}</OrganizerEventDetailState>
      ) : (
        <PromotionBoosterPanel eventId={event.id} eventStatus={event.status} />
      )}
    </OrganizerEventDetailSplitSection>
  )
}

type ScanProps = {
  scanStats: OrganizerEventScanStats | null
}

export function OrganizerEventScanSection({ scanStats }: ScanProps) {
  const scanStaffMembers = scanStats?.staffMembers ?? []

  return (
    <OrganizerEventDetailSplitSection>
      <OrganizerEventDetailSplitHeader>
        <OrganizerEventDetailSplitEyebrow>Scan</OrganizerEventDetailSplitEyebrow>
        <OrganizerEventDetailSplitTitle>Activité du staff</OrganizerEventDetailSplitTitle>
        <OrganizerEventDetailSplitText>
          Suis le nombre de scans réalisés pour cet évènement, avec le détail
          par membre du staff ou organisateur ayant utilisé le poste de scan.
        </OrganizerEventDetailSplitText>
      </OrganizerEventDetailSplitHeader>

      <OrganizerEventDetailScanSummaryGrid>
        <OrganizerEventDetailScanStat>
          <OrganizerEventDetailScanStatLabel>Total scans</OrganizerEventDetailScanStatLabel>
          <OrganizerEventDetailScanStatValue>{scanStats?.totalScans ?? 0}</OrganizerEventDetailScanStatValue>
        </OrganizerEventDetailScanStat>
        <OrganizerEventDetailScanStat>
          <OrganizerEventDetailScanStatLabel>Valides</OrganizerEventDetailScanStatLabel>
          <OrganizerEventDetailScanStatValue>{scanStats?.validScans ?? 0}</OrganizerEventDetailScanStatValue>
        </OrganizerEventDetailScanStat>
        <OrganizerEventDetailScanStat>
          <OrganizerEventDetailScanStatLabel>Déjà utilisés</OrganizerEventDetailScanStatLabel>
          <OrganizerEventDetailScanStatValue>{scanStats?.alreadyUsedScans ?? 0}</OrganizerEventDetailScanStatValue>
        </OrganizerEventDetailScanStat>
        <OrganizerEventDetailScanStat>
          <OrganizerEventDetailScanStatLabel>Invalides</OrganizerEventDetailScanStatLabel>
          <OrganizerEventDetailScanStatValue>{scanStats?.invalidScans ?? 0}</OrganizerEventDetailScanStatValue>
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
                  <OrganizerEventDetailTicketStatValue>{staffSummary.totalScans}</OrganizerEventDetailTicketStatValue>
                </OrganizerEventDetailTicketStat>
                <OrganizerEventDetailTicketStat>
                  <OrganizerEventDetailTicketStatLabel>Valides</OrganizerEventDetailTicketStatLabel>
                  <OrganizerEventDetailTicketStatValue>{staffSummary.validScans}</OrganizerEventDetailTicketStatValue>
                </OrganizerEventDetailTicketStat>
                <OrganizerEventDetailTicketStat>
                  <OrganizerEventDetailTicketStatLabel>Déjà utilisés</OrganizerEventDetailTicketStatLabel>
                  <OrganizerEventDetailTicketStatValue>{staffSummary.alreadyUsedScans}</OrganizerEventDetailTicketStatValue>
                </OrganizerEventDetailTicketStat>
                <OrganizerEventDetailTicketStat>
                  <OrganizerEventDetailTicketStatLabel>Invalides</OrganizerEventDetailTicketStatLabel>
                  <OrganizerEventDetailTicketStatValue>{staffSummary.invalidScans}</OrganizerEventDetailTicketStatValue>
                </OrganizerEventDetailTicketStat>
              </OrganizerEventDetailTicketStats>
            </OrganizerEventDetailScanStaffCard>
          ))}
        </OrganizerEventDetailScanStaffList>
      ) : (
        <OrganizerEventDetailState>
          Aucun scan n’a encore été enregistré pour cet évènement.
        </OrganizerEventDetailState>
      )}
    </OrganizerEventDetailSplitSection>
  )
}
