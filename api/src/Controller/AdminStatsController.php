<?php

namespace App\Controller;

use App\Entity\Checkin;
use App\Entity\Order;
use App\Entity\Payment;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin/stats')]
final class AdminStatsController extends AbstractController
{
    #[Route('', name: 'api_admin_stats_index', methods: ['GET'])]
    public function index(EntityManagerInterface $entityManager): JsonResponse
    {
        $canViewFinance = $this->isGranted('ROLE_ADMIN_FINANCE');
        $canViewOrders = $this->isGranted('ROLE_ADMIN_SUPPORT') || $canViewFinance;
        $canViewRevenue = $canViewOrders;

        return $this->json([
            'orders' => [
                'total' => $canViewOrders ? $this->countEntities($entityManager, Order::class) : 0,
                'paid' => $canViewOrders ? $this->countEntities($entityManager, Order::class, [
                    'status' => Order::STATUS_PAID,
                ]) : 0,
                'pendingPayment' => $canViewOrders ? $this->countEntities($entityManager, Order::class, [
                    'status' => Order::STATUS_PENDING_PAYMENT,
                ]) : 0,
                'cancelled' => $canViewOrders ? $this->countEntities($entityManager, Order::class, [
                    'status' => Order::STATUS_CANCELLED,
                ]) : 0,
                'expired' => $canViewOrders ? $this->countEntities($entityManager, Order::class, [
                    'status' => Order::STATUS_EXPIRED,
                ]) : 0,
            ],
            'revenue' => [
                'total' => $canViewRevenue ? $this->sumPaidRevenue($entityManager) : '0.00',
                'currency' => Order::DEFAULT_CURRENCY,
            ],
            'tickets' => [
                'sold' => $this->countSoldTickets($entityManager),
            ],
            'scans' => [
                'total' => $this->countEntities($entityManager, Checkin::class),
                'valid' => $this->countEntities($entityManager, Checkin::class, [
                    'result' => Checkin::RESULT_VALID,
                ]),
                'invalid' => $this->countEntities($entityManager, Checkin::class, [
                    'result' => Checkin::RESULT_INVALID,
                ]),
                'alreadyUsed' => $this->countEntities($entityManager, Checkin::class, [
                    'result' => Checkin::RESULT_ALREADY_USED,
                ]),
            ],
        ]);
    }

    /**
     * @param class-string $className
     * @param array<string, mixed> $criteria
     */
    private function countEntities(
        EntityManagerInterface $entityManager,
        string $className,
        array $criteria = [],
    ): int {
        return $entityManager->getRepository($className)->count($criteria);
    }

    private function sumPaidRevenue(EntityManagerInterface $entityManager): string
    {
        $result = $entityManager->createQueryBuilder()
            ->select('COALESCE(SUM(payment.amount), 0)')
            ->from(Payment::class, 'payment')
            ->andWhere('payment.status = :paidStatus')
            ->setParameter('paidStatus', Payment::STATUS_PAID)
            ->getQuery()
            ->getSingleScalarResult()
        ;

        return number_format((float) $result, 2, '.', '');
    }

    private function countSoldTickets(EntityManagerInterface $entityManager): int
    {
        return (int) $entityManager->createQueryBuilder()
            ->select('COUNT(ticket.id)')
            ->from('App\Entity\Ticket', 'ticket')
            ->innerJoin('ticket.customerOrder', 'customerOrder')
            ->andWhere('customerOrder.status = :paidStatus')
            ->setParameter('paidStatus', Order::STATUS_PAID)
            ->getQuery()
            ->getSingleScalarResult()
        ;
    }
}
