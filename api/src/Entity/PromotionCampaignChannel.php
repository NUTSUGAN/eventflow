<?php

namespace App\Entity;

use App\Repository\PromotionCampaignChannelRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PromotionCampaignChannelRepository::class)]
#[ORM\Table(name: 'promotion_campaign_channels')]
#[ORM\UniqueConstraint(name: 'uniq_campaign_channel', columns: ['promotion_campaign_id', 'channel_code'])]
#[ORM\Index(name: 'idx_promotion_channel_delivery', columns: ['channel_code', 'delivery_status'])]
class PromotionCampaignChannel
{
    public const CHANNEL_LAUNCH_PACK = 'LAUNCH_PACK';
    public const CHANNEL_SOCIAL_INFLUENCER = 'SOCIAL_INFLUENCER';
    public const CHANNEL_NEWSLETTER = 'NEWSLETTER';

    public const CHANNELS = [
        self::CHANNEL_LAUNCH_PACK,
        self::CHANNEL_SOCIAL_INFLUENCER,
        self::CHANNEL_NEWSLETTER,
    ];

    public const DELIVERY_PENDING = 'pending';
    public const DELIVERY_SCHEDULED = 'scheduled';
    public const DELIVERY_ACTIVE = 'active';
    public const DELIVERY_DELIVERED = 'delivered';
    public const DELIVERY_CANCELLED = 'cancelled';

    public const DELIVERY_STATUSES = [
        self::DELIVERY_PENDING,
        self::DELIVERY_SCHEDULED,
        self::DELIVERY_ACTIVE,
        self::DELIVERY_DELIVERED,
        self::DELIVERY_CANCELLED,
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_promotion_campaign_channel')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'channels')]
    #[ORM\JoinColumn(
        name: 'promotion_campaign_id',
        referencedColumnName: 'id_promotion_campaign',
        nullable: false,
        onDelete: 'CASCADE'
    )]
    private ?PromotionCampaign $campaign = null;

    #[ORM\Column(name: 'channel_code', length: 40)]
    private ?string $channelCode = null;

    #[ORM\Column(name: 'price_amount', type: Types::DECIMAL, precision: 15, scale: 2)]
    private string $priceAmount = '0.00';

    #[ORM\Column(name: 'delivery_status', length: 20, options: ['default' => self::DELIVERY_PENDING])]
    private string $deliveryStatus = self::DELIVERY_PENDING;

    #[ORM\Column(name: 'is_featured', options: ['default' => false])]
    private bool $isFeatured = false;

    #[ORM\Column(name: 'admin_brief', type: Types::TEXT, nullable: true)]
    private ?string $adminBrief = null;

    #[ORM\Column(name: 'scheduled_at', nullable: true)]
    private ?\DateTimeImmutable $scheduledAt = null;

    #[ORM\Column(name: 'delivered_at', nullable: true)]
    private ?\DateTimeImmutable $deliveredAt = null;

    #[ORM\Column(name: 'impressions', options: ['default' => 0])]
    private int $impressions = 0;

    #[ORM\Column(name: 'clicks', options: ['default' => 0])]
    private int $clicks = 0;

    #[ORM\Column(name: 'created_at')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at')]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCampaign(): ?PromotionCampaign
    {
        return $this->campaign;
    }

    public function setCampaign(?PromotionCampaign $campaign): static
    {
        $this->campaign = $campaign;

        return $this;
    }

    public function getChannelCode(): ?string
    {
        return $this->channelCode;
    }

    public function setChannelCode(string $channelCode): static
    {
        $channelCode = strtoupper(trim($channelCode));

        if (!in_array($channelCode, self::CHANNELS, true)) {
            throw new \InvalidArgumentException('Canal de promotion invalide.');
        }

        $this->channelCode = $channelCode;

        return $this;
    }

    public function getPriceAmount(): string
    {
        return $this->priceAmount;
    }

    public function setPriceAmount(string $priceAmount): static
    {
        $this->priceAmount = $this->normalizeMoneyAmount($priceAmount);

        return $this;
    }

    public function getDeliveryStatus(): string
    {
        return $this->deliveryStatus;
    }

    public function setDeliveryStatus(string $deliveryStatus): static
    {
        $deliveryStatus = strtolower(trim($deliveryStatus));

        if (!in_array($deliveryStatus, self::DELIVERY_STATUSES, true)) {
            throw new \InvalidArgumentException('Statut de livraison du canal invalide.');
        }

        $this->deliveryStatus = $deliveryStatus;

        return $this;
    }

    public function isFeatured(): bool
    {
        return $this->isFeatured;
    }

    public function setIsFeatured(bool $isFeatured): static
    {
        if ($isFeatured && self::CHANNEL_LAUNCH_PACK !== $this->channelCode) {
            throw new \InvalidArgumentException('Seul le Pack Lancement peut être mis en avant.');
        }

        $this->isFeatured = $isFeatured;

        return $this;
    }

    public function getAdminBrief(): ?string
    {
        return $this->adminBrief;
    }

    public function setAdminBrief(?string $adminBrief): static
    {
        $adminBrief = null !== $adminBrief ? trim($adminBrief) : null;
        $this->adminBrief = null !== $adminBrief && '' !== $adminBrief
            ? $adminBrief
            : null;

        return $this;
    }

    public function getScheduledAt(): ?\DateTimeImmutable
    {
        return $this->scheduledAt;
    }

    public function setScheduledAt(?\DateTimeImmutable $scheduledAt): static
    {
        $this->scheduledAt = $scheduledAt;

        return $this;
    }

    public function getDeliveredAt(): ?\DateTimeImmutable
    {
        return $this->deliveredAt;
    }

    public function setDeliveredAt(?\DateTimeImmutable $deliveredAt): static
    {
        $this->deliveredAt = $deliveredAt;

        return $this;
    }

    public function getImpressions(): int
    {
        return $this->impressions;
    }

    public function setImpressions(int $impressions): static
    {
        $this->impressions = max(0, $impressions);

        return $this;
    }

    public function incrementImpressions(int $amount = 1): static
    {
        $this->impressions += max(0, $amount);

        return $this;
    }

    public function getClicks(): int
    {
        return $this->clicks;
    }

    public function setClicks(int $clicks): static
    {
        $this->clicks = max(0, $clicks);

        return $this;
    }

    public function incrementClicks(int $amount = 1): static
    {
        $this->clicks += max(0, $amount);

        return $this;
    }

    public function getClickThroughRate(): float
    {
        if (0 === $this->impressions) {
            return 0.0;
        }

        return round(($this->clicks / $this->impressions) * 100, 2);
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

    private function normalizeMoneyAmount(string $amount): string
    {
        $amount = str_replace(',', '.', trim($amount));

        if (1 !== preg_match('/^\d+(?:\.\d{1,2})?$/', $amount)) {
            throw new \InvalidArgumentException('Prix du canal de promotion invalide.');
        }

        [$integerPart, $decimalPart] = array_pad(explode('.', $amount, 2), 2, '');
        $integerPart = ltrim($integerPart, '0');

        return ('' !== $integerPart ? $integerPart : '0').'.'.str_pad($decimalPart, 2, '0');
    }
}
