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
        $queryBuilder = $this->createQueryBuilder('event')
            ->leftJoin('event.organizer', 'organizer')->addSelect('organizer')
            ->leftJoin('event.category', 'category')->addSelect('category')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->andWhere('event.id = :id')
            ->setParameter('id', $id)
        ;

        return $queryBuilder
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }

    /**
     * @return list<Event>
     */
    public function findPublicSuggestionsByTitle(string $query, int $limit = 5): array
    {
        return $this->createQueryBuilder('event')
            ->leftJoin('event.category', 'category')->addSelect('category')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->andWhere('LOWER(event.title) LIKE :query')
            ->setParameter('publishedStatus', 'published')
            ->setParameter('query', '%'.mb_strtolower($query).'%')
            ->orderBy('event.startDatetime', 'ASC')
            ->setMaxResults(max(1, min(10, $limit)))
            ->getQuery()
            ->getResult()
        ;
    }

    /**
     * @return list<Event>
     */
    public function findPublishedByOrganizer(int $organizerId, int $limit = 12): array
    {
        return $this->createQueryBuilder('event')
            ->leftJoin('event.category', 'category')->addSelect('category')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->leftJoin('event.ticketTypes', 'ticketType', 'WITH', 'ticketType.isActive = true')->addSelect('ticketType')
            ->andWhere('event.organizer = :organizerId')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->setParameter('organizerId', $organizerId)
            ->setParameter('publishedStatus', 'published')
            ->orderBy('event.startDatetime', 'ASC')
            ->addOrderBy('ticketType.price', 'ASC')
            ->addOrderBy('ticketType.id', 'ASC')
            ->setMaxResults(max(1, min(24, $limit)))
            ->getQuery()
            ->getResult()
        ;
    }

    public function countPublishedByOrganizer(int $organizerId): int
    {
        return (int) $this->createQueryBuilder('event')
            ->select('COUNT(event.id)')
            ->andWhere('event.organizer = :organizerId')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->setParameter('organizerId', $organizerId)
            ->setParameter('publishedStatus', 'published')
            ->getQuery()
            ->getSingleScalarResult()
        ;
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    public function findPublicCategoryFilters(): array
    {
        $rows = $this->createQueryBuilder('event')
            ->select('DISTINCT category.id AS id, category.name AS name')
            ->innerJoin('event.category', 'category')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->andWhere('category.name IS NOT NULL')
            ->andWhere("category.name <> ''")
            ->setParameter('publishedStatus', 'published')
            ->orderBy('category.name', 'ASC')
            ->getQuery()
            ->getArrayResult()
        ;

        return array_values(array_map(
            static fn (array $row): array => [
                'id' => (int) $row['id'],
                'name' => (string) $row['name'],
            ],
            $rows
        ));
    }

    /**
     * @return list<string>
     */
    public function findPublicCityFilters(): array
    {
        $rows = $this->createQueryBuilder('event')
            ->select('DISTINCT location.city AS city')
            ->innerJoin('event.location', 'location')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->andWhere('location.city IS NOT NULL')
            ->andWhere("location.city <> ''")
            ->setParameter('publishedStatus', 'published')
            ->orderBy('location.city', 'ASC')
            ->getQuery()
            ->getArrayResult()
        ;

        return array_values(array_map(
            static fn (array $row): string => (string) $row['city'],
            $rows
        ));
    }
}
