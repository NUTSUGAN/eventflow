<?php

namespace App\Entity;

use App\Repository\WithdrawalRequestRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: WithdrawalRequestRepository::class)]
#[ORM\Table(name: 'withdrawal_requests')]
#[ORM\Index(name: 'idx_withdrawal_status', columns: ['status'])]
class WithdrawalRequest
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PAID = 'paid';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_APPROVED,
        self::STATUS_PAID,
        self::STATUS_REJECTED,
        self::STATUS_CANCELLED,
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_withdrawal_request')]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'event_id', referencedColumnName: 'id_event', nullable: false, onDelete: 'CASCADE')]
    private ?Event $event = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'organizer_user_id', referencedColumnName: 'id_user', nullable: false, onDelete: 'CASCADE')]
    private ?User $organizer = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(name: 'reviewed_by_user_id', referencedColumnName: 'id_user', nullable: true, onDelete: 'SET NULL')]
    private ?User $reviewedBy = null;

    #[ORM\Column(name: 'status', length: 20, options: ['default' => self::STATUS_PENDING])]
    private string $status = self::STATUS_PENDING;

    #[ORM\Column(name: 'gross_amount', type: Types::DECIMAL, precision: 15, scale: 2)]
    private string $grossAmount = '0.00';

    #[ORM\Column(name: 'fee_percent', type: Types::DECIMAL, precision: 5, scale: 2)]
    private string $feePercent = '0.00';

    #[ORM\Column(name: 'fee_amount', type: Types::DECIMAL, precision: 15, scale: 2)]
    private string $feeAmount = '0.00';

    #[ORM\Column(name: 'net_amount', type: Types::DECIMAL, precision: 15, scale: 2)]
    private string $netAmount = '0.00';

    #[ORM\Column(name: 'currency', length: 3, options: ['default' => Order::DEFAULT_CURRENCY])]
    private string $currency = Order::DEFAULT_CURRENCY;

    #[ORM\Column(name: 'admin_note', type: Types::TEXT, nullable: true)]
    private ?string $adminNote = null;

    #[ORM\Column(name: 'payment_reference', length: 120, nullable: true)]
    private ?string $paymentReference = null;

    #[ORM\Column(name: 'payout_type', length: 30, nullable: true)]
    private ?string $payoutType = null;

    #[ORM\Column(name: 'payout_label', length: 120, nullable: true)]
    private ?string $payoutLabel = null;

    #[ORM\Column(name: 'bank_holder_name', length: 160, nullable: true)]
    private ?string $bankHolderName = null;

    #[ORM\Column(name: 'bank_iban', length: 80, nullable: true)]
    private ?string $bankIban = null;

    #[ORM\Column(name: 'bank_bic', length: 40, nullable: true)]
    private ?string $bankBic = null;

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

    #[ORM\Column(name: 'requested_at')]
    private \DateTimeImmutable $requestedAt;

    #[ORM\Column(name: 'reviewed_at', nullable: true)]
    private ?\DateTimeImmutable $reviewedAt = null;

    #[ORM\Column(name: 'paid_at', nullable: true)]
    private ?\DateTimeImmutable $paidAt = null;

    #[ORM\Column(name: 'updated_at')]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $now = new \DateTimeImmutable();
        $this->requestedAt = $now;
        $this->updatedAt = $now;
    }

    public function getId(): ?int { return $this->id; }
    public function getEvent(): ?Event { return $this->event; }
    public function setEvent(?Event $event): static { $this->event = $event; return $this; }
    public function getOrganizer(): ?User { return $this->organizer; }
    public function setOrganizer(?User $organizer): static { $this->organizer = $organizer; return $this; }
    public function getReviewedBy(): ?User { return $this->reviewedBy; }
    public function setReviewedBy(?User $reviewedBy): static { $this->reviewedBy = $reviewedBy; return $this; }
    public function getStatus(): string { return $this->status; }

    public function setStatus(string $status): static
    {
        $status = strtolower(trim($status));

        if (!in_array($status, self::STATUSES, true)) {
            throw new \InvalidArgumentException('Statut de retrait invalide.');
        }

        $this->status = $status;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function getGrossAmount(): string { return $this->grossAmount; }
    public function setGrossAmount(string $grossAmount): static { $this->grossAmount = number_format(max(0, (float) $grossAmount), 2, '.', ''); return $this; }
    public function getFeePercent(): string { return $this->feePercent; }
    public function setFeePercent(string $feePercent): static { $this->feePercent = number_format(max(0, min(100, (float) $feePercent)), 2, '.', ''); return $this; }
    public function getFeeAmount(): string { return $this->feeAmount; }
    public function setFeeAmount(string $feeAmount): static { $this->feeAmount = number_format(max(0, (float) $feeAmount), 2, '.', ''); return $this; }
    public function getNetAmount(): string { return $this->netAmount; }
    public function setNetAmount(string $netAmount): static { $this->netAmount = number_format(max(0, (float) $netAmount), 2, '.', ''); return $this; }
    public function getCurrency(): string { return $this->currency; }
    public function setCurrency(string $currency): static { $this->currency = strtoupper(substr(trim($currency), 0, 3)); return $this; }
    public function getAdminNote(): ?string { return $this->adminNote; }
    public function setAdminNote(?string $adminNote): static { $adminNote = null !== $adminNote ? trim($adminNote) : null; $this->adminNote = '' !== $adminNote ? $adminNote : null; return $this; }
    public function getPaymentReference(): ?string { return $this->paymentReference; }
    public function setPaymentReference(?string $paymentReference): static { $paymentReference = null !== $paymentReference ? trim($paymentReference) : null; $this->paymentReference = '' !== $paymentReference ? $paymentReference : null; return $this; }
    public function getPayoutType(): ?string { return $this->payoutType; }
    public function setPayoutType(?string $payoutType): static { $payoutType = null !== $payoutType ? trim($payoutType) : null; $this->payoutType = '' !== $payoutType ? $payoutType : null; return $this; }
    public function getPayoutLabel(): ?string { return $this->payoutLabel; }
    public function setPayoutLabel(?string $payoutLabel): static { $payoutLabel = null !== $payoutLabel ? trim($payoutLabel) : null; $this->payoutLabel = '' !== $payoutLabel ? $payoutLabel : null; return $this; }
    public function getBankHolderName(): ?string { return $this->bankHolderName; }
    public function setBankHolderName(?string $bankHolderName): static { $bankHolderName = null !== $bankHolderName ? trim($bankHolderName) : null; $this->bankHolderName = '' !== $bankHolderName ? $bankHolderName : null; return $this; }
    public function getBankIban(): ?string { return $this->bankIban; }
    public function setBankIban(?string $bankIban): static { $bankIban = null !== $bankIban ? trim($bankIban) : null; $this->bankIban = '' !== $bankIban ? $bankIban : null; return $this; }
    public function getBankBic(): ?string { return $this->bankBic; }
    public function setBankBic(?string $bankBic): static { $bankBic = null !== $bankBic ? trim($bankBic) : null; $this->bankBic = '' !== $bankBic ? $bankBic : null; return $this; }
    public function getBankName(): ?string { return $this->bankName; }
    public function setBankName(?string $bankName): static { $bankName = null !== $bankName ? trim($bankName) : null; $this->bankName = '' !== $bankName ? $bankName : null; return $this; }
    public function getMobileMoneyName(): ?string { return $this->mobileMoneyName; }
    public function setMobileMoneyName(?string $mobileMoneyName): static { $mobileMoneyName = null !== $mobileMoneyName ? trim($mobileMoneyName) : null; $this->mobileMoneyName = '' !== $mobileMoneyName ? $mobileMoneyName : null; return $this; }
    public function getMobileMoneyPhone(): ?string { return $this->mobileMoneyPhone; }
    public function setMobileMoneyPhone(?string $mobileMoneyPhone): static { $mobileMoneyPhone = null !== $mobileMoneyPhone ? trim($mobileMoneyPhone) : null; $this->mobileMoneyPhone = '' !== $mobileMoneyPhone ? $mobileMoneyPhone : null; return $this; }
    public function getMobileMoneyProvider(): ?string { return $this->mobileMoneyProvider; }
    public function setMobileMoneyProvider(?string $mobileMoneyProvider): static { $mobileMoneyProvider = null !== $mobileMoneyProvider ? trim($mobileMoneyProvider) : null; $this->mobileMoneyProvider = '' !== $mobileMoneyProvider ? $mobileMoneyProvider : null; return $this; }
    public function getMobileMoneyCountry(): ?string { return $this->mobileMoneyCountry; }
    public function setMobileMoneyCountry(?string $mobileMoneyCountry): static { $mobileMoneyCountry = null !== $mobileMoneyCountry ? trim($mobileMoneyCountry) : null; $this->mobileMoneyCountry = '' !== $mobileMoneyCountry ? $mobileMoneyCountry : null; return $this; }
    public function getRequestedAt(): \DateTimeImmutable { return $this->requestedAt; }
    public function getReviewedAt(): ?\DateTimeImmutable { return $this->reviewedAt; }
    public function setReviewedAt(?\DateTimeImmutable $reviewedAt): static { $this->reviewedAt = $reviewedAt; return $this; }
    public function getPaidAt(): ?\DateTimeImmutable { return $this->paidAt; }
    public function setPaidAt(?\DateTimeImmutable $paidAt): static { $this->paidAt = $paidAt; return $this; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }
    public function touch(): static { $this->updatedAt = new \DateTimeImmutable(); return $this; }

    public function copyPayoutAccount(OrganizerPayoutAccount $payoutAccount): static
    {
        return $this
            ->setPayoutType($payoutAccount->getType())
            ->setPayoutLabel($payoutAccount->getLabel())
            ->setBankHolderName($payoutAccount->getHolderName())
            ->setBankIban($payoutAccount->getIban())
            ->setBankBic($payoutAccount->getBic())
            ->setBankName($payoutAccount->getBankName())
            ->setMobileMoneyName($payoutAccount->getMobileMoneyName())
            ->setMobileMoneyPhone($payoutAccount->getMobileMoneyPhone())
            ->setMobileMoneyProvider($payoutAccount->getMobileMoneyProvider())
            ->setMobileMoneyCountry($payoutAccount->getMobileMoneyCountry())
        ;
    }
}
