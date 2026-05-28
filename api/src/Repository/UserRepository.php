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
}
