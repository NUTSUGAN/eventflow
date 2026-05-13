<?php

namespace App\Repository;

use App\Entity\AbonnementOrganisateur;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AbonnementOrganisateur>
 */
class AbonnementOrganisateurRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AbonnementOrganisateur::class);
    }

    public function findOneForClientAndOrganizer(User $client, User $organizer): ?AbonnementOrganisateur
    {
        return $this->createQueryBuilder('subscription')
            ->andWhere('subscription.client = :client')
            ->andWhere('subscription.organizer = :organizer')
            ->setParameter('client', $client)
            ->setParameter('organizer', $organizer)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
}
