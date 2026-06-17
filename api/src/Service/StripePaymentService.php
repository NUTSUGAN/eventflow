<?php

namespace App\Service;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Payment;
use App\Entity\PromotionCampaign;
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
            throw new \LogicException('Cette commande ne contient aucun billet à payer.');
        }

        $this->assertWebhookConfigured();
        $frontendUrl = $this->getFrontendAppUrl();

        if (null === $frontendUrl) {
            throw new \RuntimeException("FRONTEND_APP_URL n'est pas configuré.");
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

    public function createPromotionCheckoutSession(PromotionCampaign $campaign): Session
    {
        if (PromotionCampaign::STATUS_APPROVED !== $campaign->getStatus()) {
            throw new \LogicException('Seule une campagne approuvée peut être payée.');
        }

        if (null !== $campaign->getPaidAt()) {
            throw new \LogicException('Cette campagne a déjà ete payée.');
        }

        $this->assertWebhookConfigured();
        $frontendUrl = $this->getFrontendAppUrl();

        if (null === $frontendUrl) {
            throw new \RuntimeException("FRONTEND_APP_URL n'est pas configuré.");
        }

        $event = $campaign->getEvent();
        $organizer = $campaign->getOrganizer();
        $campaignId = (int) $campaign->getId();
        $payload = [
            'mode' => 'payment',
            'client_reference_id' => (string) $campaignId,
            'locale' => 'fr',
            'payment_method_types' => ['card'],
            'success_url' => sprintf(
                '%s/organizer/promotions?payment=success&campaignId=%d&session_id={CHECKOUT_SESSION_ID}',
                rtrim($frontendUrl, '/'),
                $campaignId,
            ),
            'cancel_url' => sprintf(
                '%s/organizer/promotions?payment=cancelled&campaignId=%d',
                rtrim($frontendUrl, '/'),
                $campaignId,
            ),
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => strtolower($campaign->getCurrency()),
                    'unit_amount' => $this->moneyStringToCents($campaign->getTotalPrice()),
                    'product_data' => [
                        'name' => 'Booster EventFlow',
                        'description' => (string) ($event?->getTitle() ?? 'Promotion l’évènement'),
                        'metadata' => [
                            'promotion_campaign_id' => (string) $campaignId,
                            'event_id' => (string) ($event?->getId() ?? ''),
                        ],
                    ],
                ],
            ]],
            'metadata' => [
                'promotion_campaign_id' => (string) $campaignId,
                'event_id' => (string) ($event?->getId() ?? ''),
                'organizer_id' => (string) ($organizer?->getId() ?? ''),
            ],
        ];

        $customerEmail = $organizer?->getEmail();

        if (is_string($customerEmail) && '' !== trim($customerEmail)) {
            $payload['customer_email'] = trim($customerEmail);
        }

        return $this->createClient()->checkout->sessions->create($payload);
    }

    public function constructWebhookEvent(string $payload, ?string $signatureHeader): Event
    {
        $webhookSecret = $this->getStripeWebhookSecret();

        if (null === $webhookSecret) {
            throw new \RuntimeException("STRIPE_WEBHOOK_SECRET n'est pas configuré.");
        }

        if (null === $signatureHeader || '' === trim($signatureHeader)) {
            throw new \InvalidArgumentException('La signature Stripe est manquante.');
        }

        return Webhook::constructEvent($payload, $signatureHeader, $webhookSecret);
    }

    private function assertWebhookConfigured(): void
    {
        if (null === $this->getStripeWebhookSecret()) {
            throw new \RuntimeException(
                "STRIPE_WEBHOOK_SECRET n'est pas configuré. Lance stripe listen et copie le whsec avant de lancer un paiement."
            );
        }
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

    public function extractPromotionCampaignIdFromSession(Session $session): ?int
    {
        $metadata = $this->normalizeMetadata($session->metadata);
        $rawCampaignId = $metadata['promotion_campaign_id'] ?? null;

        if (!is_scalar($rawCampaignId) || !is_numeric((string) $rawCampaignId)) {
            return null;
        }

        $campaignId = (int) $rawCampaignId;

        return $campaignId > 0 ? $campaignId : null;
    }

    public function retrievePromotionCheckoutSession(string $sessionId): Session
    {
        $sessionId = trim($sessionId);

        if ('' === $sessionId || !str_starts_with($sessionId, 'cs_')) {
            throw new \InvalidArgumentException('Identifiant de session Stripe invalide.');
        }

        return $this->createClient()->checkout->sessions->retrieve($sessionId, []);
    }

    public function assertPaidPromotionSession(Session $session, PromotionCampaign $campaign): void
    {
        if ((int) $campaign->getId() !== $this->extractPromotionCampaignIdFromSession($session)) {
            throw new \LogicException('Cette session Stripe ne correspond pas à la campagne.');
        }

        if ('paid' !== (string) $session->payment_status) {
            throw new \LogicException('Stripe ne confirme pas encore ce paiement.');
        }

        if ($this->moneyStringToCents($campaign->getTotalPrice()) !== (int) ($session->amount_total ?? -1)) {
            throw new \LogicException('Le montant confirmé par Stripe ne correspond pas à la campagne.');
        }

        if (strtolower($campaign->getCurrency()) !== strtolower((string) ($session->currency ?? ''))) {
            throw new \LogicException('La devise confirmée par Stripe ne correspond pas à la campagne.');
        }
    }

    public function findPaidPromotionSession(PromotionCampaign $campaign, int $limit = 100): ?Session
    {
        $sessions = $this->createClient()->checkout->sessions->all([
            'limit' => max(1, min(100, $limit)),
        ]);

        foreach ($sessions->data as $session) {
            if (!$session instanceof Session) {
                continue;
            }

            if ((int) $campaign->getId() !== $this->extractPromotionCampaignIdFromSession($session)) {
                continue;
            }

            try {
                $this->assertPaidPromotionSession($session, $campaign);

                return $session;
            } catch (\LogicException) {
                continue;
            }
        }

        return null;
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

    public function recordPromotionOrder(PromotionCampaign $campaign, Session $session): Order
    {
        $existingOrder = $this->entityManager->getRepository(Order::class)->findOneBy([
            'promotionCampaign' => $campaign,
        ]);

        if ($existingOrder instanceof Order) {
            return $existingOrder;
        }

        $campaignId = (int) $campaign->getId();
        $paidAt = $campaign->getPaidAt() ?? new \DateTimeImmutable();
        $organizer = $campaign->getOrganizer();

        if (null === $organizer) {
            throw new \LogicException('Organisateur de campagne introuvable.');
        }

        $order = (new Order())
            ->setClient($organizer)
            ->setPromotionCampaign($campaign)
            ->setReference(sprintf('BST-%s-%06d', $paidAt->format('Ymd'), $campaignId))
            ->setStatus(Order::STATUS_PAID)
            ->setOrderType(Order::TYPE_PROMOTION)
            ->setTotalAmount($campaign->getTotalPrice())
            ->setCurrency($campaign->getCurrency())
            ->setCreatedAt($paidAt)
        ;

        $payment = (new Payment())
            ->setCustomerOrder($order)
            ->setProvider(Payment::PROVIDER_STRIPE)
            ->setProviderPaymentId($this->resolveProviderPaymentId($session))
            ->setAmount($campaign->getTotalPrice())
            ->setCurrency($campaign->getCurrency())
            ->setStatus(Payment::STATUS_PAID)
            ->setPaidAt($paidAt)
        ;

        $order->setPayment($payment);
        $campaign->addOrder($order);
        $this->entityManager->persist($order);
        $this->entityManager->persist($payment);

        return $order;
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
            throw new \RuntimeException("STRIPE_SECRET_KEY n'est pas configuré.");
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
