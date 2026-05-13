<?php

namespace App\Repository;

use App\Entity\OrderItem;
use App\Entity\TicketType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<OrderItem>
 */
class OrderItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, OrderItem::class);
    }

    public function countReservedQuantityForTicketType(TicketType $ticketType, array $reservedStatuses): int
    {
        $reservedQuantity = $this->createQueryBuilder('orderItem')
            ->select('COALESCE(SUM(orderItem.quantity), 0)')
            ->innerJoin('orderItem.customerOrder', 'customerOrder')
            ->andWhere('orderItem.ticketType = :ticketType')
            ->andWhere('customerOrder.status IN (:statuses)')
            ->setParameter('ticketType', $ticketType)
            ->setParameter('statuses', $reservedStatuses)
            ->getQuery()
            ->getSingleScalarResult();

        return (int) $reservedQuantity;
    }
}
