<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Payment;
use App\Entity\TicketType;
use App\Entity\User;
use App\Repository\OrderItemRepository;
use App\Repository\OrderRepository;
use App\Repository\TicketTypeRepository;
use App\Service\StripePaymentService;
use Doctrine\ORM\EntityManagerInterface;
use Stripe\Exception\ApiErrorException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/orders')]
final class OrderPreparationController extends AbstractController
{
    private const PUBLIC_TIMEZONE = 'Europe/Paris';

    #[Route('/prepare', name: 'api_order_prepare', methods: ['POST'])]
    public function prepare(
        Request $request,
        TicketTypeRepository $ticketTypeRepository,
        OrderItemRepository $orderItemRepository,
        EntityManagerInterface $entityManager,
        StripePaymentService $stripePaymentService,
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
                'message' => 'Le corps de la requête doit être un JSON valide.',
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
                    'message' => 'Chaque ligne de commande doit être un objet valide.',
                ], Response::HTTP_BAD_REQUEST);
            }

            $ticketTypeId = $item['ticketTypeId'] ?? null;
            $quantity = $item['quantity'] ?? null;

            if (!is_numeric($ticketTypeId) || (int) $ticketTypeId <= 0) {
                return $this->json([
                    'message' => 'ticketTypeId doit être un entier positif.',
                ], Response::HTTP_BAD_REQUEST);
            }

            if (!is_numeric($quantity) || (int) $quantity <= 0) {
                return $this->json([
                    'message' => 'quantity doit être un entier positif.',
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
                    'message' => 'Ce billet n’est pas disponible à la réservation.',
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
                    'message' => sprintf('La vente du billet "%s" est terminée.', $ticketType->getName()),
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

            if (null !== $event && $event?->getId() !== $ticketEvent->getId()) {
                return $this->json([
                    'message' => 'Une commande ne peut preparer que des billets du meme l’évènement.',
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

        foreach ($lineItems as $lineItem) {
            $orderItem = new OrderItem();
            $orderItem->setCustomerOrder($order);
            $orderItem->setTicketType($lineItem['ticketType']);
            $orderItem->setQuantity($lineItem['quantity']);
            $orderItem->setUnitPriceAtPurchase($lineItem['unitPrice']);

            $entityManager->persist($orderItem);
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Commande preparee avec succès.',
            'order' => $this->serializeOrder($order, $stripePaymentService),
        ], Response::HTTP_CREATED);
    }

    #[Route('/pending', name: 'api_order_pending_index', methods: ['GET'])]
    public function pending(
        OrderRepository $orderRepository,
        StripePaymentService $stripePaymentService,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $orders = $orderRepository->findPendingPaymentOrdersForUser($user);

        return $this->json([
            'orders' => array_map(
                fn (Order $order): array => $this->serializeOrder($order, $stripePaymentService),
                $orders,
            ),
        ]);
    }

    #[Route('/{orderId<\d+>}', name: 'api_order_show', methods: ['GET'])]
    public function show(
        int $orderId,
        OrderRepository $orderRepository,
        StripePaymentService $stripePaymentService,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $order = $orderRepository->find($orderId);

        if (!$order instanceof Order || $order->getClient()?->getId() !== $user->getId()) {
            return $this->json([
                'message' => 'Commande introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'order' => $this->serializeOrder($order, $stripePaymentService),
        ]);
    }

    #[Route('/{orderId<\d+>}/checkout-session', name: 'api_order_checkout_session_create', methods: ['POST'])]
    public function createCheckoutSession(
        int $orderId,
        OrderRepository $orderRepository,
        StripePaymentService $stripePaymentService,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $order = $orderRepository->find($orderId);

        if (!$order instanceof Order || $order->getClient()?->getId() !== $user->getId()) {
            return $this->json([
                'message' => 'Commande introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        if (Order::STATUS_PAID === $order->getStatus()) {
            return $this->json([
                'message' => 'Cette commande est déjà payée.',
                'order' => $this->serializeOrder($order, $stripePaymentService),
            ], Response::HTTP_CONFLICT);
        }

        try {
            $session = $stripePaymentService->createCheckoutSession($order);
        } catch (\LogicException $exception) {
            return $this->json([
                'message' => $exception->getMessage(),
                'order' => $this->serializeOrder($order, $stripePaymentService),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\RuntimeException $exception) {
            return $this->json([
                'message' => $exception->getMessage(),
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        } catch (ApiErrorException $exception) {
            return $this->json([
                'message' => $this->buildStripeCheckoutErrorMessage($exception),
            ], Response::HTTP_BAD_GATEWAY);
        }

        return $this->json([
            'message' => 'Session Stripe creee avec succès.',
            'checkoutUrl' => $session->url,
            'sessionId' => $session->id,
        ]);
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

    private function buildStripeCheckoutErrorMessage(ApiErrorException $exception): string
    {
        $message = trim($exception->getMessage());

        if (str_contains(strtolower($message), 'set an account or business name')) {
            return "Le compte Stripe de test n’est pas encore complètement configuré. Ajoute d'abord le nom du compte ou de l'entreprise dans le dashboard Stripe, puis réessaie.";
        }

        if ('' !== $message) {
            return sprintf('Stripe a refusé la création de la session : %s', $message);
        }

        return 'Impossible de créer la session Stripe pour le moment.';
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeOrder(Order $order, StripePaymentService $stripePaymentService): array
    {
        $event = $this->getOrderEvent($order);
        $location = $event?->getLocation();
        $items = [];

        foreach ($order->getOrderItems() as $orderItem) {
            $ticketType = $orderItem->getTicketType();
            $unitPrice = (string) ($orderItem->getUnitPriceAtPurchase() ?? '0.00');
            $quantity = $orderItem->getQuantity() ?? 0;

            $items[] = [
                'ticketTypeId' => $ticketType?->getId(),
                'ticketName' => $ticketType?->getName(),
                'quantity' => $quantity,
                'unitPrice' => (float) $unitPrice,
                'lineTotal' => (float) $this->centsToMoneyString($this->moneyStringToCents($unitPrice) * $quantity),
                'availableStockAfterPreparation' => null,
            ];
        }

        return [
            'id' => $order->getId(),
            'reference' => $order->getReference(),
            'status' => $order->getStatus(),
            'orderType' => $order->getOrderType(),
            'currency' => $order->getCurrency(),
            'subtotal' => (float) ($order->getTotalAmount() ?? '0.00'),
            'total' => (float) ($order->getTotalAmount() ?? '0.00'),
            'createdAt' => $order->getCreatedAt()?->format(DATE_ATOM),
            'event' => [
                'id' => $event?->getId(),
                'title' => $event?->getTitle(),
                'startsAt' => $this->formatDateTimeForFrontend($event?->getStartDatetime()),
                'endsAt' => $this->formatDateTimeForFrontend($event?->getEndDatetime()),
                'city' => $location?->getCity(),
                'venue' => $location?->getAddress() ?? $location?->getCity(),
            ],
            'items' => $items,
            'payment' => $this->serializePayment($order->getPayment()),
            'canStartCheckout' => $stripePaymentService->canStartCheckout($order),
        ];
    }

    private function getOrderEvent(Order $order): ?Event
    {
        foreach ($order->getOrderItems() as $orderItem) {
            $event = $orderItem->getTicketType()?->getEvent();

            if ($event instanceof Event) {
                return $event;
            }
        }

        return null;
    }

    private function formatDateTimeForFrontend(?\DateTimeImmutable $dateTime): ?string
    {
        if (!$dateTime instanceof \DateTimeImmutable) {
            return null;
        }

        return $dateTime
            ->setTimezone(new \DateTimeZone(self::PUBLIC_TIMEZONE))
            ->format(DATE_ATOM);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function serializePayment(?Payment $payment): ?array
    {
        if (!$payment instanceof Payment) {
            return null;
        }

        return [
            'provider' => $payment->getProvider(),
            'providerPaymentId' => $payment->getProviderPaymentId(),
            'amount' => (float) ($payment->getAmount() ?? '0.00'),
            'currency' => $payment->getCurrency(),
            'status' => $payment->getStatus(),
            'paidAt' => $payment->getPaidAt()?->format(DATE_ATOM),
        ];
    }
}
