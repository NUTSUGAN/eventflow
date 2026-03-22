<?php

namespace App\Entity;

use App\Repository\EventRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EventRepository::class)]
#[ORM\Table(name: 'events')]
class Event
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_event')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'organizedEvents')]
    #[ORM\JoinColumn(name: 'organizer_user_id', referencedColumnName: 'id_user', nullable: false)]
    private ?User $organizer = null;

    #[ORM\ManyToOne(inversedBy: 'events')]
    #[ORM\JoinColumn(name: 'category_id', referencedColumnName: 'id_category', nullable: false)]
    private ?Category $category = null;

    #[ORM\ManyToOne(inversedBy: 'events')]
    #[ORM\JoinColumn(name: 'location_id', referencedColumnName: 'id_location', nullable: false)]
    private ?Location $location = null;

    #[ORM\Column(name: 'title', length: 160)]
    private ?string $title = null;

    #[ORM\Column(name: 'description', type: Types::TEXT)]
    private ?string $description = null;

    #[ORM\Column(name: 'start_datetime')]
    private ?\DateTimeImmutable $startDatetime = null;

    #[ORM\Column(name: 'end_datetime')]
    private ?\DateTimeImmutable $endDatetime = null;

    #[ORM\Column(name: 'capacity')]
    private ?int $capacity = null;

    #[ORM\Column(name: 'thumbnail_photo', length: 255)]
    private ?string $thumbnailPhoto = null;

    #[ORM\Column(name: 'cover_photo', length: 255)]
    private ?string $coverPhoto = null;

    #[ORM\Column(name: 'status', length: 30)]
    private ?string $status = null;

    #[ORM\Column(name: 'created_at')]
    private ?\DateTimeImmutable $createdAt = null;

    /**
     * @var Collection<int, TicketType>
     */
    #[ORM\OneToMany(targetEntity: TicketType::class, mappedBy: 'event')]
    private Collection $ticketTypes;

    /**
     * @var Collection<int, Promotion>
     */
    #[ORM\OneToMany(targetEntity: Promotion::class, mappedBy: 'event')]
    private Collection $promotions;

    public function __construct()
    {
        $this->ticketTypes = new ArrayCollection();
        $this->promotions = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getCategory(): ?Category
    {
        return $this->category;
    }

    public function setCategory(?Category $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getLocation(): ?Location
    {
        return $this->location;
    }

    public function setLocation(?Location $location): static
    {
        $this->location = $location;

        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getStartDatetime(): ?\DateTimeImmutable
    {
        return $this->startDatetime;
    }

    public function setStartDatetime(\DateTimeImmutable $startDatetime): static
    {
        $this->startDatetime = $startDatetime;

        return $this;
    }

    public function getEndDatetime(): ?\DateTimeImmutable
    {
        return $this->endDatetime;
    }

    public function setEndDatetime(\DateTimeImmutable $endDatetime): static
    {
        $this->endDatetime = $endDatetime;

        return $this;
    }

    public function getCapacity(): ?int
    {
        return $this->capacity;
    }

    public function setCapacity(int $capacity): static
    {
        $this->capacity = $capacity;

        return $this;
    }

    public function getThumbnailPhoto(): ?string
    {
        return $this->thumbnailPhoto;
    }

    public function setThumbnailPhoto(string $thumbnailPhoto): static
    {
        $this->thumbnailPhoto = $thumbnailPhoto;

        return $this;
    }

    public function getCoverPhoto(): ?string
    {
        return $this->coverPhoto;
    }

    public function setCoverPhoto(string $coverPhoto): static
    {
        $this->coverPhoto = $coverPhoto;

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

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    /**
     * @return Collection<int, TicketType>
     */
    public function getTicketTypes(): Collection
    {
        return $this->ticketTypes;
    }

    public function addTicketType(TicketType $ticketType): static
    {
        if (!$this->ticketTypes->contains($ticketType)) {
            $this->ticketTypes->add($ticketType);
            $ticketType->setEvent($this);
        }

        return $this;
    }

    public function removeTicketType(TicketType $ticketType): static
    {
        if ($this->ticketTypes->removeElement($ticketType)) {
            // set the owning side to null (unless already changed)
            if ($ticketType->getEvent() === $this) {
                $ticketType->setEvent(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Promotion>
     */
    public function getPromotions(): Collection
    {
        return $this->promotions;
    }

    public function addPromotion(Promotion $promotion): static
    {
        if (!$this->promotions->contains($promotion)) {
            $this->promotions->add($promotion);
            $promotion->setEvent($this);
        }

        return $this;
    }

    public function removePromotion(Promotion $promotion): static
    {
        if ($this->promotions->removeElement($promotion)) {
            // set the owning side to null (unless already changed)
            if ($promotion->getEvent() === $this) {
                $promotion->setEvent(null);
            }
        }

        return $this;
    }
}
