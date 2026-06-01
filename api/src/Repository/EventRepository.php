<?php

namespace App\Repository;

use App\Entity\Event;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
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
        int $limit = 18,
        int $offset = 0,
        string $scope = 'upcoming',
        ?array $organizerIds = null
    ): array {
        $queryBuilder = $this->createQueryBuilder('event')
            ->leftJoin('event.category', 'category')->addSelect('category')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->leftJoin('event.ticketTypes', 'ticketType', 'WITH', 'ticketType.isActive = true')->addSelect('ticketType')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->setParameter('publishedStatus', 'published')
        ;

        $this->applyPublicVisibilityScope($queryBuilder, $scope);
        $this->applyPublicListFilters($queryBuilder, $search, $type, $city, $date);
        $this->applyFollowedOrganizerFilter($queryBuilder, $organizerIds);

        if ($this->isArchiveScope($scope)) {
            $queryBuilder
                ->orderBy('event.endDatetime', 'DESC')
                ->addOrderBy('event.startDatetime', 'DESC')
            ;
        } else {
            $queryBuilder->orderBy('event.startDatetime', 'ASC');
        }

        $queryBuilder
            ->addOrderBy('ticketType.price', 'ASC')
            ->addOrderBy('ticketType.id', 'ASC')
        ;

        if ($limit > 0) {
            $queryBuilder->setMaxResults($limit);
        }

        if ($offset > 0) {
            $queryBuilder->setFirstResult($offset);
        }

        return $queryBuilder
            ->getQuery()
            ->getResult()
        ;
    }

    public function countPublicList(
        ?string $search = null,
        ?string $type = null,
        ?string $city = null,
        ?\DateTimeImmutable $date = null,
        string $scope = 'upcoming',
        ?array $organizerIds = null
    ): int {
        $queryBuilder = $this->createQueryBuilder('event')
            ->select('COUNT(DISTINCT event.id)')
            ->leftJoin('event.category', 'category')
            ->leftJoin('event.location', 'location')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->setParameter('publishedStatus', 'published')
        ;

        $this->applyPublicVisibilityScope($queryBuilder, $scope);
        $this->applyPublicListFilters($queryBuilder, $search, $type, $city, $date);
        $this->applyFollowedOrganizerFilter($queryBuilder, $organizerIds);

        return (int) $queryBuilder
            ->getQuery()
            ->getSingleScalarResult()
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
        $queryBuilder = $this->createQueryBuilder('event')
            ->leftJoin('event.category', 'category')->addSelect('category')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->andWhere('LOWER(event.title) LIKE :query')
            ->setParameter('publishedStatus', 'published')
            ->setParameter('query', '%'.mb_strtolower($query).'%')
            ->orderBy('event.startDatetime', 'ASC')
            ->setMaxResults(max(1, min(10, $limit)))
        ;

        $this->applyPublicVisibilityScope($queryBuilder, 'upcoming');

        return $queryBuilder
            ->getQuery()
            ->getResult()
        ;
    }

    /**
     * @return list<Event>
     */
    public function findPublishedByOrganizer(int $organizerId, int $limit = 12): array
    {
        $queryBuilder = $this->createQueryBuilder('event')
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
        ;

        $this->applyPublicVisibilityScope($queryBuilder, 'upcoming');

        return $queryBuilder
            ->getQuery()
            ->getResult()
        ;
    }

    public function countPublishedByOrganizer(int $organizerId): int
    {
        $queryBuilder = $this->createQueryBuilder('event')
            ->select('COUNT(event.id)')
            ->andWhere('event.organizer = :organizerId')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->setParameter('organizerId', $organizerId)
            ->setParameter('publishedStatus', 'published')
        ;

        $this->applyPublicVisibilityScope($queryBuilder, 'upcoming');

        return (int) $queryBuilder
            ->getQuery()
            ->getSingleScalarResult()
        ;
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    public function findPublicCategoryFilters(): array
    {
        $queryBuilder = $this->createQueryBuilder('event')
            ->select('DISTINCT category.id AS id, category.name AS name')
            ->innerJoin('event.category', 'category')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->andWhere('category.name IS NOT NULL')
            ->andWhere("category.name <> ''")
            ->setParameter('publishedStatus', 'published')
            ->orderBy('category.name', 'ASC')
        ;

        $this->applyPublicVisibilityScope($queryBuilder, 'upcoming');

        $rows = $queryBuilder
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
        $queryBuilder = $this->createQueryBuilder('event')
            ->select('DISTINCT location.city AS city')
            ->innerJoin('event.location', 'location')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->andWhere('location.city IS NOT NULL')
            ->andWhere("location.city <> ''")
            ->setParameter('publishedStatus', 'published')
            ->orderBy('location.city', 'ASC')
        ;

        $this->applyPublicVisibilityScope($queryBuilder, 'upcoming');

        $rows = $queryBuilder
            ->getQuery()
            ->getArrayResult()
        ;

        return array_values(array_map(
            static fn (array $row): string => (string) $row['city'],
            $rows
        ));
    }

    private function applyPublicListFilters(
        QueryBuilder $queryBuilder,
        ?string $search,
        ?string $type,
        ?string $city,
        ?\DateTimeImmutable $date
    ): void {
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
    }

    /**
     * @param list<int>|null $organizerIds
     */
    private function applyFollowedOrganizerFilter(
        QueryBuilder $queryBuilder,
        ?array $organizerIds
    ): void {
        if (null === $organizerIds) {
            return;
        }

        if ([] === $organizerIds) {
            $queryBuilder->andWhere('1 = 0');

            return;
        }

        $queryBuilder
            ->innerJoin('event.organizer', 'followedOrganizer')
            ->andWhere('followedOrganizer.id IN (:followedOrganizerIds)')
            ->setParameter('followedOrganizerIds', $organizerIds)
        ;
    }

    private function applyPublicVisibilityScope(QueryBuilder $queryBuilder, string $scope): void
    {
        $queryBuilder->setParameter('publicReferenceNow', new \DateTimeImmutable());

        if ($this->isArchiveScope($scope)) {
            $queryBuilder->andWhere(
                '(
                    (event.endDatetime IS NOT NULL AND event.endDatetime < :publicReferenceNow)
                    OR (event.endDatetime IS NULL AND event.startDatetime IS NOT NULL AND event.startDatetime < :publicReferenceNow)
                )'
            );

            return;
        }

        $queryBuilder->andWhere(
            '(
                (event.endDatetime IS NOT NULL AND event.endDatetime >= :publicReferenceNow)
                OR (event.endDatetime IS NULL AND event.startDatetime IS NOT NULL AND event.startDatetime >= :publicReferenceNow)
            )'
        );
    }

    private function isArchiveScope(string $scope): bool
    {
        return 'archive' === mb_strtolower(trim($scope));
    }

    /**
     * @param list<int> $accessibleOrganizerIds
     *
     * @return list<Event>
     */
    public function findAccessibleForStaffScan(User $user, array $accessibleOrganizerIds = []): array
    {
        $queryBuilder = $this->createQueryBuilder('event')
            ->leftJoin('event.organizer', 'organizer')->addSelect('organizer')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->leftJoin('event.ticketTypes', 'ticketType')->addSelect('ticketType')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->setParameter('publishedStatus', 'published')
            ->orderBy('event.startDatetime', 'ASC')
            ->addOrderBy('event.id', 'DESC')
        ;

        if ($user->getRole() === User::ROLE_ADMIN) {
            /** @var list<Event> $events */
            $events = $queryBuilder->getQuery()->getResult();

            return $events;
        }

        $uniqueOrganizerIds = array_values(array_unique(array_filter(
            array_map(static fn (int $organizerId): int => (int) $organizerId, $accessibleOrganizerIds),
            static fn (int $organizerId): bool => $organizerId > 0,
        )));

        if ([] === $uniqueOrganizerIds) {
            return [];
        }

        /** @var list<Event> $events */
        $events = $queryBuilder
            ->andWhere('IDENTITY(event.organizer) IN (:organizerIds)')
            ->setParameter('organizerIds', $uniqueOrganizerIds)
            ->getQuery()
            ->getResult()
        ;

        return $events;
    }

    public function findOneForStaffScanById(int $eventId): ?Event
    {
        /** @var Event|null $event */
        $event = $this->createQueryBuilder('event')
            ->leftJoin('event.organizer', 'organizer')->addSelect('organizer')
            ->leftJoin('event.location', 'location')->addSelect('location')
            ->andWhere('event.id = :eventId')
            ->andWhere('LOWER(event.status) = :publishedStatus')
            ->setParameter('eventId', $eventId)
            ->setParameter('publishedStatus', 'published')
            ->getQuery()
            ->getOneOrNullResult()
        ;

        return $event;
    }
}
