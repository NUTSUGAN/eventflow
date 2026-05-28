<?php

namespace App\Repository;

use App\Entity\OrganizerStaffMember;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<OrganizerStaffMember>
 */
class OrganizerStaffMemberRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, OrganizerStaffMember::class);
    }

    /**
     * @return list<OrganizerStaffMember>
     */
    public function findForOrganizer(User $organizer): array
    {
        /** @var list<OrganizerStaffMember> $memberships */
        $memberships = $this->createQueryBuilder('membership')
            ->innerJoin('membership.staffUser', 'staffUser')->addSelect('staffUser')
            ->andWhere('membership.organizer = :organizer')
            ->setParameter('organizer', $organizer)
            ->addOrderBy('membership.status', 'ASC')
            ->addOrderBy('membership.statusChangedAt', 'DESC')
            ->addOrderBy('membership.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $memberships;
    }

    public function countActiveForOrganizer(User $organizer): int
    {
        return (int) $this->createQueryBuilder('membership')
            ->select('COUNT(membership.id)')
            ->andWhere('membership.organizer = :organizer')
            ->andWhere('membership.status = :activeStatus')
            ->setParameter('organizer', $organizer)
            ->setParameter('activeStatus', OrganizerStaffMember::STATUS_ACTIVE)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findOneForOrganizerAndStaffUser(User $organizer, User $staffUser): ?OrganizerStaffMember
    {
        /** @var OrganizerStaffMember|null $membership */
        $membership = $this->createQueryBuilder('membership')
            ->andWhere('membership.organizer = :organizer')
            ->andWhere('membership.staffUser = :staffUser')
            ->setParameter('organizer', $organizer)
            ->setParameter('staffUser', $staffUser)
            ->getQuery()
            ->getOneOrNullResult();

        return $membership;
    }

    public function findOneForOrganizerById(User $organizer, int $membershipId): ?OrganizerStaffMember
    {
        /** @var OrganizerStaffMember|null $membership */
        $membership = $this->createQueryBuilder('membership')
            ->innerJoin('membership.staffUser', 'staffUser')->addSelect('staffUser')
            ->andWhere('membership.organizer = :organizer')
            ->andWhere('membership.id = :membershipId')
            ->setParameter('organizer', $organizer)
            ->setParameter('membershipId', $membershipId)
            ->getQuery()
            ->getOneOrNullResult();

        return $membership;
    }

    public function isActiveStaffMemberForOrganizer(User $staffUser, User $organizer): bool
    {
        return null !== $this->createQueryBuilder('membership')
            ->select('membership.id')
            ->andWhere('membership.organizer = :organizer')
            ->andWhere('membership.staffUser = :staffUser')
            ->andWhere('membership.status = :activeStatus')
            ->setParameter('organizer', $organizer)
            ->setParameter('staffUser', $staffUser)
            ->setParameter('activeStatus', OrganizerStaffMember::STATUS_ACTIVE)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @return list<int>
     */
    public function findOrganizerIdsForStaffUser(User $staffUser): array
    {
        $rows = $this->createQueryBuilder('membership')
            ->select('IDENTITY(membership.organizer) AS organizerId')
            ->andWhere('membership.staffUser = :staffUser')
            ->andWhere('membership.status = :activeStatus')
            ->setParameter('staffUser', $staffUser)
            ->setParameter('activeStatus', OrganizerStaffMember::STATUS_ACTIVE)
            ->getQuery()
            ->getArrayResult();

        return array_values(array_map(
            static fn (array $row): int => (int) $row['organizerId'],
            $rows,
        ));
    }
}
