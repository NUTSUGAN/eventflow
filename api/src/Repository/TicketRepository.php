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
            ->andWhere('ticket.source = :purchaseSource')
            ->setParameter('user', $user)
            ->setParameter('paidStatus', Order::STATUS_PAID)
            ->setParameter('purchaseSource', Ticket::SOURCE_PURCHASE)
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
            ->andWhere('ticket.source = :purchaseSource')
            ->setParameter('ticketId', $ticketId)
            ->setParameter('user', $user)
            ->setParameter('paidStatus', Order::STATUS_PAID)
            ->setParameter('purchaseSource', Ticket::SOURCE_PURCHASE)
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

    /**
     * @return list<Ticket>
     */
    public function findForAdminAudit(int $limit = 250): array
    {
        /** @var list<Ticket> $tickets */
        $tickets = $this->createQueryBuilder('ticket')
            ->innerJoin('ticket.customerOrder', 'customerOrder')->addSelect('customerOrder')
            ->innerJoin('customerOrder.client', 'client')->addSelect('client')
            ->leftJoin('customerOrder.payment', 'payment')->addSelect('payment')
            ->innerJoin('ticket.ticketType', 'ticketType')->addSelect('ticketType')
            ->innerJoin('ticketType.event', 'event')->addSelect('event')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->leftJoin('event.organizer', 'organizer')->addSelect('organizer')
            ->orderBy('ticket.issuedAt', 'DESC')
            ->addOrderBy('ticket.id', 'DESC')
            ->setMaxResults(max(1, min(500, $limit)))
            ->getQuery()
            ->getResult()
        ;

        return $tickets;
    }

    /**
     * @return list<Ticket>
     */
    public function findInvitationsForEvent(int $eventId): array
    {
        /** @var list<Ticket> $tickets */
        $tickets = $this->createQueryBuilder('ticket')
            ->innerJoin('ticket.customerOrder', 'customerOrder')->addSelect('customerOrder')
            ->innerJoin('ticket.ticketType', 'ticketType')->addSelect('ticketType')
            ->innerJoin('ticketType.event', 'event')->addSelect('event')
            ->leftJoin('ticket.checkins', 'checkin')->addSelect('checkin')
            ->leftJoin('checkin.staffUser', 'staffUser')->addSelect('staffUser')
            ->andWhere('event.id = :eventId')
            ->andWhere('ticket.source = :source')
            ->setParameter('eventId', $eventId)
            ->setParameter('source', Ticket::SOURCE_INVITATION)
            ->orderBy('ticket.issuedAt', 'DESC')
            ->addOrderBy('ticket.id', 'DESC')
            ->getQuery()
            ->getResult()
        ;

        return $tickets;
    }

    public function findInvitationByQrToken(string $qrToken): ?Ticket
    {
        /** @var Ticket|null $ticket */
        $ticket = $this->createQueryBuilder('ticket')
            ->innerJoin('ticket.customerOrder', 'customerOrder')->addSelect('customerOrder')
            ->innerJoin('ticket.ticketType', 'ticketType')->addSelect('ticketType')
            ->innerJoin('ticketType.event', 'event')->addSelect('event')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->andWhere('ticket.qrToken = :qrToken')
            ->andWhere('ticket.source = :source')
            ->setParameter('qrToken', trim($qrToken))
            ->setParameter('source', Ticket::SOURCE_INVITATION)
            ->getQuery()
            ->getOneOrNullResult()
        ;

        return $ticket;
    }
}
