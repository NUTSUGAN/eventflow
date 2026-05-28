<?php

namespace App\Repository;

use App\Entity\Checkin;
use App\Entity\Event;
use App\Entity\Ticket;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Checkin>
 */
class CheckinRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Checkin::class);
    }

    public function findLatestValidForTicket(Ticket $ticket): ?Checkin
    {
        /** @var Checkin|null $checkin */
        $checkin = $this->createQueryBuilder('checkin')
            ->andWhere('checkin.ticket = :ticket')
            ->andWhere('checkin.result = :result')
            ->setParameter('ticket', $ticket)
            ->setParameter('result', Checkin::RESULT_VALID)
            ->orderBy('checkin.scannedAt', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult()
        ;

        return $checkin;
    }

    /**
     * @return list<array{
     *   staffUserId: int|null,
     *   firstName: string|null,
     *   lastName: string|null,
     *   email: string|null,
     *   totalScans: int,
     *   validScans: int,
     *   invalidScans: int,
     *   alreadyUsedScans: int
     * }>
     */
    public function findStaffScanStatsForEvent(Event $event): array
    {
        $rows = $this->createQueryBuilder('checkin')
            ->select('staff.id AS staffUserId')
            ->addSelect('staff.firstName AS firstName')
            ->addSelect('staff.lastName AS lastName')
            ->addSelect('staff.email AS email')
            ->addSelect('COUNT(checkin.id) AS totalScans')
            ->addSelect('SUM(CASE WHEN checkin.result = :validResult THEN 1 ELSE 0 END) AS validScans')
            ->addSelect('SUM(CASE WHEN checkin.result = :invalidResult THEN 1 ELSE 0 END) AS invalidScans')
            ->addSelect('SUM(CASE WHEN checkin.result = :alreadyUsedResult THEN 1 ELSE 0 END) AS alreadyUsedScans')
            ->innerJoin('checkin.staffUser', 'staff')
            ->andWhere('checkin.event = :event')
            ->setParameter('event', $event)
            ->setParameter('validResult', Checkin::RESULT_VALID)
            ->setParameter('invalidResult', Checkin::RESULT_INVALID)
            ->setParameter('alreadyUsedResult', Checkin::RESULT_ALREADY_USED)
            ->groupBy('staff.id')
            ->addGroupBy('staff.firstName')
            ->addGroupBy('staff.lastName')
            ->addGroupBy('staff.email')
            ->orderBy('totalScans', 'DESC')
            ->addOrderBy('staff.firstName', 'ASC')
            ->addOrderBy('staff.lastName', 'ASC')
            ->getQuery()
            ->getArrayResult()
        ;

        return array_map(
            static fn (array $row): array => [
                'staffUserId' => isset($row['staffUserId']) ? (int) $row['staffUserId'] : null,
                'firstName' => $row['firstName'] ?? null,
                'lastName' => $row['lastName'] ?? null,
                'email' => $row['email'] ?? null,
                'totalScans' => (int) ($row['totalScans'] ?? 0),
                'validScans' => (int) ($row['validScans'] ?? 0),
                'invalidScans' => (int) ($row['invalidScans'] ?? 0),
                'alreadyUsedScans' => (int) ($row['alreadyUsedScans'] ?? 0),
            ],
            $rows,
        );
    }
}
