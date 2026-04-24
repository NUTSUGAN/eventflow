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

    /**
     * @return list<Event>
     */
    public function findPublicList(
        ?string $search = null,
        ?string $type = null,
        ?string $city = null,
        ?\DateTimeImmutable $date = null,
        int $limit = 18
    ): array {
        $queryBuilder = $this->createQueryBuilder('event')
            ->leftJoin('event.category', 'category')->addSelect('category')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->leftJoin('event.ticketTypes', 'ticketType', 'WITH', 'ticketType.isActive = true')->addSelect('ticketType')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->setParameter('publishedStatus', 'published')
            ->orderBy('event.startDatetime', 'ASC')
            ->addOrderBy('ticketType.price', 'ASC')
            ->addOrderBy('ticketType.id', 'ASC')
        ;

        if (null !== $search && '' !== $search) {
            $queryBuilder
                ->andWhere(
                    'LOWER(event.title) LIKE :search
                    OR LOWER(event.description) LIKE :search
                    OR LOWER(category.name) LIKE :search
                    OR LOWER(location.city) LIKE :search'
                )
                ->setParameter('search', '%'.mb_strtolower($search).'%')
            ;
        }

        if (null !== $type && '' !== $type) {
            if (ctype_digit($type)) {
                $queryBuilder
                    ->andWhere('category.id = :categoryId')
                    ->setParameter('categoryId', (int) $type)
                ;
            } else {
                $queryBuilder
                    ->andWhere('LOWER(category.name) = :categoryName')
                    ->setParameter('categoryName', mb_strtolower($type))
                ;
            }
        }

        if (null !== $city && '' !== $city) {
            $queryBuilder
                ->andWhere('LOWER(location.city) = :city')
                ->setParameter('city', mb_strtolower($city))
            ;
        }

        if ($date instanceof \DateTimeImmutable) {
            $startOfDay = $date->setTime(0, 0, 0);
            $endOfDay = $startOfDay->modify('+1 day');

            $queryBuilder
                ->andWhere('event.startDatetime >= :startOfDay')
                ->andWhere('event.startDatetime < :endOfDay')
                ->setParameter('startOfDay', $startOfDay)
                ->setParameter('endOfDay', $endOfDay)
            ;
        }

        if ($limit > 0) {
            $queryBuilder->setMaxResults($limit);
        }

        return $queryBuilder
            ->getQuery()
            ->getResult()
        ;
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
