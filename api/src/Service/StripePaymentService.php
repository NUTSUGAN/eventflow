<?php

namespace App\Service;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Payment;
use Doctrine\ORM\EntityManagerInterface;
use Stripe\Checkout\Session;
use Stripe\Event;
use Stripe\StripeClient;
use Stripe\StripeObject;
use Stripe\Webhook;

final class StripePaymentService
{
    private const RETRYABLE_ORDER_STATUSES = [
        Order::STATUS_PENDING_PAYMENT,
        Order::STATUS_EXPIRED,
    ];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    public function canStartCheckout(Order $order): bool
    {
        return in_array((string) $order->getStatus(), self::RETRYABLE_ORDER_STATUSES, true);
    }

    public function createCheckoutSession(Order $order): Session
    {
        if (!$this->canStartCheckout($order)) {
            throw new \LogicException('Cette commande nest pas disponible pour un nouveau paiement.');
        }

        if (0 === $order->getOrderItems()->count()) {
            throw new \LogicException('Cette commande ne contient aucun billet a payer.');
        }

        $frontendUrl = $this->getFrontendAppUrl();

        if (null === $frontendUrl) {
            throw new \RuntimeException('FRONTEND_APP_URL nest pas configure.');
        }

        $payload = [
            'mode' => 'payment',
            'client_reference_id' => (string) $order->getId(),
            'locale' => 'fr',
            'payment_method_types' => ['card'],
            'success_url' => $this->buildSuccessUrl($order, $frontendUrl),
            'cancel_url' => $this->buildCancelUrl($order, $frontendUrl),
            'line_items' => $this->buildLineItems($order),
            'metadata' => [
                'order_id' => (string) $order->getId(),
                'order_reference' => (string) $order->getReference(),
                'order_type' => (string) $order->getOrderType(),
            ],
        ];

        $customerEmail = $order->getClient()?->getEmail();

        if (is_string($customerEmail) && '' !== trim($customerEmail)) {
            $payload['customer_email'] = trim($customerEmail);
        }

        return $this->createClient()->checkout->sessions->create($payload);
    }

    public function constructWebhookEvent(string $payload, ?string $signatureHeader): Event
    {
        $webhookSecret = $this->getStripeWebhookSecret();

        if (null === $webhookSecret) {
            throw new \RuntimeException('STRIPE_WEBHOOK_SECRET nest pas configure.');
        }

        if (null === $signatureHeader || '' === trim($signatureHeader)) {
            throw new \InvalidArgumentException('La signature Stripe est manquante.');
        }

        return Webhook::constructEvent($payload, $signatureHeader, $webhookSecret);
    }

    public function hydrateCheckoutSession(mixed $sessionObject): Session
    {
        if ($sessionObject instanceof Session) {
            return $sessionObject;
        }

        if ($sessionObject instanceof StripeObject) {
            /** @var array<string, mixed> $normalized */
            $normalized = $sessionObject->toArray();

            return Session::constructFrom($normalized);
        }

        if (is_array($sessionObject)) {
            return Session::constructFrom($sessionObject);
        }

        throw new \InvalidArgumentException('Objet de session Stripe invalide.');
    }

    public function extractOrderIdFromSession(Session $session): ?int
    {
        $metadata = $this->normalizeMetadata($session->metadata);
        $rawOrderId = $metadata['order_id'] ?? $session->client_reference_id ?? null;

        if (!is_scalar($rawOrderId) || !is_numeric((string) $rawOrderId)) {
            return null;
        }

        $orderId = (int) $rawOrderId;

        return $orderId > 0 ? $orderId : null;
    }

    public function markOrderAsPaid(Order $order, Session $session): void
    {
        if (Order::STATUS_PAID === $order->getStatus() && null !== $order->getPayment()) {
            return;
        }

        $payment = $order->getPayment() ?? new Payment();
        $payment->setCustomerOrder($order);
        $payment->setProvider(Payment::PROVIDER_STRIPE);
        $payment->setProviderPaymentId($this->resolveProviderPaymentId($session));
        $payment->setAmount($order->getTotalAmount() ?? $this->centsToMoneyString((int) ($session->amount_total ?? 0)));
        $payment->setCurrency(strtoupper((string) ($session->currency ?? $order->getCurrency() ?? Order::DEFAULT_CURRENCY)));
        $payment->setStatus(Payment::STATUS_PAID);
        $payment->setPaidAt(new \DateTimeImmutable());

        $order->setStatus(Order::STATUS_PAID);
        $order->setPayment($payment);

        $this->entityManager->persist($payment);
        $this->entityManager->flush();
    }

    public function markOrderAsExpired(Order $order): void
    {
        if (Order::STATUS_PAID === $order->getStatus()) {
            return;
        }

        if (Order::STATUS_EXPIRED === $order->getStatus()) {
            return;
        }

        $order->setStatus(Order::STATUS_EXPIRED);
        $this->entityManager->flush();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildLineItems(Order $order): array
    {
        $lineItems = [];

        foreach ($order->getOrderItems() as $orderItem) {
            if (!$orderItem instanceof OrderItem) {
                continue;
            }

            $ticketType = $orderItem->getTicketType();
            $eventTitle = $ticketType?->getEvent()?->getTitle();
            $unitAmount = $this->moneyStringToCents((string) ($orderItem->getUnitPriceAtPurchase() ?? '0.00'));
            $productData = [
                'name' => (string) ($ticketType?->getName() ?? 'Billet EventFlow'),
                'metadata' => [
                    'ticket_type_id' => (string) ($ticketType?->getId() ?? ''),
                    'event_id' => (string) ($ticketType?->getEvent()?->getId() ?? ''),
                ],
            ];

            if (is_string($eventTitle) && '' !== trim($eventTitle)) {
                $productData['description'] = trim($eventTitle);
            }

            $lineItems[] = [
                'quantity' => $orderItem->getQuantity() ?? 1,
                'price_data' => [
                    'currency' => strtolower((string) ($order->getCurrency() ?? Order::DEFAULT_CURRENCY)),
                    'unit_amount' => $unitAmount,
                    'product_data' => $productData,
                ],
            ];
        }

        return $lineItems;
    }

    private function buildSuccessUrl(Order $order, string $frontendUrl): string
    {
        $template = $this->readEnv('STRIPE_CHECKOUT_SUCCESS_URL')
            ?? sprintf('%s/checkout/success?orderId={ORDER_ID}&session_id={CHECKOUT_SESSION_ID}', rtrim($frontendUrl, '/'));

        return str_replace('{ORDER_ID}', (string) $order->getId(), $template);
    }

    private function buildCancelUrl(Order $order, string $frontendUrl): string
    {
        $template = $this->readEnv('STRIPE_CHECKOUT_CANCEL_URL')
            ?? sprintf('%s/checkout/cancel?orderId={ORDER_ID}', rtrim($frontendUrl, '/'));

        return str_replace('{ORDER_ID}', (string) $order->getId(), $template);
    }

    private function createClient(): StripeClient
    {
        $secretKey = $this->getStripeSecretKey();

        if (null === $secretKey) {
            throw new \RuntimeException('STRIPE_SECRET_KEY nest pas configure.');
        }

        return new StripeClient($secretKey);
    }

    private function getStripeSecretKey(): ?string
    {
        return $this->readEnv('STRIPE_SECRET_KEY');
    }

    private function getStripeWebhookSecret(): ?string
    {
        return $this->readEnv('STRIPE_WEBHOOK_SECRET');
    }

    private function getFrontendAppUrl(): ?string
    {
        return $this->readEnv('FRONTEND_APP_URL');
    }

    private function readEnv(string $name): ?string
    {
        $value = $_SERVER[$name] ?? $_ENV[$name] ?? getenv($name);

        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return '' === $trimmed ? null : $trimmed;
    }

    private function resolveProviderPaymentId(Session $session): string
    {
        $paymentIntentId = $session->payment_intent;

        if (is_string($paymentIntentId) && '' !== trim($paymentIntentId)) {
            return trim($paymentIntentId);
        }

        return (string) $session->id;
    }

    /**
     * @return array<string, string>
     */
    private function normalizeMetadata(mixed $metadata): array
    {
        if ($metadata instanceof StripeObject) {
            $metadata = $metadata->toArray();
        }

        if (!is_array($metadata)) {
            return [];
        }

        $normalized = [];

        foreach ($metadata as $key => $value) {
            if (!is_string($key) || !is_scalar($value)) {
                continue;
            }

            $normalized[$key] = (string) $value;
        }

        return $normalized;
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
