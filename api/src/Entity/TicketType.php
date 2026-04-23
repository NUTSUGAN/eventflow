<?php

namespace App\Entity;

use App\Repository\TicketTypeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TicketTypeRepository::class)]
#[ORM\Table(name: 'ticket_types')]
class TicketType
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_ticket_type')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'ticketTypes')]
    #[ORM\JoinColumn(name: 'event_id', referencedColumnName: 'id_event', nullable: false)]
    private ?Event $event = null;

    #[ORM\Column(name: 'name', length: 60)]
    private ?string $name = null;

    #[ORM\Column(name: 'type', length: 30)]
    private ?string $type = null;

    #[ORM\Column(name: 'base_price', type: Types::DECIMAL, precision: 15, scale: 2)]
    private ?string $price = null;

    #[ORM\Column(name: 'stock')]
    private ?int $stock = null;

    #[ORM\Column(name: 'sale_start_at')]
    private ?\DateTimeImmutable $salesStartAt = null;

    #[ORM\Column(name: 'sale_end_at')]
    private ?\DateTimeImmutable $salesEndAt = null;

    #[ORM\Column(name: 'max_per_order', nullable: true)]
    private ?int $maxPerOrder = null;

    #[ORM\Column(name: 'is_active', options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\Column(name: 'created_at')]
    private ?\DateTimeImmutable $createdAt = null;

    /**
     * @var Collection<int, OrderItem>
     */
    #[ORM\OneToMany(targetEntity: OrderItem::class, mappedBy: 'ticketType')]
    private Collection $orderItems;

    /**
     * @var Collection<int, Ticket>
     */
    #[ORM\OneToMany(targetEntity: Ticket::class, mappedBy: 'ticketType')]
    private Collection $tickets;

    public function __construct()
    {
        $this->orderItems = new ArrayCollection();
        $this->tickets = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEvent(): ?Event
    {
        return $this->event;
    }

    public function setEvent(?Event $event): static
    {
        $this->event = $event;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getPrice(): ?string
    {
        return $this->price;
    }

    public function setPrice(string $price): static
    {
        $this->price = $price;

        return $this;
    }

    public function getStock(): ?int
    {
        return $this->stock;
    }

    public function setStock(int $stock): static
    {
        $this->stock = $stock;

        return $this;
    }

    public function getSalesStartAt(): ?\DateTimeImmutable
    {
        return $this->salesStartAt;
    }

    public function setSalesStartAt(\DateTimeImmutable $salesStartAt): static
    {
        $this->salesStartAt = $salesStartAt;

        return $this;
    }

    public function getSalesEndAt(): ?\DateTimeImmutable
    {
        return $this->salesEndAt;
    }

    public function setSalesEndAt(\DateTimeImmutable $salesEndAt): static
    {
        $this->salesEndAt = $salesEndAt;

        return $this;
    }

    public function getMaxPerOrder(): ?int
    {
        return $this->maxPerOrder;
    }

    public function setMaxPerOrder(?int $maxPerOrder): static
    {
        $this->maxPerOrder = $maxPerOrder;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    /**
     * @return Collection<int, OrderItem>
     */
    public function getOrderItems(): Collection
    {
        return $this->orderItems;
    }

    public function addOrderItem(OrderItem $orderItem): static
    {
        if (!$this->orderItems->contains($orderItem)) {
            $this->orderItems->add($orderItem);
            $orderItem->setTicketType($this);
        }

        return $this;
    }

    public function removeOrderItem(OrderItem $orderItem): static
    {
        if ($this->orderItems->removeElement($orderItem)) {
            if ($orderItem->getTicketType() === $this) {
                $orderItem->setTicketType(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Ticket>
     */
    public function getTickets(): Collection
    {
        return $this->tickets;
    }

    public function addTicket(Ticket $ticket): static
    {
        if (!$this->tickets->contains($ticket)) {
            $this->tickets->add($ticket);
            $ticket->setTicketType($this);
        }

        return $this;
    }

    public function removeTicket(Ticket $ticket): static
    {
        if ($this->tickets->removeElement($ticket)) {
            if ($ticket->getTicketType() === $this) {
                $ticket->setTicketType(null);
            }
        }

        return $this;
    }
}