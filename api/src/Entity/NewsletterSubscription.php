<?php

namespace App\Entity;

use App\Repository\NewsletterSubscriptionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: NewsletterSubscriptionRepository::class)]
#[ORM\Table(
    name: 'newsletter_subscriptions',
    uniqueConstraints: [
        new ORM\UniqueConstraint(name: 'uq_newsletter_email', columns: ['email'])
    ]
)]
class NewsletterSubscription
{
    public const STATUS_SUBSCRIBED = 'SUBSCRIBED';
    public const STATUS_UNSUBSCRIBED = 'UNSUBSCRIBED';

    public const SOURCE_REGISTER = 'register';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_newsletter_subscription')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'newsletterSubscriptions')]
    #[ORM\JoinColumn(
        name: 'user_id',
        referencedColumnName: 'id_user',
        nullable: true,
        onDelete: 'SET NULL'
    )]
    private ?User $user = null;

    #[ORM\Column(name: 'email', length: 180)]
    private ?string $email = null;

    #[ORM\Column(name: 'status', length: 20)]
    private ?string $status = self::STATUS_SUBSCRIBED;

    #[ORM\Column(name: 'source', length: 40)]
    private ?string $source = self::SOURCE_REGISTER;

    #[ORM\Column(name: 'consented_at')]
    private ?\DateTimeImmutable $consentedAt = null;

    #[ORM\Column(name: 'unsubscribed_at', nullable: true)]
    private ?\DateTimeImmutable $unsubscribedAt = null;

    #[ORM\Column(name: 'created_at')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(name: 'updated_at')]
    private ?\DateTimeImmutable $updatedAt = null;

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

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = trim($email);

        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = strtoupper(trim($status));

        return $this;
    }

    public function getSource(): ?string
    {
        return $this->source;
    }

    public function setSource(string $source): static
    {
        $this->source = strtolower(trim($source));

        return $this;
    }

    public function getConsentedAt(): ?\DateTimeImmutable
    {
        return $this->consentedAt;
    }

    public function setConsentedAt(\DateTimeImmutable $consentedAt): static
    {
        $this->consentedAt = $consentedAt;

        return $this;
    }

    public function getUnsubscribedAt(): ?\DateTimeImmutable
    {
        return $this->unsubscribedAt;
    }

    public function setUnsubscribedAt(?\DateTimeImmutable $unsubscribedAt): static
    {
        $this->unsubscribedAt = $unsubscribedAt;

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

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }
}
