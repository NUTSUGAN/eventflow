<?php

namespace App\Repository;

use App\Entity\Event;
use App\Entity\EventReport;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<EventReport>
 */
class EventReportRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EventReport::class);
    }

    public function findPendingForReporterAndEvent(User $reporter, Event $event): ?EventReport
    {
        /** @var EventReport|null $eventReport */
        $eventReport = $this->createQueryBuilder('eventReport')
            ->andWhere('eventReport.reporter = :reporter')
            ->andWhere('eventReport.event = :event')
            ->andWhere('eventReport.status = :status')
            ->setParameter('reporter', $reporter)
            ->setParameter('event', $event)
            ->setParameter('status', EventReport::STATUS_PENDING)
            ->orderBy('eventReport.createdAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $eventReport;
    }

    /**
     * @return EventReport[]
     */
    public function findForAdmin(?string $status = null): array
    {
        $queryBuilder = $this->createQueryBuilder('eventReport')
            ->innerJoin('eventReport.event', 'reportedEvent')
            ->addSelect('reportedEvent')
            ->innerJoin('eventReport.reporter', 'reporter')
            ->addSelect('reporter')
            ->leftJoin('reportedEvent.organizer', 'organizer')
            ->addSelect('organizer')
            ->leftJoin('reportedEvent.location', 'location')
            ->addSelect('location')
            ->orderBy('eventReport.createdAt', 'DESC')
        ;

        if (null !== $status) {
            $queryBuilder
                ->andWhere('eventReport.status = :status')
                ->setParameter('status', $status)
            ;
        }

        /** @var EventReport[] $reports */
        $reports = $queryBuilder->getQuery()->getResult();

        return $reports;
    }
}
