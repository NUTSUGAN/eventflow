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

    #[ORM\Column(name: 'base_price', type: Types::DECIMAL, precision: 15, scale: 2)]
    private ?string $basePrice = null;

    #[ORM\Column(name: 'stock')]
    private ?int $stock = null;

    #[ORM\Column(name: 'sale_start_at')]
    private ?\DateTimeImmutable $saleStartAt = null;

    #[ORM\Column(name: 'sale_end_at')]
    private ?\DateTimeImmutable $saleEndAt = null;

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

    public function getBasePrice(): ?string
    {
        return $this->basePrice;
    }

    public function setBasePrice(string $basePrice): static
    {
        $this->basePrice = $basePrice;

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

    public function getSaleStartAt(): ?\DateTimeImmutable
    {
        return $this->saleStartAt;
    }

    public function setSaleStartAt(\DateTimeImmutable $saleStartAt): static
    {
        $this->saleStartAt = $saleStartAt;

        return $this;
    }

    public function getSaleEndAt(): ?\DateTimeImmutable
    {
        return $this->saleEndAt;
    }

    public function setSaleEndAt(\DateTimeImmutable $saleEndAt): static
    {
        $this->saleEndAt = $saleEndAt;

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
            // set the owning side to null (unless already changed)
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
            // set the owning side to null (unless already changed)
            if ($ticket->getTicketType() === $this) {
                $ticket->setTicketType(null);
            }
        }

        return $this;
    }
}
