<?php

namespace App\Repository;

use App\Entity\Order;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Order>
 */
class OrderRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Order::class);
    }

    /**
     * @return list<Order>
     */
    public function findPaidOrdersForUser(User $user): array
    {
        /** @var list<Order> $orders */
        $orders = $this->createQueryBuilder('customerOrder')
            ->leftJoin('customerOrder.payment', 'payment')->addSelect('payment')
            ->leftJoin('customerOrder.tickets', 'tickets')->addSelect('tickets')
            ->leftJoin('customerOrder.orderItems', 'orderItems')->addSelect('orderItems')
            ->leftJoin('orderItems.ticketType', 'ticketType')->addSelect('ticketType')
            ->leftJoin('ticketType.event', 'event')->addSelect('event')
            ->leftJoin('event.organizer', 'organizer')->addSelect('organizer')
            ->leftJoin('customerOrder.promotionCampaign', 'promotionCampaign')->addSelect('promotionCampaign')
            ->leftJoin('promotionCampaign.event', 'promotionEvent')->addSelect('promotionEvent')
            ->andWhere('customerOrder.client = :user')
            ->andWhere('customerOrder.status = :paidStatus')
            ->setParameter('user', $user)
            ->setParameter('paidStatus', Order::STATUS_PAID)
            ->orderBy('customerOrder.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $orders;
    }

    /**
     * @return list<Order>
     */
    public function findPendingPaymentOrdersForUser(User $user): array
    {
        /** @var list<Order> $orders */
        $orders = $this->createQueryBuilder('customerOrder')
            ->leftJoin('customerOrder.payment', 'payment')->addSelect('payment')
            ->leftJoin('customerOrder.orderItems', 'orderItems')->addSelect('orderItems')
            ->leftJoin('orderItems.ticketType', 'ticketType')->addSelect('ticketType')
            ->leftJoin('ticketType.event', 'event')->addSelect('event')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->andWhere('customerOrder.client = :user')
            ->andWhere('customerOrder.status IN (:statuses)')
            ->setParameter('user', $user)
            ->setParameter('statuses', [
                Order::STATUS_PENDING_PAYMENT,
                Order::STATUS_EXPIRED,
            ])
            ->orderBy('customerOrder.createdAt', 'DESC')
            ->addOrderBy('customerOrder.id', 'DESC')
            ->getQuery()
            ->getResult();

        return $orders;
    }

    /**
     * @return list<Order>
     */
    public function findForAdminList(int $limit = 200): array
    {
        /** @var list<Order> $orders */
        $orders = $this->createQueryBuilder('customerOrder')
            ->innerJoin('customerOrder.client', 'client')->addSelect('client')
            ->leftJoin('customerOrder.payment', 'payment')->addSelect('payment')
            ->leftJoin('customerOrder.tickets', 'tickets')->addSelect('tickets')
            ->leftJoin('customerOrder.orderItems', 'orderItems')->addSelect('orderItems')
            ->leftJoin('orderItems.ticketType', 'ticketType')->addSelect('ticketType')
            ->leftJoin('ticketType.event', 'event')->addSelect('event')
            ->orderBy('customerOrder.createdAt', 'DESC')
            ->addOrderBy('customerOrder.id', 'DESC')
            ->setMaxResults(max(1, min(500, $limit)))
            ->getQuery()
            ->getResult()
        ;

        return $orders;
    }
}
