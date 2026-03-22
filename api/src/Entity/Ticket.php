<?php

namespace App\Entity;

use App\Repository\TicketRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TicketRepository::class)]
#[ORM\Table(name: 'tickets')]
class Ticket
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_ticket')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'tickets')]
    #[ORM\JoinColumn(name: 'order_id', referencedColumnName: 'id_order', nullable: false)]
    private ?Order $customerOrder = null;

    #[ORM\ManyToOne(inversedBy: 'tickets')]
    #[ORM\JoinColumn(name: 'ticket_type_id', referencedColumnName: 'id_ticket_type', nullable: false)]
    private ?TicketType $ticketType = null;

    #[ORM\Column(name: 'qr_token', length: 80)]
    private ?string $qrToken = null;

    #[ORM\Column(name: 'status', length: 20)]
    private ?string $status = null;

    #[ORM\Column(name: 'issued_at')]
    private ?\DateTimeImmutable $issuedAt = null;

    /**
     * @var Collection<int, Checkin>
     */
    #[ORM\OneToMany(targetEntity: Checkin::class, mappedBy: 'ticket')]
    private Collection $checkins;

    public function __construct()
    {
        $this->checkins = new ArrayCollection();
    }

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

    public function getQrToken(): ?string
    {
        return $this->qrToken;
    }

    public function setQrToken(string $qrToken): static
    {
        $this->qrToken = $qrToken;

        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getIssuedAt(): ?\DateTimeImmutable
    {
        return $this->issuedAt;
    }

    public function setIssuedAt(\DateTimeImmutable $issuedAt): static
    {
        $this->issuedAt = $issuedAt;

        return $this;
    }

    /**
     * @return Collection<int, Checkin>
     */
    public function getCheckins(): Collection
    {
        return $this->checkins;
    }

    public function addCheckin(Checkin $checkin): static
    {
        if (!$this->checkins->contains($checkin)) {
            $this->checkins->add($checkin);
            $checkin->setTicket($this);
        }

        return $this;
    }

    public function removeCheckin(Checkin $checkin): static
    {
        if ($this->checkins->removeElement($checkin)) {
            // set the owning side to null (unless already changed)
            if ($checkin->getTicket() === $this) {
                $checkin->setTicket(null);
            }
        }

        return $this;
    }
}
