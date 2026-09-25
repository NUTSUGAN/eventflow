<?php

namespace App\Tests\Service;

use App\Entity\Event;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\TicketType;
use App\Entity\User;
use App\Service\FedaPayPaymentService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

final class FedaPayPaymentServiceTest extends TestCase
{
    public function testCreatesHostedPaymentWithExpectedMetadata(): void
    {
        $previous = $_SERVER['FEDAPAY_SECRET_KEY'] ?? null;
        $_SERVER['FEDAPAY_SECRET_KEY'] = 'sk_sandbox_test';
        $requests = [];
        $client = new MockHttpClient(function (string $method, string $url, array $options) use (&$requests): MockResponse {
            $requests[] = [$method, $url, json_decode((string) ($options['body'] ?? '{}'), true)];
            return 1 === count($requests)
                ? new MockResponse(json_encode(['id' => 123, 'status' => 'pending'], JSON_THROW_ON_ERROR), ['http_code' => 201])
                : new MockResponse(json_encode(['token' => 'token', 'url' => 'https://checkout.fedapay.com/test'], JSON_THROW_ON_ERROR));
        });
        $service = new FedaPayPaymentService($this->createMock(EntityManagerInterface::class), $client);
        $order = $this->createTicketOrder(
            new \DateTimeImmutable('2027-09-24 10:00:00'),
            new \DateTimeImmutable('2027-09-24 14:00:00'),
            new \DateTimeImmutable('2026-09-23 08:00:00'),
            new \DateTimeImmutable('2027-09-24 14:00:00'),
        );
        (new \ReflectionProperty(Order::class, 'id'))->setValue($order, 42);
        $order->setTotalAmount('5000.00');
        $order->setClient((new User())->setEmail('client@example.com'));

        try {
            $result = $service->createCheckoutSession($order);
            self::assertSame('https://checkout.fedapay.com/test', $result['checkoutUrl']);
            self::assertSame('123', $result['transactionId']);
            self::assertSame('POST', $requests[0][0]);
            self::assertSame('https://sandbox-api.fedapay.com/v1/transactions', $requests[0][1]);
            self::assertSame(5000, $requests[0][2]['amount']);
            self::assertSame('XOF', $requests[0][2]['currency']['iso']);
            self::assertSame('42', $requests[0][2]['custom_metadata']['order_id']);
        } finally {
            if (null === $previous) {
                unset($_SERVER['FEDAPAY_SECRET_KEY']);
            } else {
                $_SERVER['FEDAPAY_SECRET_KEY'] = $previous;
            }
        }
    }

    public function testWebhookSignatureIsVerified(): void
    {
        $previous = $_SERVER['FEDAPAY_WEBHOOK_SECRET'] ?? null;
        $_SERVER['FEDAPAY_WEBHOOK_SECRET'] = 'wh_sandbox_test';
        $service = $this->service();
        $payload = '{"id":1,"name":"transaction.approved","object":{"id":123}}';
        $timestamp = time();
        $signature = hash_hmac('sha256', $timestamp.'.'.$payload, 'wh_sandbox_test');

        try {
            $event = $service->constructWebhookEvent($payload, sprintf('t=%d,s=%s', $timestamp, $signature));
            self::assertSame(1, $event->id);
        } finally {
            if (null === $previous) {
                unset($_SERVER['FEDAPAY_WEBHOOK_SECRET']);
            } else {
                $_SERVER['FEDAPAY_WEBHOOK_SECRET'] = $previous;
            }
        }
    }

    public function testApprovedTransactionResolvesCurrencyFromCurrencyId(): void
    {
        $previous = $_SERVER['FEDAPAY_SECRET_KEY'] ?? null;
        $_SERVER['FEDAPAY_SECRET_KEY'] = 'sk_sandbox_test';
        $client = new MockHttpClient([
            new MockResponse(json_encode([
                'v1/currency' => ['id' => 1, 'iso' => 'XOF'],
            ], JSON_THROW_ON_ERROR)),
        ]);
        $service = new FedaPayPaymentService($this->createMock(EntityManagerInterface::class), $client);
        $order = $this->createTicketOrder(
            new \DateTimeImmutable('2027-09-24 10:00:00'),
            new \DateTimeImmutable('2027-09-24 14:00:00'),
            new \DateTimeImmutable('2026-09-23 08:00:00'),
            new \DateTimeImmutable('2027-09-24 14:00:00'),
        );
        (new \ReflectionProperty(Order::class, 'id'))->setValue($order, 35);
        $order->setTotalAmount('14431.00');

        try {
            $service->assertPaidOrderTransaction([
                'id' => 513227,
                'status' => 'approved',
                'amount' => 14431,
                'currency_id' => 1,
                'custom_metadata' => ['order_id' => '35'],
            ], $order);
            self::assertTrue(true);
        } finally {
            if (null === $previous) {
                unset($_SERVER['FEDAPAY_SECRET_KEY']);
            } else {
                $_SERVER['FEDAPAY_SECRET_KEY'] = $previous;
            }
        }
    }

    public function testTicketSaleCanStayOpenAfterEventStartBeforeEventEnd(): void
    {
        $order = $this->createTicketOrder(
            new \DateTimeImmutable('2026-09-24 10:00:00'),
            new \DateTimeImmutable('2026-09-24 14:00:00'),
            new \DateTimeImmutable('2026-09-23 08:00:00'),
            new \DateTimeImmutable('2026-09-24 14:00:00'),
        );
        $this->service()->assertOrderTicketSaleOpen($order, new \DateTimeImmutable('2026-09-24 11:30:00'));
        self::assertTrue(true);
    }

    public function testTicketSaleIsClosedAfterEventEnd(): void
    {
        $order = $this->createTicketOrder(
            new \DateTimeImmutable('2026-09-24 10:00:00'),
            new \DateTimeImmutable('2026-09-24 14:00:00'),
            new \DateTimeImmutable('2026-09-23 08:00:00'),
            new \DateTimeImmutable('2026-09-24 14:00:00'),
        );
        $this->expectException(\LogicException::class);
        $this->service()->assertOrderTicketSaleOpen($order, new \DateTimeImmutable('2026-09-24 14:00:00'));
    }

    private function service(): FedaPayPaymentService
    {
        return new FedaPayPaymentService(
            $this->createMock(EntityManagerInterface::class),
            new MockHttpClient(),
        );
    }

    private function createTicketOrder(
        \DateTimeImmutable $eventStartAt,
        \DateTimeImmutable $eventEndAt,
        \DateTimeImmutable $saleStartAt,
        \DateTimeImmutable $saleEndAt,
    ): Order {
        $event = (new Event())
            ->setTitle('Soutenance Final')
            ->setDescription('Présentation finale EventFlow.')
            ->setStartDatetime($eventStartAt)
            ->setEndDatetime($eventEndAt)
            ->setStatus('published')
            ->setCapacity(100)
            ->setThumbnailPhoto('/uploads/events/test.jpg')
            ->setCoverPhoto('/uploads/events/test-cover.jpg')
            ->setCreatedAt(new \DateTimeImmutable('2026-09-01 09:00:00'));
        $ticketType = (new TicketType())
            ->setEvent($event)
            ->setName('Accès soutenance')
            ->setPrice('5000.00')
            ->setStock(100)
            ->setSalesStartAt($saleStartAt)
            ->setSalesEndAt($saleEndAt)
            ->setIsActive(true)
            ->setCreatedAt(new \DateTimeImmutable('2026-09-01 09:00:00'));
        $order = (new Order())
            ->setReference('ORD-TEST')
            ->setStatus(Order::STATUS_PENDING_PAYMENT)
            ->setOrderType(Order::TYPE_TICKET)
            ->setCurrency(Order::DEFAULT_CURRENCY)
            ->setTotalAmount('5000.00')
            ->setCreatedAt(new \DateTimeImmutable('2026-09-24 11:00:00'));
        $order->addOrderItem((new OrderItem())->setTicketType($ticketType)->setQuantity(1)->setUnitPriceAtPurchase('5000.00'));
        return $order;
    }
}
