<?php

namespace App\Repository;

use App\Entity\PasswordResetRequest;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PasswordResetRequest>
 */
class PasswordResetRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PasswordResetRequest::class);
    }

    public function findActiveByToken(string $rawToken, \DateTimeImmutable $now): ?PasswordResetRequest
    {
        return $this->createQueryBuilder('passwordResetRequest')
            ->andWhere('passwordResetRequest.tokenHash = :tokenHash')
            ->andWhere('passwordResetRequest.usedAt IS NULL')
            ->andWhere('passwordResetRequest.expiresAt > :now')
            ->setParameter('tokenHash', hash('sha256', $rawToken))
            ->setParameter('now', $now)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }

    public function markActiveRequestsAsUsedForUser(User $user, \DateTimeImmutable $now): void
    {
        $this->createQueryBuilder('passwordResetRequest')
            ->update()
            ->set('passwordResetRequest.usedAt', ':usedAt')
            ->andWhere('passwordResetRequest.user = :user')
            ->andWhere('passwordResetRequest.usedAt IS NULL')
            ->setParameter('usedAt', $now)
            ->setParameter('user', $user)
            ->getQuery()
            ->execute()
        ;
    }
}
