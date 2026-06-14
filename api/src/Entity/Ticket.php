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
    public const STATUS_ISSUED = 'issued';
    public const STATUS_USED = 'used';
    public const STATUS_CANCELLED = 'cancelled';
    public const SOURCE_PURCHASE = 'purchase';
    public const SOURCE_INVITATION = 'invitation';

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

    #[ORM\Column(name: 'source', length: 20, options: ['default' => self::SOURCE_PURCHASE])]
    private string $source = self::SOURCE_PURCHASE;

    #[ORM\Column(name: 'recipient_email', length: 180, nullable: true)]
    private ?string $recipientEmail = null;

    #[ORM\Column(name: 'recipient_name', length: 120, nullable: true)]
    private ?string $recipientName = null;

    #[ORM\Column(name: 'issued_at')]
    private ?\DateTimeImmutable $issuedAt = null;

    #[ORM\Column(name: 'sent_at', nullable: true)]
    private ?\DateTimeImmutable $sentAt = null;

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

    public function getSource(): string
    {
        return $this->source;
    }

    public function setSource(string $source): static
    {
        $this->source = $source;

        return $this;
    }

    public function getRecipientEmail(): ?string
    {
        return $this->recipientEmail;
    }

    public function setRecipientEmail(?string $recipientEmail): static
    {
        $recipientEmail = null !== $recipientEmail ? trim($recipientEmail) : null;
        $this->recipientEmail = '' !== $recipientEmail ? $recipientEmail : null;

        return $this;
    }

    public function getRecipientName(): ?string
    {
        return $this->recipientName;
    }

    public function setRecipientName(?string $recipientName): static
    {
        $recipientName = null !== $recipientName ? trim($recipientName) : null;
        $this->recipientName = '' !== $recipientName ? $recipientName : null;

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

    public function getSentAt(): ?\DateTimeImmutable
    {
        return $this->sentAt;
    }

    public function setSentAt(?\DateTimeImmutable $sentAt): static
    {
        $this->sentAt = $sentAt;

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
