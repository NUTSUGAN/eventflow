<?php

namespace App\Controller;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Ticket;
use App\Repository\OrderRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin/orders')]
final class AdminOrderController extends AbstractController
{
    #[Route('', name: 'api_admin_order_index', methods: ['GET'])]
    public function index(OrderRepository $orderRepository): JsonResponse
    {
        $orders = $orderRepository->findForAdminList();

        return $this->json(array_map(
            fn (Order $order): array => $this->serializeOrder($order),
            $orders,
        ));
    }

    private function serializeOrder(Order $order): array
    {
        $client = $order->getClient();
        $payment = $order->getPayment();
        $promotionCampaign = $order->getPromotionCampaign();

        return [
            'id' => $order->getId(),
            'reference' => $order->getReference(),
            'status' => $order->getStatus(),
            'orderType' => $order->getOrderType(),
            'totalAmount' => $order->getTotalAmount(),
            'currency' => $order->getCurrency(),
            'createdAt' => $order->getCreatedAt()?->format(DATE_ATOM),
            'client' => [
                'id' => $client?->getId(),
                'fullName' => $client?->getDisplayName(),
                'email' => $client?->getEmail(),
            ],
            'payment' => $payment ? [
                'id' => $payment->getId(),
                'provider' => $payment->getProvider(),
                'providerPaymentId' => $payment->getProviderPaymentId(),
                'amount' => $payment->getAmount(),
                'currency' => $payment->getCurrency(),
                'status' => $payment->getStatus(),
                'paidAt' => $payment->getPaidAt()?->format(DATE_ATOM),
            ] : null,
            'ticketsCount' => $order->getTickets()->count(),
            'promotion' => $promotionCampaign ? [
                'campaignId' => $promotionCampaign->getId(),
                'eventId' => $promotionCampaign->getEvent()?->getId(),
                'eventTitle' => $promotionCampaign->getEvent()?->getTitle(),
            ] : null,
            'tickets' => array_map(
                fn (Ticket $ticket): array => [
                    'id' => $ticket->getId(),
                    'status' => $ticket->getStatus(),
                    'issuedAt' => $ticket->getIssuedAt()?->format(DATE_ATOM),
                ],
                $order->getTickets()->toArray(),
            ),
            'items' => array_map(
                fn (OrderItem $item): array => [
                    'id' => $item->getId(),
                    'quantity' => $item->getQuantity(),
                    'unitPriceAtPurchase' => $item->getUnitPriceAtPurchase(),
                    'ticketType' => [
                        'id' => $item->getTicketType()?->getId(),
                        'name' => $item->getTicketType()?->getName(),
                    ],
                    'event' => [
                        'id' => $item->getTicketType()?->getEvent()?->getId(),
                        'title' => $item->getTicketType()?->getEvent()?->getTitle(),
                    ],
                ],
                $order->getOrderItems()->toArray(),
            ),
        ];
    }
}
