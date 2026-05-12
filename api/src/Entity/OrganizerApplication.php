<?php

namespace App\Entity;

use App\Repository\OrganizerApplicationRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: OrganizerApplicationRepository::class)]
#[ORM\Table(name: 'organizer_applications')]
class OrganizerApplication
{
    public const STATUS_PENDING = 'PENDING';
    public const STATUS_APPROVED = 'APPROVED';
    public const STATUS_REJECTED = 'REJECTED';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_organizer_application')]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'organizerApplication')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id_user', nullable: false, unique: true, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(name: 'status', length: 20)]
    private ?string $status = self::STATUS_PENDING;

    #[ORM\Column(name: 'organization_name', length: 160)]
    private ?string $organizationName = null;

    #[ORM\Column(name: 'city', length: 120)]
    private ?string $city = null;

    #[ORM\Column(name: 'phone', length: 40, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(name: 'website', length: 255, nullable: true)]
    private ?string $website = null;

    #[ORM\Column(name: 'instagram_url', length: 255, nullable: true)]
    private ?string $instagramUrl = null;

    #[ORM\Column(name: 'tiktok_url', length: 255, nullable: true)]
    private ?string $tiktokUrl = null;

    #[ORM\Column(name: 'linkedin_url', length: 255, nullable: true)]
    private ?string $linkedinUrl = null;

    #[ORM\Column(name: 'other_links', type: 'text', nullable: true)]
    private ?string $otherLinks = null;

    #[ORM\Column(name: 'motivation', type: 'text')]
    private ?string $motivation = null;

    #[ORM\Column(name: 'review_note', type: 'text', nullable: true)]
    private ?string $reviewNote = null;

    #[ORM\Column(name: 'submitted_at')]
    private ?\DateTimeImmutable $submittedAt = null;

    #[ORM\Column(name: 'reviewed_at', nullable: true)]
    private ?\DateTimeImmutable $reviewedAt = null;

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

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = strtoupper(trim($status));

        return $this;
    }

    public function getOrganizationName(): ?string
    {
        return $this->organizationName;
    }

    public function setOrganizationName(string $organizationName): static
    {
        $this->organizationName = $organizationName;

        return $this;
    }

    public function getCity(): ?string
    {
        return $this->city;
    }

    public function setCity(string $city): static
    {
        $this->city = $city;

        return $this;
    }

    public function getPhone(): ?string
    {
        return $this->phone;
    }

    public function setPhone(?string $phone): static
    {
        $this->phone = $phone;

        return $this;
    }

    public function getWebsite(): ?string
    {
        return $this->website;
    }

    public function setWebsite(?string $website): static
    {
        $this->website = $website;

        return $this;
    }

    public function getInstagramUrl(): ?string
    {
        return $this->instagramUrl;
    }

    public function setInstagramUrl(?string $instagramUrl): static
    {
        $this->instagramUrl = $instagramUrl;

        return $this;
    }

    public function getTiktokUrl(): ?string
    {
        return $this->tiktokUrl;
    }

    public function setTiktokUrl(?string $tiktokUrl): static
    {
        $this->tiktokUrl = $tiktokUrl;

        return $this;
    }

    public function getLinkedinUrl(): ?string
    {
        return $this->linkedinUrl;
    }

    public function setLinkedinUrl(?string $linkedinUrl): static
    {
        $this->linkedinUrl = $linkedinUrl;

        return $this;
    }

    public function getOtherLinks(): ?string
    {
        return $this->otherLinks;
    }

    public function setOtherLinks(?string $otherLinks): static
    {
        $this->otherLinks = $otherLinks;

        return $this;
    }

    public function getMotivation(): ?string
    {
        return $this->motivation;
    }

    public function setMotivation(string $motivation): static
    {
        $this->motivation = $motivation;

        return $this;
    }

    public function getReviewNote(): ?string
    {
        return $this->reviewNote;
    }

    public function setReviewNote(?string $reviewNote): static
    {
        $this->reviewNote = $reviewNote;

        return $this;
    }

    public function getSubmittedAt(): ?\DateTimeImmutable
    {
        return $this->submittedAt;
    }

    public function setSubmittedAt(\DateTimeImmutable $submittedAt): static
    {
        $this->submittedAt = $submittedAt;

        return $this;
    }

    public function getReviewedAt(): ?\DateTimeImmutable
    {
        return $this->reviewedAt;
    }

    public function setReviewedAt(?\DateTimeImmutable $reviewedAt): static
    {
        $this->reviewedAt = $reviewedAt;

        return $this;
    }
}
