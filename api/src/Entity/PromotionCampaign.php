<?php

namespace App\Entity;

use App\Repository\PromotionCampaignRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PromotionCampaignRepository::class)]
#[ORM\Table(name: 'promotion_campaigns')]
#[ORM\Index(name: 'idx_promotion_campaign_status_dates', columns: ['status', 'starts_at', 'ends_at'])]
class PromotionCampaign
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_APPROVED,
        self::STATUS_ACTIVE,
        self::STATUS_EXPIRED,
        self::STATUS_REJECTED,
        self::STATUS_CANCELLED,
    ];

    public const DURATION_7_DAYS = '7_days';
    public const DURATION_14_DAYS = '14_days';
    public const DURATION_30_DAYS = '30_days';

    public const DURATIONS = [
        self::DURATION_7_DAYS,
        self::DURATION_14_DAYS,
        self::DURATION_30_DAYS,
    ];

    public const DEFAULT_CURRENCY = 'EUR';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_promotion_campaign')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'promotionCampaigns')]
    #[ORM\JoinColumn(name: 'event_id', referencedColumnName: 'id_event', nullable: false, onDelete: 'CASCADE')]
    private ?Event $event = null;

    #[ORM\ManyToOne(inversedBy: 'promotionCampaigns')]
    #[ORM\JoinColumn(name: 'organizer_user_id', referencedColumnName: 'id_user', nullable: false)]
    private ?User $organizer = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'reviewed_by_user_id', referencedColumnName: 'id_user', nullable: true, onDelete: 'SET NULL')]
    private ?User $reviewedBy = null;

    #[ORM\Column(name: 'status', length: 20, options: ['default' => self::STATUS_PENDING])]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column(name: 'duration', length: 20)]
    private ?string $duration = null;

    #[ORM\Column(name: 'starts_at')]
    private ?\DateTimeImmutable $startsAt = null;

    #[ORM\Column(name: 'ends_at')]
    private ?\DateTimeImmutable $endsAt = null;

    #[ORM\Column(name: 'total_price', type: Types::DECIMAL, precision: 15, scale: 2)]
    private string $totalPrice = '0.00';

    #[ORM\Column(name: 'currency', length: 3, options: ['default' => self::DEFAULT_CURRENCY])]
    private string $currency = self::DEFAULT_CURRENCY;

    #[ORM\Column(name: 'admin_comment', type: Types::TEXT, nullable: true)]
    private ?string $adminComment = null;

    #[ORM\Column(name: 'approved_at', nullable: true)]
    private ?\DateTimeImmutable $approvedAt = null;

    #[ORM\Column(name: 'rejected_at', nullable: true)]
    private ?\DateTimeImmutable $rejectedAt = null;

    #[ORM\Column(name: 'cancelled_at', nullable: true)]
    private ?\DateTimeImmutable $cancelledAt = null;

    #[ORM\Column(name: 'paid_at', nullable: true)]
    private ?\DateTimeImmutable $paidAt = null;

    #[ORM\Column(name: 'stripe_session_id', length: 255, nullable: true, unique: true)]
    private ?string $stripeSessionId = null;

    #[ORM\Column(name: 'created_at')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at')]
    private \DateTimeImmutable $updatedAt;

    /**
     * @var Collection<int, PromotionCampaignChannel>
     */
    #[ORM\OneToMany(
        targetEntity: PromotionCampaignChannel::class,
        mappedBy: 'campaign',
        cascade: ['persist', 'remove'],
        orphanRemoval: true
    )]
    private Collection $channels;

    /**
     * @var Collection<int, PromotionCampaignMetric>
     */
    #[ORM\OneToMany(
        targetEntity: PromotionCampaignMetric::class,
        mappedBy: 'campaign',
        cascade: ['persist', 'remove'],
        orphanRemoval: true
    )]
    private Collection $metrics;

    /**
     * @var Collection<int, Order>
     */
    #[ORM\OneToMany(targetEntity: Order::class, mappedBy: 'promotionCampaign')]
    private Collection $orders;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
        $this->channels = new ArrayCollection();
        $this->metrics = new ArrayCollection();
        $this->orders = new ArrayCollection();
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

    public function getOrganizer(): ?User
    {
        return $this->organizer;
    }

    public function setOrganizer(?User $organizer): static
    {
        $this->organizer = $organizer;

        return $this;
    }

    public function getReviewedBy(): ?User
    {
        return $this->reviewedBy;
    }

    public function setReviewedBy(?User $reviewedBy): static
    {
        $this->reviewedBy = $reviewedBy;

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $status = strtolower(trim($status));

        if (!in_array($status, self::STATUSES, true)) {
            throw new \InvalidArgumentException('Statut de campagne de promotion invalide.');
        }

        $this->status = $status;

        return $this;
    }

    public function getDuration(): ?string
    {
        return $this->duration;
    }

    public function setDuration(string $duration): static
    {
        $duration = strtolower(trim($duration));

        if (!in_array($duration, self::DURATIONS, true)) {
            throw new \InvalidArgumentException('Duree de campagne de promotion invalide.');
        }

        $this->duration = $duration;

        return $this;
    }

    public function getStartsAt(): ?\DateTimeImmutable
    {
        return $this->startsAt;
    }

    public function setStartsAt(\DateTimeImmutable $startsAt): static
    {
        $this->startsAt = $startsAt;

        return $this;
    }

    public function getEndsAt(): ?\DateTimeImmutable
    {
        return $this->endsAt;
    }

    public function setEndsAt(\DateTimeImmutable $endsAt): static
    {
        $this->endsAt = $endsAt;

        return $this;
    }

    public function hasValidSchedule(): bool
    {
        return $this->startsAt instanceof \DateTimeImmutable
            && $this->endsAt instanceof \DateTimeImmutable
            && $this->endsAt > $this->startsAt;
    }

    public function isActiveAt(\DateTimeImmutable $date): bool
    {
        return self::STATUS_ACTIVE === $this->status
            && $this->startsAt instanceof \DateTimeImmutable
            && $this->endsAt instanceof \DateTimeImmutable
            && $this->startsAt <= $date
            && $this->endsAt >= $date;
    }

    public function getTotalPrice(): string
    {
        return $this->totalPrice;
    }

    public function setTotalPrice(string $totalPrice): static
    {
        $this->totalPrice = $this->normalizeMoneyAmount(
            $totalPrice,
            'Prix total de campagne invalide.',
        );

        return $this;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): static
    {
        $currency = strtoupper(trim($currency));

        if (3 !== strlen($currency)) {
            throw new \InvalidArgumentException('Devise de campagne invalide.');
        }

        $this->currency = $currency;

        return $this;
    }

    public function getAdminComment(): ?string
    {
        return $this->adminComment;
    }

    public function setAdminComment(?string $adminComment): static
    {
        $adminComment = null !== $adminComment ? trim($adminComment) : null;
        $this->adminComment = null !== $adminComment && '' !== $adminComment
            ? $adminComment
            : null;

        return $this;
    }

    public function getApprovedAt(): ?\DateTimeImmutable
    {
        return $this->approvedAt;
    }

    public function setApprovedAt(?\DateTimeImmutable $approvedAt): static
    {
        $this->approvedAt = $approvedAt;

        return $this;
    }

    public function getRejectedAt(): ?\DateTimeImmutable
    {
        return $this->rejectedAt;
    }

    public function setRejectedAt(?\DateTimeImmutable $rejectedAt): static
    {
        $this->rejectedAt = $rejectedAt;

        return $this;
    }

    public function getCancelledAt(): ?\DateTimeImmutable
    {
        return $this->cancelledAt;
    }

    public function setCancelledAt(?\DateTimeImmutable $cancelledAt): static
    {
        $this->cancelledAt = $cancelledAt;

        return $this;
    }

    public function getPaidAt(): ?\DateTimeImmutable
    {
        return $this->paidAt;
    }

    public function setPaidAt(?\DateTimeImmutable $paidAt): static
    {
        $this->paidAt = $paidAt;

        return $this;
    }

    public function getStripeSessionId(): ?string
    {
        return $this->stripeSessionId;
    }

    public function setStripeSessionId(?string $stripeSessionId): static
    {
        $stripeSessionId = null !== $stripeSessionId ? trim($stripeSessionId) : null;
        $this->stripeSessionId = null !== $stripeSessionId && '' !== $stripeSessionId
            ? $stripeSessionId
            : null;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    /**
     * @return Collection<int, PromotionCampaignChannel>
     */
    public function getChannels(): Collection
    {
        return $this->channels;
    }

    public function addChannel(PromotionCampaignChannel $channel): static
    {
        if (
            !$this->channels->contains($channel)
            && null !== $channel->getChannelCode()
            && $this->hasChannel($channel->getChannelCode())
        ) {
            throw new \InvalidArgumentException('Ce canal est déjà present dans la campagne.');
        }

        if (!$this->channels->contains($channel)) {
            $this->channels->add($channel);
            $channel->setCampaign($this);
        }

        return $this;
    }

    public function removeChannel(PromotionCampaignChannel $channel): static
    {
        if ($this->channels->removeElement($channel) && $channel->getCampaign() === $this) {
            $channel->setCampaign(null);
        }

        return $this;
    }

    public function hasChannel(string $channelCode): bool
    {
        foreach ($this->channels as $channel) {
            if ($channel->getChannelCode() === strtoupper(trim($channelCode))) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return Collection<int, PromotionCampaignMetric>
     */
    public function getMetrics(): Collection
    {
        return $this->metrics;
    }

    public function addMetric(PromotionCampaignMetric $metric): static
    {
        if (!$this->metrics->contains($metric)) {
            $this->metrics->add($metric);
            $metric->setCampaign($this);
        }

        return $this;
    }

    public function removeMetric(PromotionCampaignMetric $metric): static
    {
        if ($this->metrics->removeElement($metric) && $metric->getCampaign() === $this) {
            $metric->setCampaign(null);
        }

        return $this;
    }

    /**
     * @return Collection<int, Order>
     */
    public function getOrders(): Collection
    {
        return $this->orders;
    }

    public function addOrder(Order $order): static
    {
        if (!$this->orders->contains($order)) {
            $this->orders->add($order);
            $order->setPromotionCampaign($this);
        }

        return $this;
    }

    public function removeOrder(Order $order): static
    {
        if ($this->orders->removeElement($order) && $order->getPromotionCampaign() === $this) {
            $order->setPromotionCampaign(null);
        }

        return $this;
    }

    private function normalizeMoneyAmount(string $amount, string $errorMessage): string
    {
        $amount = str_replace(',', '.', trim($amount));

        if (1 !== preg_match('/^\d+(?:\.\d{1,2})?$/', $amount)) {
            throw new \InvalidArgumentException($errorMessage);
        }

        [$integerPart, $decimalPart] = array_pad(explode('.', $amount, 2), 2, '');
        $integerPart = ltrim($integerPart, '0');

        return ('' !== $integerPart ? $integerPart : '0').'.'.str_pad($decimalPart, 2, '0');
    }
}
