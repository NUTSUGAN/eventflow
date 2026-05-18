<?php

namespace App\Repository;

use App\Entity\Event;
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
        return $this->createQueryBuilder('ticketType')
            ->andWhere('ticketType.event = :eventId')
            ->andWhere('ticketType.isActive = true')
            ->setParameter('eventId', $eventId)
            ->orderBy('ticketType.salesStartAt', 'ASC')
            ->addOrderBy('ticketType.salesEndAt', 'ASC')
            ->addOrderBy('ticketType.id', 'ASC')
            ->getQuery()
            ->getResult()
        ;
    }

    public function sumStockForEvent(Event $event, ?int $excludeTicketTypeId = null): int
    {
        $queryBuilder = $this->createQueryBuilder('ticketType')
            ->select('COALESCE(SUM(ticketType.stock), 0)')
            ->andWhere('ticketType.event = :event')
            ->setParameter('event', $event);

        if (null !== $excludeTicketTypeId) {
            $queryBuilder
                ->andWhere('ticketType.id != :excludeTicketTypeId')
                ->setParameter('excludeTicketTypeId', $excludeTicketTypeId);
        }

        return (int) $queryBuilder->getQuery()->getSingleScalarResult();
    }
}
