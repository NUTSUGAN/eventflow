<?php

namespace App\Repository;

use App\Entity\PromotionCampaign;
use App\Entity\PromotionCampaignChannel;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PromotionCampaign>
 */
class PromotionCampaignRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PromotionCampaign::class);
    }

    public function countLaunchPackCampaignsOverlapping(
        \DateTimeImmutable $startsAt,
        \DateTimeImmutable $endsAt,
        ?int $excludedCampaignId = null,
    ): int {
        $queryBuilder = $this->createQueryBuilder('campaign')
            ->select('COUNT(DISTINCT campaign.id)')
            ->innerJoin('campaign.channels', 'channel')
            ->andWhere('channel.channelCode = :launchPack')
            ->andWhere('campaign.status IN (:reservedStatuses)')
            ->andWhere('campaign.startsAt < :endsAt')
            ->andWhere('campaign.endsAt > :startsAt')
            ->setParameter('launchPack', PromotionCampaignChannel::CHANNEL_LAUNCH_PACK)
            ->setParameter('reservedStatuses', [
                PromotionCampaign::STATUS_APPROVED,
                PromotionCampaign::STATUS_ACTIVE,
            ])
            ->setParameter('startsAt', $startsAt)
            ->setParameter('endsAt', $endsAt)
        ;

        if (null !== $excludedCampaignId) {
            $queryBuilder
                ->andWhere('campaign.id != :excludedCampaignId')
                ->setParameter('excludedCampaignId', $excludedCampaignId)
            ;
        }

        return (int) $queryBuilder->getQuery()
            ->getSingleScalarResult()
        ;
    }

    /**
     * @return list<PromotionCampaign>
     */
    public function findForOrganizer(int $organizerId, int $limit, int $offset): array
    {
        return $this->createQueryBuilder('campaign')
            ->distinct()
            ->leftJoin('campaign.event', 'event')->addSelect('event')
            ->leftJoin('campaign.channels', 'channel')->addSelect('channel')
            ->leftJoin('campaign.metrics', 'metric')->addSelect('metric')
            ->andWhere('campaign.organizer = :organizerId')
            ->setParameter('organizerId', $organizerId)
            ->orderBy('campaign.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult()
        ;
    }

    public function countForOrganizer(int $organizerId): int
    {
        return (int) $this->createQueryBuilder('campaign')
            ->select('COUNT(campaign.id)')
            ->andWhere('campaign.organizer = :organizerId')
            ->setParameter('organizerId', $organizerId)
            ->getQuery()
            ->getSingleScalarResult()
        ;
    }

    /**
     * @return list<PromotionCampaign>
     */
    public function findForAdmin(?string $status, int $limit, int $offset): array
    {
        $queryBuilder = $this->createQueryBuilder('campaign')
            ->distinct()
            ->leftJoin('campaign.event', 'event')->addSelect('event')
            ->leftJoin('campaign.organizer', 'organizer')->addSelect('organizer')
            ->leftJoin('campaign.channels', 'channel')->addSelect('channel')
            ->leftJoin('campaign.metrics', 'metric')->addSelect('metric')
            ->orderBy('campaign.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
        ;

        if (is_string($status) && in_array($status, PromotionCampaign::STATUSES, true)) {
            $queryBuilder
                ->andWhere('campaign.status = :status')
                ->setParameter('status', $status)
            ;
        }

        return $queryBuilder->getQuery()->getResult();
    }

    public function countForAdmin(?string $status): int
    {
        $queryBuilder = $this->createQueryBuilder('campaign')
            ->select('COUNT(campaign.id)')
        ;

        if (is_string($status) && in_array($status, PromotionCampaign::STATUSES, true)) {
            $queryBuilder
                ->andWhere('campaign.status = :status')
                ->setParameter('status', $status)
            ;
        }

        return (int) $queryBuilder->getQuery()->getSingleScalarResult();
    }

    /**
     * @return list<PromotionCampaign>
     */
    public function findActiveCampaignsToExpire(\DateTimeImmutable $now): array
    {
        return $this->createQueryBuilder('campaign')
            ->distinct()
            ->leftJoin('campaign.channels', 'channel')->addSelect('channel')
            ->leftJoin('campaign.metrics', 'metric')->addSelect('metric')
            ->andWhere('campaign.status = :active')
            ->andWhere('campaign.endsAt < :now')
            ->setParameter('active', PromotionCampaign::STATUS_ACTIVE)
            ->setParameter('now', $now)
            ->getQuery()
            ->getResult()
        ;
    }

    /**
     * @return list<PromotionCampaign>
     */
    public function findActiveLaunchPackCampaigns(
        \DateTimeImmutable $now,
        int $limit = 3,
    ): array {
        return $this->createQueryBuilder('campaign')
            ->distinct()
            ->innerJoin('campaign.channels', 'channel')
            ->addSelect('channel')
            ->andWhere('campaign.status = :activeStatus')
            ->andWhere('campaign.startsAt <= :now')
            ->andWhere('campaign.endsAt >= :now')
            ->andWhere('channel.channelCode = :launchPack')
            ->setParameter('activeStatus', PromotionCampaign::STATUS_ACTIVE)
            ->setParameter('now', $now)
            ->setParameter('launchPack', PromotionCampaignChannel::CHANNEL_LAUNCH_PACK)
            ->orderBy('campaign.startsAt', 'ASC')
            ->addOrderBy('campaign.id', 'ASC')
            ->setMaxResults(max(1, min(3, $limit)))
            ->getQuery()
            ->getResult()
        ;
    }
}
