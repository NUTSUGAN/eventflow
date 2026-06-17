<?php

namespace App\Service;

use App\Entity\PromotionCampaign;
use App\Entity\PromotionCampaignChannel;
use App\Entity\PromotionCampaignMetric;
use App\Repository\PromotionCampaignRepository;

final class PromotionCampaignService
{
    public const LAUNCH_PACK_CAPACITY = 3;

    public function __construct(
        private readonly PromotionCampaignRepository $campaignRepository,
    ) {
    }

    public function calculateEnd(\DateTimeImmutable $startsAt, string $duration): \DateTimeImmutable
    {
        return match ($duration) {
            PromotionCampaign::DURATION_7_DAYS => $startsAt->modify('+7 days'),
            PromotionCampaign::DURATION_14_DAYS => $startsAt->modify('+14 days'),
            PromotionCampaign::DURATION_30_DAYS => $startsAt->modify('+30 days'),
            default => throw new \InvalidArgumentException('Durée de promotion invalide.'),
        };
    }

    public function isLaunchPackAvailable(
        \DateTimeImmutable $startsAt,
        \DateTimeImmutable $endsAt,
        ?int $excludedCampaignId = null,
    ): bool {
        return $this->campaignRepository->countLaunchPackCampaignsOverlapping(
            $startsAt,
            $endsAt,
            $excludedCampaignId,
        ) < self::LAUNCH_PACK_CAPACITY;
    }

    public function assertLaunchPackAvailable(PromotionCampaign $campaign): void
    {
        if (!$campaign->hasChannel(PromotionCampaignChannel::CHANNEL_LAUNCH_PACK)) {
            return;
        }

        $startsAt = $campaign->getStartsAt();
        $endsAt = $campaign->getEndsAt();

        if (!$startsAt instanceof \DateTimeImmutable || !$endsAt instanceof \DateTimeImmutable) {
            throw new \LogicException('Le calendrier de la campagne est incomplet.');
        }

        if (!$this->isLaunchPackAvailable($startsAt, $endsAt, $campaign->getId())) {
            throw new \LogicException('Les 3 emplacements Pack Lancement sont déjà réservés sur cette période.');
        }
    }

    public function activatePaidCampaign(PromotionCampaign $campaign, string $stripeSessionId): void
    {
        if (PromotionCampaign::STATUS_ACTIVE === $campaign->getStatus() && null !== $campaign->getPaidAt()) {
            return;
        }

        if (PromotionCampaign::STATUS_APPROVED !== $campaign->getStatus()) {
            throw new \LogicException('Seule une campagne approuvée peut être activee apres paiement.');
        }

        $now = new \DateTimeImmutable();
        $duration = $campaign->getDuration();

        if (!is_string($duration)) {
            throw new \LogicException('La durée de la campagne est absente.');
        }

        $campaign
            ->setStatus(PromotionCampaign::STATUS_ACTIVE)
            ->setPaidAt($now)
            ->setStripeSessionId($stripeSessionId)
            ->setStartsAt($now)
            ->setEndsAt($this->calculateEnd($now, $duration))
            ->setUpdatedAt($now)
        ;

        foreach ($campaign->getChannels() as $channel) {
            $channel
                ->setDeliveryStatus(PromotionCampaignChannel::DELIVERY_SCHEDULED)
                ->setIsFeatured(false)
                ->setScheduledAt($now)
                ->setUpdatedAt($now)
            ;
        }

        $this->initializeMetrics($campaign);
    }

    /**
     * @return array<string, mixed>
     */
    public function serialize(PromotionCampaign $campaign): array
    {
        $event = $campaign->getEvent();
        $organizer = $campaign->getOrganizer();
        $impressions = 0;
        $clicks = 0;
        $channels = [];
        $breakdown = [];

        foreach ($campaign->getChannels() as $channel) {
            $channels[] = [
                'id' => $channel->getId(),
                'channelCode' => $channel->getChannelCode(),
                'priceAmount' => $channel->getPriceAmount(),
                'deliveryStatus' => $channel->getDeliveryStatus(),
                'isFeatured' => $channel->isFeatured(),
                'adminBrief' => $channel->getAdminBrief(),
                'scheduledAt' => $channel->getScheduledAt()?->format(DATE_ATOM),
                'deliveredAt' => $channel->getDeliveredAt()?->format(DATE_ATOM),
                'impressions' => $channel->getImpressions(),
                'clicks' => $channel->getClicks(),
                'ctr' => $channel->getClickThroughRate(),
            ];
        }

        foreach ($campaign->getMetrics() as $metric) {
            $placement = $metric->getPlacement();

            if (!is_string($placement)) {
                continue;
            }

            $impressions += $metric->getImpressions();
            $clicks += $metric->getClicks();
            $breakdown[] = [
                'placement' => $placement,
                'impressions' => $metric->getImpressions(),
                'clicks' => $metric->getClicks(),
                'ctr' => $metric->getClickThroughRate(),
            ];
        }

        return [
            'id' => $campaign->getId(),
            'event' => [
                'id' => $event?->getId(),
                'title' => $event?->getTitle(),
                'status' => $event?->getStatus(),
            ],
            'organizer' => [
                'id' => $organizer?->getId(),
                'firstName' => $organizer?->getFirstName(),
                'lastName' => $organizer?->getLastName(),
                'email' => $organizer?->getEmail(),
            ],
            'status' => $campaign->getStatus(),
            'duration' => $campaign->getDuration(),
            'startsAt' => $campaign->getStartsAt()?->format(DATE_ATOM),
            'endsAt' => $campaign->getEndsAt()?->format(DATE_ATOM),
            'totalPrice' => $campaign->getTotalPrice(),
            'currency' => $campaign->getCurrency(),
            'adminComment' => $campaign->getAdminComment(),
            'approvedAt' => $campaign->getApprovedAt()?->format(DATE_ATOM),
            'rejectedAt' => $campaign->getRejectedAt()?->format(DATE_ATOM),
            'paidAt' => $campaign->getPaidAt()?->format(DATE_ATOM),
            'createdAt' => $campaign->getCreatedAt()->format(DATE_ATOM),
            'channels' => $channels,
            'stats' => [
                'impressions' => $impressions,
                'clicks' => $clicks,
                'ctr' => $impressions > 0 ? round(($clicks / $impressions) * 100, 2) : 0.0,
                'breakdown' => $breakdown,
            ],
            'canPay' => PromotionCampaign::STATUS_APPROVED === $campaign->getStatus()
                && null === $campaign->getPaidAt(),
        ];
    }

    private function initializeMetrics(PromotionCampaign $campaign): void
    {
        $placements = [PromotionCampaignMetric::PLACEMENT_DETAIL];

        if ($campaign->hasChannel(PromotionCampaignChannel::CHANNEL_LAUNCH_PACK)) {
            $placements[] = PromotionCampaignMetric::PLACEMENT_HOMEPAGE;
            $placements[] = PromotionCampaignMetric::PLACEMENT_EXPLORER;
        }

        if ($campaign->hasChannel(PromotionCampaignChannel::CHANNEL_NEWSLETTER)) {
            $placements[] = PromotionCampaignMetric::PLACEMENT_NEWSLETTER;
        }

        if ($campaign->hasChannel(PromotionCampaignChannel::CHANNEL_SOCIAL_INFLUENCER)) {
            $placements[] = PromotionCampaignMetric::PLACEMENT_SOCIAL;
        }

        $existingPlacements = [];

        foreach ($campaign->getMetrics() as $metric) {
            if (is_string($metric->getPlacement())) {
                $existingPlacements[] = $metric->getPlacement();
            }
        }

        foreach (array_unique($placements) as $placement) {
            if (in_array($placement, $existingPlacements, true)) {
                continue;
            }

            $campaign->addMetric(
                (new PromotionCampaignMetric())->setPlacement($placement)
            );
        }
    }
}
