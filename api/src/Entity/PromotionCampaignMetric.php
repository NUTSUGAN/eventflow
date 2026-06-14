<?php

namespace App\Entity;

use App\Repository\PromotionCampaignMetricRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PromotionCampaignMetricRepository::class)]
#[ORM\Table(name: 'promotion_campaign_metrics')]
#[ORM\UniqueConstraint(name: 'uniq_promotion_metric_placement', columns: ['promotion_campaign_id', 'placement'])]
class PromotionCampaignMetric
{
    public const PLACEMENT_HOMEPAGE = 'homepage';
    public const PLACEMENT_EXPLORER = 'explorer';
    public const PLACEMENT_DETAIL = 'detail';
    public const PLACEMENT_NEWSLETTER = 'newsletter';
    public const PLACEMENT_SOCIAL = 'social';

    public const PLACEMENTS = [
        self::PLACEMENT_HOMEPAGE,
        self::PLACEMENT_EXPLORER,
        self::PLACEMENT_DETAIL,
        self::PLACEMENT_NEWSLETTER,
        self::PLACEMENT_SOCIAL,
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_promotion_campaign_metric')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'metrics')]
    #[ORM\JoinColumn(
        name: 'promotion_campaign_id',
        referencedColumnName: 'id_promotion_campaign',
        nullable: false,
        onDelete: 'CASCADE'
    )]
    private ?PromotionCampaign $campaign = null;

    #[ORM\Column(name: 'placement', length: 30)]
    private ?string $placement = null;

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

    public function getPlacement(): ?string
    {
        return $this->placement;
    }

    public function setPlacement(string $placement): static
    {
        $placement = strtolower(trim($placement));

        if (!in_array($placement, self::PLACEMENTS, true)) {
            throw new \InvalidArgumentException('Emplacement de statistique invalide.');
        }

        $this->placement = $placement;

        return $this;
    }

    public function getImpressions(): int
    {
        return $this->impressions;
    }

    public function incrementImpressions(int $amount = 1): static
    {
        $this->impressions += max(0, $amount);
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function getClicks(): int
    {
        return $this->clicks;
    }

    public function incrementClicks(int $amount = 1): static
    {
        $this->clicks += max(0, $amount);
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function getClickThroughRate(): float
    {
        return $this->impressions > 0
            ? round(($this->clicks / $this->impressions) * 100, 2)
            : 0.0;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
