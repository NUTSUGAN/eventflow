<?php

namespace App\Repository;

use App\Entity\EmailChangeRequest;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<EmailChangeRequest>
 */
class EmailChangeRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EmailChangeRequest::class);
    }

    public function findActiveByToken(string $rawToken, \DateTimeImmutable $now): ?EmailChangeRequest
    {
        /** @var EmailChangeRequest|null $emailChangeRequest */
        $emailChangeRequest = $this->createQueryBuilder('emailChangeRequest')
            ->andWhere('emailChangeRequest.tokenHash = :tokenHash')
            ->andWhere('emailChangeRequest.usedAt IS NULL')
            ->andWhere('emailChangeRequest.expiresAt > :now')
            ->setParameter('tokenHash', hash('sha256', $rawToken))
            ->setParameter('now', $now)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $emailChangeRequest;
    }

    public function markActiveRequestsAsUsedForUser(User $user, \DateTimeImmutable $now): void
    {
        $this->createQueryBuilder('emailChangeRequest')
            ->update()
            ->set('emailChangeRequest.usedAt', ':usedAt')
            ->andWhere('emailChangeRequest.user = :user')
            ->andWhere('emailChangeRequest.usedAt IS NULL')
            ->andWhere('emailChangeRequest.expiresAt > :now')
            ->setParameter('user', $user)
            ->setParameter('usedAt', $now)
            ->setParameter('now', $now)
            ->getQuery()
            ->execute();
    }
}
