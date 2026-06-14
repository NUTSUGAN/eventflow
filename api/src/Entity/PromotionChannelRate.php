<?php

namespace App\Entity;

use App\Repository\PromotionChannelRateRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PromotionChannelRateRepository::class)]
#[ORM\Table(name: 'promotion_channel_rates')]
#[ORM\UniqueConstraint(name: 'uniq_promotion_rate_channel_duration', columns: ['channel_code', 'duration'])]
class PromotionChannelRate
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_promotion_channel_rate')]
    private ?int $id = null;

    #[ORM\Column(name: 'channel_code', length: 40)]
    private ?string $channelCode = null;

    #[ORM\Column(name: 'duration', length: 20)]
    private ?string $duration = null;

    #[ORM\Column(name: 'price_amount', type: Types::DECIMAL, precision: 15, scale: 2)]
    private string $priceAmount = '0.00';

    #[ORM\Column(name: 'currency', length: 3, options: ['default' => PromotionCampaign::DEFAULT_CURRENCY])]
    private string $currency = PromotionCampaign::DEFAULT_CURRENCY;

    #[ORM\Column(name: 'is_active', options: ['default' => true])]
    private bool $isActive = true;

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

    public function getChannelCode(): ?string
    {
        return $this->channelCode;
    }

    public function setChannelCode(string $channelCode): static
    {
        $channelCode = strtoupper(trim($channelCode));

        if (!in_array($channelCode, PromotionCampaignChannel::CHANNELS, true)) {
            throw new \InvalidArgumentException('Canal de tarif promotionnel invalide.');
        }

        $this->channelCode = $channelCode;

        return $this;
    }

    public function getDuration(): ?string
    {
        return $this->duration;
    }

    public function setDuration(string $duration): static
    {
        $duration = strtolower(trim($duration));

        if (!in_array($duration, PromotionCampaign::DURATIONS, true)) {
            throw new \InvalidArgumentException('Duree de tarif promotionnel invalide.');
        }

        $this->duration = $duration;

        return $this;
    }

    public function getPriceAmount(): string
    {
        return $this->priceAmount;
    }

    public function setPriceAmount(string $priceAmount): static
    {
        $priceAmount = str_replace(',', '.', trim($priceAmount));

        if (1 !== preg_match('/^\d+(?:\.\d{1,2})?$/', $priceAmount)) {
            throw new \InvalidArgumentException('Prix promotionnel invalide.');
        }

        [$integerPart, $decimalPart] = array_pad(explode('.', $priceAmount, 2), 2, '');
        $integerPart = ltrim($integerPart, '0');
        $this->priceAmount = ('' !== $integerPart ? $integerPart : '0').'.'.str_pad($decimalPart, 2, '0');

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
            throw new \InvalidArgumentException('Devise promotionnelle invalide.');
        }

        $this->currency = $currency;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function touch(): static
    {
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }
}
