<?php

namespace App\Entity;

use App\Repository\CheckinRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CheckinRepository::class)]
#[ORM\Table(name: 'checkins')]
class Checkin
{
    public const RESULT_VALID = 'valid';
    public const RESULT_INVALID = 'invalid';
    public const RESULT_ALREADY_USED = 'already_used';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_checkin')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'checkins')]
    #[ORM\JoinColumn(name: 'ticket_id', referencedColumnName: 'id_ticket', nullable: true)]
    private ?Ticket $ticket = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'event_id', referencedColumnName: 'id_event', nullable: false)]
    private ?Event $event = null;

    #[ORM\ManyToOne(inversedBy: 'staffCheckins')]
    #[ORM\JoinColumn(name: 'staff_user_id', referencedColumnName: 'id_user', nullable: false)]
    private ?User $staffUser = null;

    #[ORM\Column(name: 'scanned_at')]
    private ?\DateTimeImmutable $scannedAt = null;

    #[ORM\Column(name: 'scanned_token', length: 120)]
    private ?string $scannedToken = null;

    #[ORM\Column(name: 'result', length: 20)]
    private ?string $result = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTicket(): ?Ticket
    {
        return $this->ticket;
    }

    public function setTicket(?Ticket $ticket): static
    {
        $this->ticket = $ticket;

        if ($ticket?->getTicketType()?->getEvent() instanceof Event && !$this->event instanceof Event) {
            $this->event = $ticket->getTicketType()->getEvent();
        }

        return $this;
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

    public function getStaffUser(): ?User
    {
        return $this->staffUser;
    }

    public function setStaffUser(?User $staffUser): static
    {
        $this->staffUser = $staffUser;

        return $this;
    }

    public function getScannedAt(): ?\DateTimeImmutable
    {
        return $this->scannedAt;
    }

    public function setScannedAt(\DateTimeImmutable $scannedAt): static
    {
        $this->scannedAt = $scannedAt;

        return $this;
    }

    public function getScannedToken(): ?string
    {
        return $this->scannedToken;
    }

    public function setScannedToken(string $scannedToken): static
    {
        $this->scannedToken = $scannedToken;

        return $this;
    }

    public function getResult(): ?string
    {
        return $this->result;
    }

    public function setResult(string $result): static
    {
        $this->result = $result;

        return $this;
    }
}
