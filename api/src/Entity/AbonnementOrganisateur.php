<?php

namespace App\Entity;

use App\Repository\AbonnementOrganisateurRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AbonnementOrganisateurRepository::class)]
#[ORM\Table(
    name: 'abonnements_organisateur',
    uniqueConstraints: [
        new ORM\UniqueConstraint(name: 'uq_abonnements_pair', columns: ['client_user_id', 'organizer_user_id'])
    ]
)]
class AbonnementOrganisateur
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_abonnement')]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'clientSubscriptions')]
    #[ORM\JoinColumn(name: 'client_user_id', referencedColumnName: 'id_user', nullable: false)]
    private ?User $client = null;

    #[ORM\ManyToOne(inversedBy: 'organizerSubscriptions')]
    #[ORM\JoinColumn(name: 'organizer_user_id', referencedColumnName: 'id_user', nullable: false)]
    private ?User $organizer = null;

    #[ORM\Column(name: 'status', length: 20)]
    private ?string $status = null;

    #[ORM\Column(name: 'created_at')]
    private ?\DateTimeImmutable $createdAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getClient(): ?User
    {
        return $this->client;
    }

    public function setClient(User $client): static
    {
        $this->client = $client;

        return $this;
    }

    public function getOrganizer(): ?User
    {
        return $this->organizer;
    }

    public function setOrganizer(User $organizer): static
    {
        $this->organizer = $organizer;

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
}