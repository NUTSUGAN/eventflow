<?php

namespace App\Entity;

use App\Repository\OrderItemRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: OrderItemRepository::class)]
#[ORM\Table(name: 'order_items')]
class OrderItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_order_item')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'orderItems')]
    #[ORM\JoinColumn(name: 'order_id', referencedColumnName: 'id_order', nullable: false)]
    private ?Order $customerOrder = null;

    #[ORM\ManyToOne(inversedBy: 'orderItems')]
    #[ORM\JoinColumn(name: 'ticket_type_id', referencedColumnName: 'id_ticket_type', nullable: false)]
    private ?TicketType $ticketType = null;

    #[ORM\Column(name: 'quantity')]
    private ?int $quantity = null;

    #[ORM\Column(name: 'unit_price_at_purchase', type: Types::DECIMAL, precision: 15, scale: 2)]
    private ?string $unitPriceAtPurchase = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCustomerOrder(): ?Order
    {
        return $this->customerOrder;
    }

    public function setCustomerOrder(?Order $customerOrder): static
    {
        $this->customerOrder = $customerOrder;

        return $this;
    }

    public function getTicketType(): ?TicketType
    {
        return $this->ticketType;
    }

    public function setTicketType(?TicketType $ticketType): static
    {
        $this->ticketType = $ticketType;

        return $this;
    }

    public function getQuantity(): ?int
    {
        return $this->quantity;
    }

    public function setQuantity(int $quantity): static
    {
        $this->quantity = $quantity;

        return $this;
    }

    public function getUnitPriceAtPurchase(): ?string
    {
        return $this->unitPriceAtPurchase;
    }

    public function setUnitPriceAtPurchase(string $unitPriceAtPurchase): static
    {
        $this->unitPriceAtPurchase = $unitPriceAtPurchase;

        return $this;
    }
}
