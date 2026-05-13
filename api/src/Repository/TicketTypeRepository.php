<?php

namespace App\Repository;

use App\Entity\TicketType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<TicketType>
 */
class TicketTypeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TicketType::class);
    }

    /**
     * @return list<TicketType>
     */
    public function findActiveForEventOrdered(int $eventId): array
    {
        $now = new \DateTimeImmutable();

        return $this->createQueryBuilder('ticketType')
            ->andWhere('ticketType.event = :eventId')
            ->andWhere('ticketType.isActive = true')
            ->andWhere('ticketType.salesStartAt <= :now')
            ->andWhere('ticketType.salesEndAt >= :now')
            ->setParameter('eventId', $eventId)
            ->setParameter('now', $now)
            ->orderBy('ticketType.salesStartAt', 'ASC')
            ->addOrderBy('ticketType.salesEndAt', 'ASC')
            ->addOrderBy('ticketType.id', 'ASC')
            ->getQuery()
            ->getResult()
        ;
    }
}
