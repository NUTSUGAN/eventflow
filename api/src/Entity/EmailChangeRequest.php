<?php

namespace App\Entity;

use App\Repository\EmailChangeRequestRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EmailChangeRequestRepository::class)]
#[ORM\Table(name: 'email_change_requests')]
class EmailChangeRequest
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_email_change_request')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id_user', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(name: 'current_email', length: 180)]
    private ?string $currentEmail = null;

    #[ORM\Column(name: 'new_email', length: 180)]
    private ?string $newEmail = null;

    #[ORM\Column(name: 'token_hash', length: 64, unique: true)]
    private ?string $tokenHash = null;

    #[ORM\Column(name: 'requested_at')]
    private ?\DateTimeImmutable $requestedAt = null;

    #[ORM\Column(name: 'expires_at')]
    private ?\DateTimeImmutable $expiresAt = null;

    #[ORM\Column(name: 'used_at', nullable: true)]
    private ?\DateTimeImmutable $usedAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getCurrentEmail(): ?string
    {
        return $this->currentEmail;
    }

    public function setCurrentEmail(string $currentEmail): static
    {
        $this->currentEmail = trim($currentEmail);

        return $this;
    }

    public function getNewEmail(): ?string
    {
        return $this->newEmail;
    }

    public function setNewEmail(string $newEmail): static
    {
        $this->newEmail = trim($newEmail);

        return $this;
    }

    public function getTokenHash(): ?string
    {
        return $this->tokenHash;
    }

    public function setTokenHash(string $tokenHash): static
    {
        $this->tokenHash = $tokenHash;

        return $this;
    }

    public function getRequestedAt(): ?\DateTimeImmutable
    {
        return $this->requestedAt;
    }

    public function setRequestedAt(\DateTimeImmutable $requestedAt): static
    {
        $this->requestedAt = $requestedAt;

        return $this;
    }

    public function getExpiresAt(): ?\DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTimeImmutable $expiresAt): static
    {
        $this->expiresAt = $expiresAt;

        return $this;
    }

    public function getUsedAt(): ?\DateTimeImmutable
    {
        return $this->usedAt;
    }

    public function setUsedAt(?\DateTimeImmutable $usedAt): static
    {
        $this->usedAt = $usedAt;

        return $this;
    }
}
