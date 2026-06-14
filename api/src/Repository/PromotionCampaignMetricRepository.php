<?php

namespace App\Repository;

use App\Entity\PromotionCampaign;
use App\Entity\PromotionCampaignMetric;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PromotionCampaignMetric>
 */
final class PromotionCampaignMetricRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PromotionCampaignMetric::class);
    }

    public function findOneForCampaignAndPlacement(
        PromotionCampaign $campaign,
        string $placement,
    ): ?PromotionCampaignMetric {
        return $this->findOneBy([
            'campaign' => $campaign,
            'placement' => strtolower(trim($placement)),
        ]);
    }
}
