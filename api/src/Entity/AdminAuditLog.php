<?php

namespace App\Entity;

use App\Repository\AdminAuditLogRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AdminAuditLogRepository::class)]
#[ORM\Table(name: 'admin_audit_logs')]
#[ORM\Index(columns: ['created_at'], name: 'idx_admin_audit_created_at')]
#[ORM\Index(columns: ['action'], name: 'idx_admin_audit_action')]
#[ORM\Index(columns: ['resource_type'], name: 'idx_admin_audit_resource_type')]
#[ORM\Index(columns: ['actor_role'], name: 'idx_admin_audit_actor_role')]
class AdminAuditLog
{
    public const STATUS_SUCCESS = 'success';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id_admin_audit_log')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'actor_user_id', referencedColumnName: 'id_user', nullable: true, onDelete: 'SET NULL')]
    private ?User $actor = null;

    #[ORM\Column(name: 'actor_email', length: 180, nullable: true)]
    private ?string $actorEmail = null;

    #[ORM\Column(name: 'actor_role', length: 40)]
    private string $actorRole = User::ROLE_CLIENT;

    #[ORM\Column(length: 80)]
    private string $action = '';

    #[ORM\Column(name: 'resource_type', length: 80)]
    private string $resourceType = '';

    #[ORM\Column(name: 'resource_id', length: 80, nullable: true)]
    private ?string $resourceId = null;

    #[ORM\Column(name: 'resource_label', length: 255, nullable: true)]
    private ?string $resourceLabel = null;

    #[ORM\Column(length: 20)]
    private string $status = self::STATUS_SUCCESS;

    /**
     * @var array<string, mixed>
     */
    #[ORM\Column(type: Types::JSON)]
    private array $metadata = [];

    #[ORM\Column(name: 'created_at')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getActor(): ?User
    {
        return $this->actor;
    }

    public function setActor(?User $actor): static
    {
        $this->actor = $actor;

        return $this;
    }

    public function getActorEmail(): ?string
    {
        return $this->actorEmail;
    }

    public function setActorEmail(?string $actorEmail): static
    {
        $this->actorEmail = $actorEmail;

        return $this;
    }

    public function getActorRole(): string
    {
        return $this->actorRole;
    }

    public function setActorRole(string $actorRole): static
    {
        $this->actorRole = $actorRole;

        return $this;
    }

    public function getAction(): string
    {
        return $this->action;
    }

    public function setAction(string $action): static
    {
        $this->action = $action;

        return $this;
    }

    public function getResourceType(): string
    {
        return $this->resourceType;
    }

    public function setResourceType(string $resourceType): static
    {
        $this->resourceType = $resourceType;

        return $this;
    }

    public function getResourceId(): ?string
    {
        return $this->resourceId;
    }

    public function setResourceId(int|string|null $resourceId): static
    {
        $this->resourceId = null !== $resourceId ? (string) $resourceId : null;

        return $this;
    }

    public function getResourceLabel(): ?string
    {
        return $this->resourceLabel;
    }

    public function setResourceLabel(?string $resourceLabel): static
    {
        $resourceLabel = null !== $resourceLabel ? trim($resourceLabel) : null;
        $this->resourceLabel = '' !== $resourceLabel ? $resourceLabel : null;

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function getMetadata(): array
    {
        return $this->metadata;
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public function setMetadata(array $metadata): static
    {
        $this->metadata = $metadata;

        return $this;
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
}
