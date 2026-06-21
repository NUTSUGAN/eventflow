<?php

namespace App\Repository;

use App\Entity\OrganizerPayoutAccount;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<OrganizerPayoutAccount>
 */
class OrganizerPayoutAccountRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, OrganizerPayoutAccount::class);
    }

    public function findActiveForOrganizer(User $organizer): ?OrganizerPayoutAccount
    {
        return $this->createQueryBuilder('payoutAccount')
            ->andWhere('payoutAccount.organizer = :organizer')
            ->andWhere('payoutAccount.isActive = true')
            ->setParameter('organizer', $organizer)
            ->orderBy('payoutAccount.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }

    /**
     * @return list<OrganizerPayoutAccount>
     */
    public function findInactiveHistoryForOrganizer(User $organizer): array
    {
        return $this->createQueryBuilder('payoutAccount')
            ->andWhere('payoutAccount.organizer = :organizer')
            ->andWhere('payoutAccount.isActive = false')
            ->setParameter('organizer', $organizer)
            ->orderBy('payoutAccount.createdAt', 'DESC')
            ->getQuery()
            ->getResult()
        ;
    }
}
