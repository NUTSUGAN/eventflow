<?php

namespace App\Service;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Payment;
use App\Entity\PromotionCampaign;
use Doctrine\ORM\EntityManagerInterface;
use FedaPay\Event as FedaPayEvent;
use FedaPay\Webhook;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class FedaPayPaymentService
{
    private const RETRYABLE_ORDER_STATUSES = [
        Order::STATUS_PENDING_PAYMENT,
        Order::STATUS_EXPIRED,
    ];

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly HttpClientInterface $httpClient,
    ) {
    }

    public function canStartCheckout(Order $order): bool
    {
        return in_array((string) $order->getStatus(), self::RETRYABLE_ORDER_STATUSES, true);
    }

    /** @return array{checkoutUrl: string, transactionId: string} */
    public function createCheckoutSession(Order $order): array
    {
        if (!$this->canStartCheckout($order)) {
            throw new \LogicException('Cette commande nest pas disponible pour un nouveau paiement.');
        }

        if (0 === $order->getOrderItems()->count()) {
            throw new \LogicException('Cette commande ne contient aucun billet à payer.');
        }

        $this->assertOrderTicketSaleOpen($order);

        return $this->createTransaction([
            'description' => sprintf('Billets EventFlow - %s', $order->getReference()),
            'amount' => $this->moneyStringToInteger((string) $order->getTotalAmount()),
            'currency' => ['iso' => $this->currency()],
            'callback_url' => $this->buildOrderCallbackUrl($order),
            'merchant_reference' => sprintf('ticket-%s-%s', $order->getReference(), bin2hex(random_bytes(4))),
            'custom_metadata' => [
                'order_id' => (string) $order->getId(),
                'order_reference' => (string) $order->getReference(),
                'order_type' => Order::TYPE_TICKET,
            ],
            'customer' => $this->buildCustomer($order->getClient()),
        ]);
    }

    /** @return array{checkoutUrl: string, transactionId: string} */
    public function createPromotionCheckoutSession(PromotionCampaign $campaign): array
    {
        if (PromotionCampaign::STATUS_APPROVED !== $campaign->getStatus()) {
            throw new \LogicException('Seule une campagne approuvée peut être payée.');
        }

        if (null !== $campaign->getPaidAt()) {
            throw new \LogicException('Cette campagne a déjà été payée.');
        }

        $campaignId = (int) $campaign->getId();

        return $this->createTransaction([
            'description' => sprintf('Booster EventFlow - %s', $campaign->getEvent()?->getTitle() ?? 'Évènement'),
            'amount' => $this->moneyStringToInteger($campaign->getTotalPrice()),
            'currency' => ['iso' => $this->currency()],
            'callback_url' => $this->buildPromotionCallbackUrl($campaignId),
            'merchant_reference' => sprintf('booster-%d-%s', $campaignId, bin2hex(random_bytes(4))),
            'custom_metadata' => [
                'promotion_campaign_id' => (string) $campaignId,
                'event_id' => (string) ($campaign->getEvent()?->getId() ?? ''),
                'organizer_id' => (string) ($campaign->getOrganizer()?->getId() ?? ''),
                'order_type' => Order::TYPE_PROMOTION,
            ],
            'customer' => $this->buildCustomer($campaign->getOrganizer()),
        ]);
    }

    public function constructWebhookEvent(string $payload, ?string $signatureHeader): FedaPayEvent
    {
        $secret = $this->readEnv('FEDAPAY_WEBHOOK_SECRET');

        if (null === $secret) {
            throw new \RuntimeException("FEDAPAY_WEBHOOK_SECRET n'est pas configuré.");
        }

        if (null === $signatureHeader || '' === trim($signatureHeader)) {
            throw new \InvalidArgumentException('La signature FedaPay est manquante.');
        }

        return Webhook::constructEvent($payload, $signatureHeader, $secret);
    }

    /** @return array<string, mixed> */
    public function extractWebhookTransaction(FedaPayEvent $event): array
    {
        $object = $event->object;

        if (is_object($object) && method_exists($object, '__toArray')) {
            $object = $object->__toArray(true);
        }

        return is_array($object) ? $this->normalizeTransaction($object) : [];
    }

    /** @return array<string, mixed> */
    public function retrieveTransaction(string $transactionId): array
    {
        if (!ctype_digit($transactionId) || (int) $transactionId <= 0) {
            throw new \InvalidArgumentException('Identifiant de transaction FedaPay invalide.');
        }

        return $this->request('GET', '/transactions/'.$transactionId);
    }

    public function extractOrderId(array $transaction): ?int
    {
        return $this->positiveMetadataId($transaction, 'order_id');
    }

    public function extractPromotionCampaignId(array $transaction): ?int
    {
        return $this->positiveMetadataId($transaction, 'promotion_campaign_id');
    }

    public function assertPaidOrderTransaction(array $transaction, Order $order): void
    {
        if ((int) $order->getId() !== $this->extractOrderId($transaction)) {
            throw new \LogicException('Cette transaction FedaPay ne correspond pas à la commande.');
        }

        $this->assertApprovedAmountAndCurrency(
            $transaction,
            $this->moneyStringToInteger((string) $order->getTotalAmount()),
            (string) $order->getCurrency(),
        );
    }

    public function assertPaidPromotionTransaction(array $transaction, PromotionCampaign $campaign): void
    {
        if ((int) $campaign->getId() !== $this->extractPromotionCampaignId($transaction)) {
            throw new \LogicException('Cette transaction FedaPay ne correspond pas à la campagne.');
        }

        $this->assertApprovedAmountAndCurrency(
            $transaction,
            $this->moneyStringToInteger($campaign->getTotalPrice()),
            $campaign->getCurrency(),
        );
    }

    public function markOrderAsPaid(Order $order, array $transaction): void
    {
        if (Order::STATUS_PAID === $order->getStatus() && null !== $order->getPayment()) {
            return;
        }

        $this->assertOrderTicketSaleOpen($order);
        $this->assertPaidOrderTransaction($transaction, $order);

        $payment = $order->getPayment() ?? new Payment();
        $payment
            ->setCustomerOrder($order)
            ->setProvider(Payment::PROVIDER_FEDAPAY)
            ->setProviderPaymentId((string) $transaction['id'])
            ->setAmount((string) $order->getTotalAmount())
            ->setCurrency(strtoupper((string) $order->getCurrency()))
            ->setStatus(Payment::STATUS_PAID)
            ->setPaidAt(new \DateTimeImmutable())
        ;

        $order->setStatus(Order::STATUS_PAID)->setPayment($payment);
        $this->entityManager->persist($payment);
        $this->entityManager->flush();
    }

    public function recordPromotionOrder(PromotionCampaign $campaign, array $transaction): Order
    {
        $existing = $this->entityManager->getRepository(Order::class)->findOneBy(['promotionCampaign' => $campaign]);

        if ($existing instanceof Order) {
            return $existing;
        }

        $organizer = $campaign->getOrganizer();
        if (null === $organizer) {
            throw new \LogicException('Organisateur de campagne introuvable.');
        }

        $paidAt = $campaign->getPaidAt() ?? new \DateTimeImmutable();
        $order = (new Order())
            ->setClient($organizer)
            ->setPromotionCampaign($campaign)
            ->setReference(sprintf('BST-%s-%06d', $paidAt->format('Ymd'), (int) $campaign->getId()))
            ->setStatus(Order::STATUS_PAID)
            ->setOrderType(Order::TYPE_PROMOTION)
            ->setTotalAmount($campaign->getTotalPrice())
            ->setCurrency($campaign->getCurrency())
            ->setCreatedAt($paidAt)
        ;
        $payment = (new Payment())
            ->setCustomerOrder($order)
            ->setProvider(Payment::PROVIDER_FEDAPAY)
            ->setProviderPaymentId((string) $transaction['id'])
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
        if (Order::STATUS_PAID === $order->getStatus() || Order::STATUS_EXPIRED === $order->getStatus()) {
            return;
        }

        $order->setStatus(Order::STATUS_EXPIRED);
        $this->entityManager->flush();
    }

    public function assertOrderTicketSaleOpen(Order $order, ?\DateTimeImmutable $now = null): void
    {
        if (Order::TYPE_TICKET !== $order->getOrderType()) {
            return;
        }

        $now ??= new \DateTimeImmutable();
        foreach ($order->getOrderItems() as $item) {
            if (!$item instanceof OrderItem) {
                continue;
            }
            $ticketType = $item->getTicketType();
            $event = $ticketType?->getEvent();
            if (null === $ticketType || null === $event || !$ticketType->isActive()
                || 'published' !== strtolower((string) $event->getStatus())
                || $ticketType->getSalesStartAt() > $now
                || $ticketType->getSalesEndAt() <= $now
                || ($event->getEndDatetime() ?? $event->getStartDatetime()) <= $now) {
                throw new \LogicException('La vente de ces billets est fermée.');
            }
        }
    }

    /** @param array<string, mixed> $payload
     *  @return array{checkoutUrl: string, transactionId: string}
     */
    private function createTransaction(array $payload): array
    {
        $transaction = $this->request('POST', '/transactions', $payload);
        $id = $transaction['id'] ?? null;
        if (!is_int($id) && !(is_string($id) && ctype_digit($id))) {
            throw new \RuntimeException('Réponse FedaPay invalide lors de la création de la transaction.');
        }

        $token = $this->request('POST', sprintf('/transactions/%s/token', $id), []);
        $url = $token['url'] ?? null;
        if (!is_string($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            throw new \RuntimeException('FedaPay n’a pas fourni de lien de paiement valide.');
        }

        return ['checkoutUrl' => $url, 'transactionId' => (string) $id];
    }

    /** @param array<string, mixed>|null $json
     *  @return array<string, mixed>
     */
    private function request(string $method, string $path, ?array $json = null): array
    {
        $key = $this->readEnv('FEDAPAY_SECRET_KEY');
        if (null === $key) {
            throw new \RuntimeException("FEDAPAY_SECRET_KEY n'est pas configuré.");
        }

        try {
            $options = ['auth_bearer' => $key, 'headers' => ['Accept' => 'application/json']];
            if (null !== $json) {
                $options['json'] = $json;
            }
            $response = $this->httpClient->request($method, $this->baseUrl().$path, $options);
            $status = $response->getStatusCode();
            $data = $response->toArray(false);
        } catch (TransportExceptionInterface $exception) {
            throw new \RuntimeException('Impossible de contacter FedaPay pour le moment.', 0, $exception);
        }

        if ($status < 200 || $status >= 300) {
            $message = is_string($data['message'] ?? null) ? $data['message'] : 'FedaPay a refusé la requête.';
            throw new \RuntimeException($message);
        }

        return $this->normalizeTransaction($data);
    }

    /** @param array<string, mixed> $data
     *  @return array<string, mixed>
     */
    private function normalizeTransaction(array $data): array
    {
        foreach (['transaction', 'v1/transaction', 'currency', 'v1/currency', 'data'] as $key) {
            if (isset($data[$key]) && is_array($data[$key])) {
                return $data[$key];
            }
        }
        return $data;
    }

    /** @param array<string, mixed> $transaction */
    private function assertApprovedAmountAndCurrency(array $transaction, int $expectedAmount, string $expectedCurrency): void
    {
        if (!in_array(strtolower((string) ($transaction['status'] ?? '')), ['approved', 'transferred'], true)) {
            throw new \LogicException('FedaPay ne confirme pas encore ce paiement.');
        }
        if ((int) ($transaction['amount'] ?? -1) !== $expectedAmount) {
            throw new \LogicException('Le montant confirmé par FedaPay ne correspond pas au paiement attendu.');
        }
        $currency = $transaction['currency']['iso'] ?? $transaction['currency_iso'] ?? $transaction['currency'] ?? '';
        if (is_array($currency)) {
            $currency = $currency['iso'] ?? '';
        }
        if ('' === trim((string) $currency)) {
            $currencyId = $transaction['currency_id'] ?? null;
            if (is_int($currencyId) || (is_string($currencyId) && ctype_digit($currencyId))) {
                $currencyResource = $this->request('GET', '/currencies/'.(string) $currencyId);
                $currency = $currencyResource['iso'] ?? '';
            }
        }
        if (strtoupper((string) $currency) !== strtoupper($expectedCurrency)) {
            throw new \LogicException('La devise confirmée par FedaPay ne correspond pas au paiement attendu.');
        }
    }

    /** @param array<string, mixed> $transaction */
    private function positiveMetadataId(array $transaction, string $key): ?int
    {
        $metadata = $transaction['custom_metadata'] ?? $transaction['metadata'] ?? [];
        $value = is_array($metadata) ? ($metadata[$key] ?? null) : null;
        return is_scalar($value) && ctype_digit((string) $value) && (int) $value > 0 ? (int) $value : null;
    }

    /** @return array<string, string> */
    private function buildCustomer(?object $user): array
    {
        $email = method_exists($user, 'getEmail') ? trim((string) $user->getEmail()) : '';
        if ('' === $email) {
            throw new \LogicException('Une adresse e-mail client est nécessaire pour payer avec FedaPay.');
        }
        $name = method_exists($user, 'getName') ? trim((string) $user->getName()) : '';
        return ['email' => $email, 'firstname' => '' !== $name ? $name : 'Client', 'lastname' => 'EventFlow'];
    }

    private function buildOrderCallbackUrl(Order $order): string
    {
        $frontend = $this->frontendUrl();
        $template = $this->readEnv('FEDAPAY_ORDER_CALLBACK_URL')
            ?? $frontend.'/checkout/success?orderId={ORDER_ID}';
        return str_replace('{ORDER_ID}', (string) $order->getId(), $template);
    }

    private function buildPromotionCallbackUrl(int $campaignId): string
    {
        $frontend = $this->frontendUrl();
        $template = $this->readEnv('FEDAPAY_PROMOTION_CALLBACK_URL')
            ?? $frontend.'/organizer/promotions?payment=success&campaignId={CAMPAIGN_ID}';
        return str_replace('{CAMPAIGN_ID}', (string) $campaignId, $template);
    }

    private function frontendUrl(): string
    {
        $url = $this->readEnv('FRONTEND_APP_URL');
        if (null === $url) {
            throw new \RuntimeException("FRONTEND_APP_URL n'est pas configuré.");
        }
        return rtrim($url, '/');
    }

    private function baseUrl(): string
    {
        $configured = $this->readEnv('FEDAPAY_BASE_URL');
        if (null !== $configured) {
            return rtrim($configured, '/');
        }
        return 'live' === strtolower($this->readEnv('FEDAPAY_ENVIRONMENT') ?? 'sandbox')
            ? 'https://api.fedapay.com/v1'
            : 'https://sandbox-api.fedapay.com/v1';
    }

    private function currency(): string
    {
        return strtoupper($this->readEnv('FEDAPAY_CURRENCY') ?? Order::DEFAULT_CURRENCY);
    }

    private function readEnv(string $name): ?string
    {
        $value = $_SERVER[$name] ?? $_ENV[$name] ?? getenv($name);
        return is_string($value) && '' !== trim($value) ? trim($value) : null;
    }

    private function moneyStringToInteger(string $amount): int
    {
        return (int) round((float) $amount);
    }
}
