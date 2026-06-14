<?php

namespace App\Repository;

use App\Entity\PromotionCampaignChannel;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PromotionCampaignChannel>
 */
class PromotionCampaignChannelRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PromotionCampaignChannel::class);
    }

    /**
     * @return list<PromotionCampaignChannel>
     */
    public function findPendingDeliveryByChannel(string $channelCode): array
    {
        return $this->createQueryBuilder('channel')
            ->innerJoin('channel.campaign', 'campaign')
            ->addSelect('campaign')
            ->andWhere('channel.channelCode = :channelCode')
            ->andWhere('channel.deliveryStatus IN (:deliveryStatuses)')
            ->andWhere('campaign.status IN (:campaignStatuses)')
            ->setParameter('channelCode', strtoupper(trim($channelCode)))
            ->setParameter('deliveryStatuses', [
                PromotionCampaignChannel::DELIVERY_PENDING,
                PromotionCampaignChannel::DELIVERY_SCHEDULED,
            ])
            ->setParameter('campaignStatuses', [
                \App\Entity\PromotionCampaign::STATUS_APPROVED,
                \App\Entity\PromotionCampaign::STATUS_ACTIVE,
            ])
            ->orderBy('campaign.startsAt', 'ASC')
            ->getQuery()
            ->getResult()
        ;
    }
}
