<?php

namespace App\Controller;

use App\Entity\Order;
use App\Entity\Payment;
use App\Entity\User;
use App\Repository\OrderRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/me/orders')]
final class MyOrderController extends AbstractController
{
    #[Route('', name: 'api_my_orders_index', methods: ['GET'])]
    public function index(OrderRepository $orderRepository): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Non authentifie.'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'orders' => array_map(
                $this->serializeOrder(...),
                $orderRepository->findPaidOrdersForUser($user),
            ),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeOrder(Order $order): array
    {
        $campaign = $order->getPromotionCampaign();
        $event = $campaign?->getEvent();
        $ticketCount = 0;

        foreach ($order->getOrderItems() as $item) {
            $ticketCount += (int) ($item->getQuantity() ?? 0);
            $event ??= $item->getTicketType()?->getEvent();
        }

        return [
            'id' => $order->getId(),
            'reference' => $order->getReference(),
            'status' => $order->getStatus(),
            'orderType' => $order->getOrderType(),
            'total' => (float) ($order->getTotalAmount() ?? '0.00'),
            'currency' => $order->getCurrency() ?? Order::DEFAULT_CURRENCY,
            'createdAt' => $order->getCreatedAt()?->format(DATE_ATOM),
            'paidAt' => $this->serializePaidAt($order->getPayment()),
            'ticketCount' => $ticketCount,
            'event' => [
                'id' => $event?->getId(),
                'title' => $event?->getTitle(),
            ],
            'promotionCampaignId' => $campaign?->getId(),
        ];
    }

    private function serializePaidAt(?Payment $payment): ?string
    {
        return $payment?->getPaidAt()?->format(DATE_ATOM);
    }
}
