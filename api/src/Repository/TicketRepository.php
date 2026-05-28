<?php

namespace App\Repository;

use App\Entity\Order;
use App\Entity\Ticket;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Ticket>
 */
class TicketRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Ticket::class);
    }

    /**
     * @return list<Ticket>
     */
    public function findPaidTicketsForUser(User $user): array
    {
        /** @var list<Ticket> $tickets */
        $tickets = $this->createQueryBuilder('ticket')
            ->innerJoin('ticket.customerOrder', 'customerOrder')->addSelect('customerOrder')
            ->leftJoin('customerOrder.payment', 'payment')->addSelect('payment')
            ->leftJoin('customerOrder.orderItems', 'orderItems')->addSelect('orderItems')
            ->leftJoin('orderItems.ticketType', 'orderItemTicketType')->addSelect('orderItemTicketType')
            ->innerJoin('ticket.ticketType', 'ticketType')->addSelect('ticketType')
            ->innerJoin('ticketType.event', 'event')->addSelect('event')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->andWhere('customerOrder.client = :user')
            ->andWhere('customerOrder.status = :paidStatus')
            ->setParameter('user', $user)
            ->setParameter('paidStatus', Order::STATUS_PAID)
            ->orderBy('event.startDatetime', 'ASC')
            ->addOrderBy('ticket.id', 'ASC')
            ->getQuery()
            ->getResult();

        return $tickets;
    }

    public function findPaidTicketForUserById(User $user, int $ticketId): ?Ticket
    {
        /** @var Ticket|null $ticket */
        $ticket = $this->createQueryBuilder('ticket')
            ->innerJoin('ticket.customerOrder', 'customerOrder')->addSelect('customerOrder')
            ->leftJoin('customerOrder.payment', 'payment')->addSelect('payment')
            ->leftJoin('customerOrder.orderItems', 'orderItems')->addSelect('orderItems')
            ->leftJoin('orderItems.ticketType', 'orderItemTicketType')->addSelect('orderItemTicketType')
            ->innerJoin('ticket.ticketType', 'ticketType')->addSelect('ticketType')
            ->innerJoin('ticketType.event', 'event')->addSelect('event')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->andWhere('ticket.id = :ticketId')
            ->andWhere('customerOrder.client = :user')
            ->andWhere('customerOrder.status = :paidStatus')
            ->setParameter('ticketId', $ticketId)
            ->setParameter('user', $user)
            ->setParameter('paidStatus', Order::STATUS_PAID)
            ->getQuery()
            ->getOneOrNullResult();

        return $ticket;
    }

    public function findOneForCheckinByQrToken(string $qrToken): ?Ticket
    {
        /** @var Ticket|null $ticket */
        $ticket = $this->createQueryBuilder('ticket')
            ->innerJoin('ticket.customerOrder', 'customerOrder')->addSelect('customerOrder')
            ->leftJoin('customerOrder.payment', 'payment')->addSelect('payment')
            ->innerJoin('customerOrder.client', 'client')->addSelect('client')
            ->innerJoin('ticket.ticketType', 'ticketType')->addSelect('ticketType')
            ->innerJoin('ticketType.event', 'event')->addSelect('event')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->leftJoin('event.organizer', 'organizer')->addSelect('organizer')
            ->andWhere('ticket.qrToken = :qrToken')
            ->setParameter('qrToken', trim($qrToken))
            ->getQuery()
            ->getOneOrNullResult()
        ;

        return $ticket;
    }
}
