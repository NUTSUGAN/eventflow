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
    private const STATUS_ACTIVE = 'ACTIVE';

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

    public function countActiveForOrganizer(User $organizer): int
    {
        return (int) $this->createQueryBuilder('subscription')
            ->select('COUNT(subscription.id)')
            ->andWhere('subscription.organizer = :organizer')
            ->andWhere('subscription.status = :status')
            ->setParameter('organizer', $organizer)
            ->setParameter('status', self::STATUS_ACTIVE)
            ->getQuery()
            ->getSingleScalarResult()
        ;
    }

    /**
     * @return list<int>
     */
    public function findActiveOrganizerIdsForClient(User $client): array
    {
        $rows = $this->createQueryBuilder('subscription')
            ->select('IDENTITY(subscription.organizer) AS organizerId')
            ->andWhere('subscription.client = :client')
            ->andWhere('subscription.status = :status')
            ->setParameter('client', $client)
            ->setParameter('status', self::STATUS_ACTIVE)
            ->getQuery()
            ->getArrayResult()
        ;

        return array_values(array_map(
            static fn (array $row): int => (int) ($row['organizerId'] ?? 0),
            array_filter(
                $rows,
                static fn (array $row): bool => (int) ($row['organizerId'] ?? 0) > 0,
            ),
        ));
    }
}
