<?php

namespace App\Repository;

use App\Entity\AdminAuditLog;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AdminAuditLog>
 */
class AdminAuditLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AdminAuditLog::class);
    }

    /**
     * @return list<AdminAuditLog>
     */
    public function findForAdminHistory(
        ?string $actor = null,
        ?string $actorRole = null,
        ?string $action = null,
        ?string $resourceType = null,
        ?\DateTimeImmutable $from = null,
        ?\DateTimeImmutable $to = null,
    ): array {
        $queryBuilder = $this->createQueryBuilder('log')
            ->leftJoin('log.actor', 'actor')->addSelect('actor')
            ->orderBy('log.createdAt', 'DESC')
            ->setMaxResults(250)
        ;

        $normalizedActor = null !== $actor ? mb_strtolower(trim($actor)) : '';
        if ('' !== $normalizedActor) {
            $queryBuilder
                ->andWhere('LOWER(log.actorEmail) LIKE :actor OR LOWER(actor.firstName) LIKE :actor OR LOWER(actor.lastName) LIKE :actor')
                ->setParameter('actor', '%'.$normalizedActor.'%')
            ;
        }

        if (null !== $actorRole && '' !== trim($actorRole)) {
            $queryBuilder
                ->andWhere('log.actorRole = :actorRole')
                ->setParameter('actorRole', trim($actorRole))
            ;
        }

        if (null !== $action && '' !== trim($action)) {
            $queryBuilder
                ->andWhere('log.action = :action')
                ->setParameter('action', trim($action))
            ;
        }

        if (null !== $resourceType && '' !== trim($resourceType)) {
            $queryBuilder
                ->andWhere('log.resourceType = :resourceType')
                ->setParameter('resourceType', trim($resourceType))
            ;
        }

        if ($from instanceof \DateTimeImmutable) {
            $queryBuilder
                ->andWhere('log.createdAt >= :fromDate')
                ->setParameter('fromDate', $from)
            ;
        }

        if ($to instanceof \DateTimeImmutable) {
            $queryBuilder
                ->andWhere('log.createdAt <= :toDate')
                ->setParameter('toDate', $to)
            ;
        }

        return $queryBuilder->getQuery()->getResult();
    }
}
