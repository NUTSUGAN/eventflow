<?php

namespace App\Entity;

use App\Repository\OrganizerStaffMemberRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: OrganizerStaffMemberRepository::class)]
#[ORM\Table(name: 'organizer_staff_members')]
#[ORM\UniqueConstraint(name: 'uq_organizer_staff_pair', columns: ['organizer_user_id', 'staff_user_id'])]
class OrganizerStaffMember
{
    public const STATUS_ACTIVE = 'active';
    public const STATUS_OUT_OF_SERVICE = 'out_of_service';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_organizer_staff_member')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'managedStaffMembers')]
    #[ORM\JoinColumn(name: 'organizer_user_id', referencedColumnName: 'id_user', nullable: false)]
    private ?User $organizer = null;

    #[ORM\ManyToOne(inversedBy: 'staffMemberships')]
    #[ORM\JoinColumn(name: 'staff_user_id', referencedColumnName: 'id_user', nullable: false)]
    private ?User $staffUser = null;

    #[ORM\Column(name: 'created_at')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(name: 'status', length: 30)]
    private ?string $status = self::STATUS_ACTIVE;

    #[ORM\Column(name: 'status_changed_at')]
    private ?\DateTimeImmutable $statusChangedAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getOrganizer(): ?User
    {
        return $this->organizer;
    }

    public function setOrganizer(?User $organizer): static
    {
        $this->organizer = $organizer;

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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

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

    public function getStatusChangedAt(): ?\DateTimeImmutable
    {
        return $this->statusChangedAt;
    }

    public function setStatusChangedAt(\DateTimeImmutable $statusChangedAt): static
    {
        $this->statusChangedAt = $statusChangedAt;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isOutOfService(): bool
    {
        return $this->status === self::STATUS_OUT_OF_SERVICE;
    }
}
