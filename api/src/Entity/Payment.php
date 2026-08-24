<?php

namespace App\Entity;

use App\Repository\PaymentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PaymentRepository::class)]
#[ORM\Table(name: 'payments')]
class Payment
{
    public const PROVIDER_STRIPE = 'stripe';
    public const PROVIDER_FREE = 'free';
    public const STATUS_PAID = 'paid';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_payment')]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'payment')]
    #[ORM\JoinColumn(name: 'order_id', referencedColumnName: 'id_order', nullable: false, unique: true)]
    private ?Order $customerOrder = null;

    #[ORM\Column(name: 'provider', length: 20)]
    private ?string $provider = null;

    #[ORM\Column(name: 'provider_payment_id', length: 120)]
    private ?string $providerPaymentId = null;

    #[ORM\Column(name: 'amount', type: Types::DECIMAL, precision: 15, scale: 2)]
    private ?string $amount = null;

    #[ORM\Column(name: 'currency', length: 3)]
    private ?string $currency = null;

    #[ORM\Column(name: 'status', length: 20)]
    private ?string $status = null;

    #[ORM\Column(name: 'paid_at')]
    private ?\DateTimeImmutable $paidAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCustomerOrder(): ?Order
    {
        return $this->customerOrder;
    }

    public function setCustomerOrder(Order $customerOrder): static
    {
        $this->customerOrder = $customerOrder;

        return $this;
    }

    public function getProvider(): ?string
    {
        return $this->provider;
    }

    public function setProvider(string $provider): static
    {
        $this->provider = $provider;

        return $this;
    }

    public function getProviderPaymentId(): ?string
    {
        return $this->providerPaymentId;
    }

    public function setProviderPaymentId(string $providerPaymentId): static
    {
        $this->providerPaymentId = $providerPaymentId;

        return $this;
    }

    public function getAmount(): ?string
    {
        return $this->amount;
    }

    public function setAmount(string $amount): static
    {
        $this->amount = $amount;

        return $this;
    }

    public function getCurrency(): ?string
    {
        return $this->currency;
    }

    public function setCurrency(string $currency): static
    {
        $this->currency = $currency;

        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getPaidAt(): ?\DateTimeImmutable
    {
        return $this->paidAt;
    }

    public function setPaidAt(\DateTimeImmutable $paidAt): static
    {
        $this->paidAt = $paidAt;

        return $this;
    }
}
