<?php

namespace App\Tests\Service;

use App\Entity\Event;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\TicketType;
use App\Service\StripePaymentService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

final class StripePaymentServiceTest extends TestCase
{
    public function testTicketSaleCanStayOpenAfterEventStartBeforeEventEnd(): void
    {
        $service = new StripePaymentService($this->createMock(EntityManagerInterface::class));
        $order = $this->createTicketOrder(
            new \DateTimeImmutable('2026-09-24 10:00:00'),
            new \DateTimeImmutable('2026-09-24 14:00:00'),
            new \DateTimeImmutable('2026-09-23 08:00:00'),
            new \DateTimeImmutable('2026-09-24 14:00:00'),
        );

        $service->assertOrderTicketSaleOpen($order, new \DateTimeImmutable('2026-09-24 11:30:00'));

        self::assertTrue(true);
    }

    public function testTicketSaleIsClosedAfterEventEnd(): void
    {
        $service = new StripePaymentService($this->createMock(EntityManagerInterface::class));
        $order = $this->createTicketOrder(
            new \DateTimeImmutable('2026-09-24 10:00:00'),
            new \DateTimeImmutable('2026-09-24 14:00:00'),
            new \DateTimeImmutable('2026-09-23 08:00:00'),
            new \DateTimeImmutable('2026-09-24 14:00:00'),
        );

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('La vente de ces billets est fermée.');

        $service->assertOrderTicketSaleOpen($order, new \DateTimeImmutable('2026-09-24 14:00:00'));
    }

    public function testTicketSaleIsClosedAfterTicketSaleEnd(): void
    {
        $service = new StripePaymentService($this->createMock(EntityManagerInterface::class));
        $order = $this->createTicketOrder(
            new \DateTimeImmutable('2026-09-24 10:00:00'),
            new \DateTimeImmutable('2026-09-24 14:00:00'),
            new \DateTimeImmutable('2026-09-23 08:00:00'),
            new \DateTimeImmutable('2026-09-24 12:00:00'),
        );

        $this->expectException(\LogicException::class);
        $this->expectExceptionMessage('La vente de ces billets est fermée.');

        $service->assertOrderTicketSaleOpen($order, new \DateTimeImmutable('2026-09-24 12:00:00'));
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
            ->setPrice('0.00')
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
            ->setTotalAmount('0.00')
            ->setCreatedAt(new \DateTimeImmutable('2026-09-24 11:00:00'));

        $orderItem = (new OrderItem())
            ->setTicketType($ticketType)
            ->setQuantity(1)
            ->setUnitPriceAtPurchase('0.00');

        $order->addOrderItem($orderItem);

        return $order;
    }
}
