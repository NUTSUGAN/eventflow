<?php

namespace App\Repository;

use App\Entity\PromotionChannelRate;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PromotionChannelRate>
 */
final class PromotionChannelRateRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PromotionChannelRate::class);
    }

    /**
     * @return list<PromotionChannelRate>
     */
    public function findActiveCatalog(): array
    {
        return $this->createQueryBuilder('rate')
            ->andWhere('rate.isActive = true')
            ->orderBy('rate.channelCode', 'ASC')
            ->addOrderBy('rate.duration', 'ASC')
            ->getQuery()
            ->getResult()
        ;
    }

    public function findActiveRate(string $channelCode, string $duration): ?PromotionChannelRate
    {
        return $this->findOneBy([
            'channelCode' => strtoupper(trim($channelCode)),
            'duration' => strtolower(trim($duration)),
            'isActive' => true,
        ]);
    }
}
