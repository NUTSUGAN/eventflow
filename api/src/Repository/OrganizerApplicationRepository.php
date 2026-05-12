<?php

namespace App\Repository;

use App\Entity\OrganizerApplication;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<OrganizerApplication>
 */
class OrganizerApplicationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, OrganizerApplication::class);
    }

    public function findOneForUser(User $user): ?OrganizerApplication
    {
        return $this->createQueryBuilder('application')
            ->leftJoin('application.user', 'user')->addSelect('user')
            ->andWhere('application.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }

    /**
     * @return list<OrganizerApplication>
     */
    public function findForAdminReview(): array
    {
        return $this->createQueryBuilder('application')
            ->leftJoin('application.user', 'user')->addSelect('user')
            ->orderBy(
                "CASE application.status
                    WHEN 'PENDING' THEN 0
                    WHEN 'REJECTED' THEN 1
                    ELSE 2
                END",
                'ASC'
            )
            ->addOrderBy('application.submittedAt', 'DESC')
            ->getQuery()
            ->getResult()
        ;
    }
}
