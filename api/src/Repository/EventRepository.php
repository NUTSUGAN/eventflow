<?php

namespace App\Repository;

use App\Entity\Event;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Event>
 */
class EventRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Event::class);
    }

    public function findOneForPublicDetail(int $id): ?Event
    {
        return $this->createQueryBuilder('event')
            ->leftJoin('event.organizer', 'organizer')->addSelect('organizer')
            ->leftJoin('event.category', 'category')->addSelect('category')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->leftJoin('event.ticketTypes', 'ticketType')->addSelect('ticketType')
            ->andWhere('event.id = :id')
            ->setParameter('id', $id)
            ->orderBy('ticketType.price', 'ASC')
            ->addOrderBy('ticketType.id', 'ASC')
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
}
