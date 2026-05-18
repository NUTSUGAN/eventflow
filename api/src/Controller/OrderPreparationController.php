<?php

namespace App\Controller;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\TicketType;
use App\Entity\User;
use App\Repository\OrderItemRepository;
use App\Repository\TicketTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/orders')]
final class OrderPreparationController extends AbstractController
{
    #[Route('/prepare', name: 'api_order_prepare', methods: ['POST'])]
    public function prepare(
        Request $request,
        TicketTypeRepository $ticketTypeRepository,
        OrderItemRepository $orderItemRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $data = $request->toArray();
        } catch (\Throwable) {
            return $this->json([
                'message' => 'Le corps de la requete doit etre un JSON valide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $items = $data['items'] ?? null;

        if (!is_array($items) || [] === $items) {
            return $this->json([
                'message' => 'Le champ items est obligatoire.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $normalizedItems = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                return $this->json([
                    'message' => 'Chaque ligne de commande doit etre un objet valide.',
                ], Response::HTTP_BAD_REQUEST);
            }

            $ticketTypeId = $item['ticketTypeId'] ?? null;
            $quantity = $item['quantity'] ?? null;

            if (!is_numeric($ticketTypeId) || (int) $ticketTypeId <= 0) {
                return $this->json([
                    'message' => 'ticketTypeId doit etre un entier positif.',
                ], Response::HTTP_BAD_REQUEST);
            }

            if (!is_numeric($quantity) || (int) $quantity <= 0) {
                return $this->json([
                    'message' => 'quantity doit etre un entier positif.',
                ], Response::HTTP_BAD_REQUEST);
            }

            $normalizedItems[(int) $ticketTypeId] = ($normalizedItems[(int) $ticketTypeId] ?? 0) + (int) $quantity;
        }

        $now = new \DateTimeImmutable();
        $lineItems = [];
        $event = null;
        $totalAmountInCents = 0;

        foreach ($normalizedItems as $ticketTypeId => $quantity) {
            $ticketType = $ticketTypeRepository->find($ticketTypeId);

            if (!$ticketType instanceof TicketType) {
                return $this->json([
                    'message' => sprintf('Le billet %d est introuvable.', $ticketTypeId),
                ], Response::HTTP_NOT_FOUND);
            }

            $ticketEvent = $ticketType->getEvent();

            if (null === $ticketEvent || 'published' !== strtolower((string) $ticketEvent->getStatus())) {
                return $this->json([
                    'message' => 'Ce billet nest pas disponible a la reservation.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            if (!$ticketType->isActive()) {
                return $this->json([
                    'message' => sprintf('Le billet "%s" nest plus actif.', $ticketType->getName()),
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            if ($ticketType->getSalesStartAt() > $now) {
                return $this->json([
                    'message' => sprintf('La vente du billet "%s" na pas encore commence.', $ticketType->getName()),
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            if ($ticketType->getSalesEndAt() < $now) {
                return $this->json([
                    'message' => sprintf('La vente du billet "%s" est terminee.', $ticketType->getName()),
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            if (null !== $ticketType->getMaxPerOrder() && $quantity > $ticketType->getMaxPerOrder()) {
                return $this->json([
                    'message' => sprintf(
                        'Le billet "%s" est limite a %d exemplaire(s) par commande.',
                        $ticketType->getName(),
                        $ticketType->getMaxPerOrder()
                    ),
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            if (null !== $event && $event->getId() !== $ticketEvent->getId()) {
                return $this->json([
                    'message' => 'Une commande ne peut preparer que des billets du meme evenement.',
                ], Response::HTTP_BAD_REQUEST);
            }

            $reservedQuantity = $orderItemRepository->countReservedQuantityForTicketType(
                $ticketType,
                Order::STOCK_CONSUMING_STATUSES
            );
            $availableStock = max(0, $ticketType->getStock() - $reservedQuantity);

            if ($quantity > $availableStock) {
                return $this->json([
                    'message' => sprintf(
                        'Stock insuffisant pour "%s". Il reste %d billet(s) disponibles.',
                        $ticketType->getName(),
                        $availableStock
                    ),
                    'ticketTypeId' => $ticketType->getId(),
                    'availableStock' => $availableStock,
                ], Response::HTTP_CONFLICT);
            }

            $unitPrice = (string) ($ticketType->getPrice() ?? '0.00');
            $unitPriceInCents = $this->moneyStringToCents($unitPrice);
            $lineTotalInCents = $unitPriceInCents * $quantity;

            $lineItems[] = [
                'ticketType' => $ticketType,
                'quantity' => $quantity,
                'unitPrice' => $unitPrice,
                'unitPriceInCents' => $unitPriceInCents,
                'lineTotalInCents' => $lineTotalInCents,
                'availableStock' => $availableStock,
            ];

            $event = $ticketEvent;
            $totalAmountInCents += $lineTotalInCents;
        }

        $order = new Order();
        $order->setClient($user);
        $order->setReference($this->generateOrderReference());
        $order->setStatus(Order::STATUS_PENDING_PAYMENT);
        $order->setOrderType(Order::TYPE_TICKET);
        $order->setCurrency(Order::DEFAULT_CURRENCY);
        $order->setTotalAmount($this->centsToMoneyString($totalAmountInCents));
        $order->setCreatedAt($now);

        $entityManager->persist($order);

        $serializedItems = [];

        foreach ($lineItems as $lineItem) {
            $orderItem = new OrderItem();
            $orderItem->setCustomerOrder($order);
            $orderItem->setTicketType($lineItem['ticketType']);
            $orderItem->setQuantity($lineItem['quantity']);
            $orderItem->setUnitPriceAtPurchase($lineItem['unitPrice']);

            $entityManager->persist($orderItem);

            $serializedItems[] = [
                'ticketTypeId' => $lineItem['ticketType']->getId(),
                'ticketName' => $lineItem['ticketType']->getName(),
                'quantity' => $lineItem['quantity'],
                'unitPrice' => (float) $lineItem['unitPrice'],
                'lineTotal' => (float) $this->centsToMoneyString($lineItem['lineTotalInCents']),
                'availableStockAfterPreparation' => $lineItem['availableStock'],
            ];
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Commande preparee avec succes.',
            'order' => [
                'id' => $order->getId(),
                'reference' => $order->getReference(),
                'status' => $order->getStatus(),
                'orderType' => $order->getOrderType(),
                'currency' => $order->getCurrency(),
                'subtotal' => (float) $order->getTotalAmount(),
                'total' => (float) $order->getTotalAmount(),
                'createdAt' => $order->getCreatedAt()?->format(DATE_ATOM),
                'event' => [
                    'id' => $event?->getId(),
                    'title' => $event?->getTitle(),
                ],
                'items' => $serializedItems,
            ],
        ], Response::HTTP_CREATED);
    }

    private function generateOrderReference(): string
    {
        return sprintf(
            'ORD-%s-%s',
            (new \DateTimeImmutable())->format('YmdHis'),
            strtoupper(bin2hex(random_bytes(3)))
        );
    }

    private function moneyStringToCents(string $amount): int
    {
        return (int) round(((float) $amount) * 100);
    }

    private function centsToMoneyString(int $amountInCents): string
    {
        return number_format($amountInCents / 100, 2, '.', '');
    }
}
