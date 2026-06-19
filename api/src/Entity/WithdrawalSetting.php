<?php

namespace App\Entity;

use App\Repository\WithdrawalSettingRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: WithdrawalSettingRepository::class)]
#[ORM\Table(name: 'withdrawal_settings')]
class WithdrawalSetting
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_withdrawal_setting')]
    private ?int $id = null;

    #[ORM\Column(name: 'default_fee_percent', type: Types::DECIMAL, precision: 5, scale: 2, options: ['default' => '0.00'])]
    private string $defaultFeePercent = '0.00';

    #[ORM\Column(name: 'updated_at')]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDefaultFeePercent(): string
    {
        return $this->defaultFeePercent;
    }

    public function setDefaultFeePercent(string $defaultFeePercent): static
    {
        $percent = (float) str_replace(',', '.', trim($defaultFeePercent));

        if ($percent < 0 || $percent > 100) {
            throw new \InvalidArgumentException('Le pourcentage de frais doit être compris entre 0 et 100.');
        }

        $this->defaultFeePercent = number_format($percent, 2, '.', '');
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
