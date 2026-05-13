<?php

namespace App\Entity;

use App\Repository\UserOauthAccountRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: UserOauthAccountRepository::class)]
#[ORM\Table(
    name: 'user_oauth_accounts',
    uniqueConstraints: [
        new ORM\UniqueConstraint(
            name: 'uq_user_oauth_provider_identity',
            columns: ['provider', 'provider_user_id']
        )
    ]
)]
class UserOauthAccount
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_user_oauth_account')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'oauthAccounts')]
    #[ORM\JoinColumn(
        name: 'user_id',
        referencedColumnName: 'id_user',
        nullable: false,
        onDelete: 'CASCADE'
    )]
    private ?User $user = null;

    #[ORM\Column(name: 'provider', length: 40)]
    private ?string $provider = null;

    #[ORM\Column(name: 'provider_user_id', length: 190)]
    private ?string $providerUserId = null;

    #[ORM\Column(name: 'provider_email', length: 180, nullable: true)]
    private ?string $providerEmail = null;

    #[ORM\Column(name: 'created_at')]
    private ?\DateTimeImmutable $createdAt = null;

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

    public function getProvider(): ?string
    {
        return $this->provider;
    }

    public function setProvider(string $provider): static
    {
        $this->provider = strtolower(trim($provider));

        return $this;
    }

    public function getProviderUserId(): ?string
    {
        return $this->providerUserId;
    }

    public function setProviderUserId(string $providerUserId): static
    {
        $this->providerUserId = trim($providerUserId);

        return $this;
    }

    public function getProviderEmail(): ?string
    {
        return $this->providerEmail;
    }

    public function setProviderEmail(?string $providerEmail): static
    {
        $this->providerEmail = $providerEmail !== null ? trim($providerEmail) : null;

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
}
