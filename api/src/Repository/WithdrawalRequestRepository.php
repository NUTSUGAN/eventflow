<?php

namespace App\Repository;

use App\Entity\Event;
use App\Entity\User;
use App\Entity\WithdrawalRequest;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<WithdrawalRequest>
 */
class WithdrawalRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, WithdrawalRequest::class);
    }

    /**
     * @return list<WithdrawalRequest>
     */
    public function findForOrganizer(User $organizer): array
    {
        return $this->createQueryBuilder('withdrawal')
            ->innerJoin('withdrawal.event', 'event')->addSelect('event')
            ->innerJoin('withdrawal.organizer', 'organizer')->addSelect('organizer')
            ->andWhere('withdrawal.organizer = :organizer')
            ->setParameter('organizer', $organizer)
            ->orderBy('withdrawal.requestedAt', 'DESC')
            ->getQuery()
            ->getResult()
        ;
    }

    /**
     * @return list<WithdrawalRequest>
     */
    public function findForAdmin(?string $status = null): array
    {
        $queryBuilder = $this->createQueryBuilder('withdrawal')
            ->innerJoin('withdrawal.event', 'event')->addSelect('event')
            ->innerJoin('withdrawal.organizer', 'organizer')->addSelect('organizer')
            ->leftJoin('withdrawal.reviewedBy', 'reviewer')->addSelect('reviewer')
            ->orderBy('withdrawal.requestedAt', 'DESC')
        ;

        if (null !== $status) {
            $queryBuilder
                ->andWhere('withdrawal.status = :status')
                ->setParameter('status', $status)
            ;
        }

        return $queryBuilder->getQuery()->getResult();
    }

    public function findLatestForEvent(Event $event): ?WithdrawalRequest
    {
        return $this->createQueryBuilder('withdrawal')
            ->andWhere('withdrawal.event = :event')
            ->setParameter('event', $event)
            ->orderBy('withdrawal.requestedAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }

    public function hasBlockingRequestForEvent(Event $event): bool
    {
        $count = (int) $this->createQueryBuilder('withdrawal')
            ->select('COUNT(withdrawal.id)')
            ->andWhere('withdrawal.event = :event')
            ->andWhere('withdrawal.status IN (:statuses)')
            ->setParameter('event', $event)
            ->setParameter('statuses', [
                WithdrawalRequest::STATUS_PENDING,
                WithdrawalRequest::STATUS_APPROVED,
                WithdrawalRequest::STATUS_PAID,
            ])
            ->getQuery()
            ->getSingleScalarResult()
        ;

        return $count > 0;
    }
}
