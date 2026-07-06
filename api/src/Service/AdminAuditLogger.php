<?php

namespace App\Service;

use App\Entity\AdminAuditLog;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

class AdminAuditLogger
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @param array<string, mixed> $metadata
     */
    public function log(
        ?UserInterface $actor,
        string $action,
        string $resourceType,
        int|string|null $resourceId = null,
        ?string $resourceLabel = null,
        array $metadata = [],
        string $status = AdminAuditLog::STATUS_SUCCESS,
    ): void {
        $admin = $actor instanceof User ? $actor : null;

        $log = (new AdminAuditLog())
            ->setActor($admin)
            ->setActorEmail($admin?->getEmail())
            ->setActorRole($admin?->getBaseRole() ?? User::ROLE_CLIENT)
            ->setAction($action)
            ->setResourceType($resourceType)
            ->setResourceId($resourceId)
            ->setResourceLabel($resourceLabel)
            ->setStatus($status)
            ->setMetadata($this->sanitizeMetadata($metadata))
        ;

        $this->entityManager->persist($log);
        $this->entityManager->flush();
    }

    /**
     * @param array<string, mixed> $metadata
     *
     * @return array<string, mixed>
     */
    private function sanitizeMetadata(array $metadata): array
    {
        unset(
            $metadata['password'],
            $metadata['passwordHash'],
            $metadata['token'],
            $metadata['qrToken'],
            $metadata['providerPaymentId'],
        );

        return $metadata;
    }
}
