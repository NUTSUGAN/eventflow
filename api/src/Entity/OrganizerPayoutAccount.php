<?php

namespace App\Entity;

use App\Repository\OrganizerPayoutAccountRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: OrganizerPayoutAccountRepository::class)]
#[ORM\Table(name: 'organizer_payout_accounts')]
#[ORM\Index(name: 'idx_organizer_payout_active', columns: ['organizer_user_id', 'is_active'])]
class OrganizerPayoutAccount
{
    public const TYPE_BANK = 'bank';
    public const TYPE_MOBILE_MONEY = 'mobile_money';

    public const TYPES = [
        self::TYPE_BANK,
        self::TYPE_MOBILE_MONEY,
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_organizer_payout_account')]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'organizer_user_id', referencedColumnName: 'id_user', nullable: false, onDelete: 'CASCADE')]
    private ?User $organizer = null;

    #[ORM\Column(name: 'type', length: 30)]
    private string $type = self::TYPE_BANK;

    #[ORM\Column(name: 'label', length: 120, nullable: true)]
    private ?string $label = null;

    #[ORM\Column(name: 'holder_name', length: 160, nullable: true)]
    private ?string $holderName = null;

    #[ORM\Column(name: 'iban', length: 80, nullable: true)]
    private ?string $iban = null;

    #[ORM\Column(name: 'bic', length: 40, nullable: true)]
    private ?string $bic = null;

    #[ORM\Column(name: 'bank_name', length: 120, nullable: true)]
    private ?string $bankName = null;

    #[ORM\Column(name: 'mobile_money_name', length: 160, nullable: true)]
    private ?string $mobileMoneyName = null;

    #[ORM\Column(name: 'mobile_money_phone', length: 40, nullable: true)]
    private ?string $mobileMoneyPhone = null;

    #[ORM\Column(name: 'mobile_money_provider', length: 80, nullable: true)]
    private ?string $mobileMoneyProvider = null;

    #[ORM\Column(name: 'mobile_money_country', length: 80, nullable: true)]
    private ?string $mobileMoneyCountry = null;

    #[ORM\Column(name: 'is_active', options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'replaced_at', type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $replacedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getOrganizer(): ?User { return $this->organizer; }
    public function setOrganizer(?User $organizer): static { $this->organizer = $organizer; return $this; }
    public function getType(): string { return $this->type; }

    public function setType(string $type): static
    {
        $type = strtolower(trim($type));

        if (!in_array($type, self::TYPES, true)) {
            throw new \InvalidArgumentException('Type de moyen de retrait invalide.');
        }

        $this->type = $type;

        return $this;
    }

    public function getLabel(): ?string { return $this->label; }
    public function setLabel(?string $label): static { $this->label = $this->normalizeNullable($label); return $this; }
    public function getHolderName(): ?string { return $this->holderName; }
    public function setHolderName(?string $holderName): static { $this->holderName = $this->normalizeNullable($holderName); return $this; }
    public function getIban(): ?string { return $this->iban; }
    public function setIban(?string $iban): static { $this->iban = $this->normalizeNullable($iban); return $this; }
    public function getBic(): ?string { return $this->bic; }
    public function setBic(?string $bic): static { $this->bic = $this->normalizeNullable($bic); return $this; }
    public function getBankName(): ?string { return $this->bankName; }
    public function setBankName(?string $bankName): static { $this->bankName = $this->normalizeNullable($bankName); return $this; }
    public function getMobileMoneyName(): ?string { return $this->mobileMoneyName; }
    public function setMobileMoneyName(?string $mobileMoneyName): static { $this->mobileMoneyName = $this->normalizeNullable($mobileMoneyName); return $this; }
    public function getMobileMoneyPhone(): ?string { return $this->mobileMoneyPhone; }
    public function setMobileMoneyPhone(?string $mobileMoneyPhone): static { $this->mobileMoneyPhone = $this->normalizeNullable($mobileMoneyPhone); return $this; }
    public function getMobileMoneyProvider(): ?string { return $this->mobileMoneyProvider; }
    public function setMobileMoneyProvider(?string $mobileMoneyProvider): static { $this->mobileMoneyProvider = $this->normalizeNullable($mobileMoneyProvider); return $this; }
    public function getMobileMoneyCountry(): ?string { return $this->mobileMoneyCountry; }
    public function setMobileMoneyCountry(?string $mobileMoneyCountry): static { $this->mobileMoneyCountry = $this->normalizeNullable($mobileMoneyCountry); return $this; }
    public function isActive(): bool { return $this->isActive; }
    public function setIsActive(bool $isActive): static { $this->isActive = $isActive; return $this; }
    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }
    public function getReplacedAt(): ?\DateTimeImmutable { return $this->replacedAt; }
    public function setReplacedAt(?\DateTimeImmutable $replacedAt): static { $this->replacedAt = $replacedAt; return $this; }

    public function replace(\DateTimeImmutable $replacedAt): static
    {
        $this->isActive = false;
        $this->replacedAt = $replacedAt;

        return $this;
    }

    private function normalizeNullable(?string $value): ?string
    {
        if (null === $value) {
            return null;
        }

        $value = trim($value);

        return '' !== $value ? $value : null;
    }
}
