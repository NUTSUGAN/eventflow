<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    /**
     * @return list<User>
     */
    public function findPublicOrganizerSuggestions(string $query, int $limit = 5): array
    {
        return $this->createQueryBuilder('user')
            ->distinct()
            ->innerJoin('user.organizedEvents', 'event')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->andWhere(
                'LOWER(user.firstName) LIKE :query
                OR LOWER(user.lastName) LIKE :query
                OR LOWER(CONCAT(user.firstName, \' \', user.lastName)) LIKE :query
                OR LOWER(CONCAT(user.lastName, \' \', user.firstName)) LIKE :query'
            )
            ->setParameter('publishedStatus', 'published')
            ->setParameter('query', '%'.mb_strtolower($query).'%')
            ->orderBy('user.lastName', 'ASC')
            ->addOrderBy('user.firstName', 'ASC')
            ->setMaxResults(max(1, min(10, $limit)))
            ->getQuery()
            ->getResult()
        ;
    }

    public function findPublicOrganizerById(int $id): ?User
    {
        return $this->createQueryBuilder('user')
            ->distinct()
            ->innerJoin('user.organizedEvents', 'event')
            ->andWhere('user.id = :id')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->setParameter('id', $id)
            ->setParameter('publishedStatus', 'published')
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }

    /**
     * @return list<User>
     */
    public function findPublicOrganizers(int $limit = 5): array
    {
        return $this->createQueryBuilder('user')
            ->distinct()
            ->innerJoin('user.organizedEvents', 'event')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->andWhere(
                '(
                    (event.endDatetime IS NOT NULL AND event.endDatetime >= :publicReferenceNow)
                    OR (event.endDatetime IS NULL AND event.startDatetime IS NOT NULL AND event.startDatetime >= :publicReferenceNow)
                )'
            )
            ->setParameter('publishedStatus', 'published')
            ->setParameter('publicReferenceNow', new \DateTimeImmutable())
            ->orderBy('user.lastName', 'ASC')
            ->addOrderBy('user.firstName', 'ASC')
            ->setMaxResults(max(1, min(12, $limit)))
            ->getQuery()
            ->getResult()
        ;
    }

    public function findOneByEmailInsensitive(string $email): ?User
    {
        $normalizedEmail = mb_strtolower(trim($email));

        if ('' === $normalizedEmail) {
            return null;
        }

        /** @var User|null $user */
        $user = $this->createQueryBuilder('user')
            ->andWhere('LOWER(user.email) = :email')
            ->setParameter('email', $normalizedEmail)
            ->getQuery()
            ->getOneOrNullResult()
        ;

        return $user;
    }

    /**
     * @return list<User>
     */
    public function findForAdminList(
        ?string $query = null,
        ?string $role = null,
        bool $includeAdminAccounts = false,
    ): array
    {
        $queryBuilder = $this->createQueryBuilder('user')
            ->leftJoin('user.organizerApplication', 'organizerApplication')
            ->addSelect('organizerApplication')
            ->orderBy('user.id', 'DESC')
            ->setMaxResults(200)
        ;

        $normalizedQuery = null !== $query ? mb_strtolower(trim($query)) : '';

        if ('' !== $normalizedQuery) {
            $queryBuilder
                ->andWhere(
                    'LOWER(user.email) LIKE :query
                    OR LOWER(user.firstName) LIKE :query
                    OR LOWER(user.lastName) LIKE :query
                    OR LOWER(CONCAT(user.firstName, \' \', user.lastName)) LIKE :query
                    OR LOWER(CONCAT(user.lastName, \' \', user.firstName)) LIKE :query'
                )
                ->setParameter('query', '%'.$normalizedQuery.'%')
            ;
        }

        if (User::ROLE_CLIENT === $role) {
            $queryBuilder
                ->andWhere('user.role IN (:clientRoles)')
                ->setParameter('clientRoles', [User::ROLE_CLIENT, 'ROLE_USER'])
            ;
        } elseif (null !== $role) {
            $queryBuilder
                ->andWhere('user.role = :role')
                ->setParameter('role', $role)
            ;
        }

        if (!$includeAdminAccounts) {
            $queryBuilder
                ->andWhere('user.role NOT IN (:adminRoles)')
                ->setParameter('adminRoles', User::ADMIN_ROLES)
            ;
        }

        return $queryBuilder->getQuery()->getResult();
    }

    /**
     * @return list<User>
     */
    public function findAdminAccounts(?string $query = null): array
    {
        $queryBuilder = $this->createQueryBuilder('user')
            ->andWhere('user.role IN (:adminRoles)')
            ->setParameter('adminRoles', User::ADMIN_ROLES)
            ->orderBy('user.id', 'DESC')
            ->setMaxResults(200)
        ;

        $normalizedQuery = null !== $query ? mb_strtolower(trim($query)) : '';

        if ('' !== $normalizedQuery) {
            $queryBuilder
                ->andWhere(
                    'LOWER(user.email) LIKE :query
                    OR LOWER(user.firstName) LIKE :query
                    OR LOWER(user.lastName) LIKE :query
                    OR LOWER(CONCAT(user.firstName, \' \', user.lastName)) LIKE :query
                    OR LOWER(CONCAT(user.lastName, \' \', user.firstName)) LIKE :query'
                )
                ->setParameter('query', '%'.$normalizedQuery.'%')
            ;
        }

        return $queryBuilder->getQuery()->getResult();
    }
}
