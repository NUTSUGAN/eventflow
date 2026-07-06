<?php

namespace App\Controller;

use App\Entity\AdminAuditLog;
use App\Repository\AdminAuditLogRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin/logs')]
final class AdminAuditLogController extends AbstractController
{
    #[Route('', name: 'api_admin_audit_log_index', methods: ['GET'])]
    public function index(Request $request, AdminAuditLogRepository $repository): JsonResponse
    {
        $from = $this->parseDate($request->query->get('from'));
        $to = $this->parseDate($request->query->get('to'));

        if (false === $from || false === $to) {
            return $this->json(['message' => 'Les dates de filtre sont invalides.'], Response::HTTP_BAD_REQUEST);
        }

        $logs = $repository->findForAdminHistory(
            $this->normalizeNullableString($request->query->get('admin')),
            $this->normalizeNullableString($request->query->get('role')),
            $this->normalizeNullableString($request->query->get('action')),
            $this->normalizeNullableString($request->query->get('resourceType')),
            $from,
            $to,
        );

        return $this->json([
            'items' => array_map($this->serialize(...), $logs),
        ]);
    }

    /**
     * @return array{
     *   id: int|null,
     *   action: string,
     *   resourceType: string,
     *   resourceId: string|null,
     *   resourceLabel: string|null,
     *   status: string,
     *   metadata: array<string, mixed>,
     *   createdAt: string,
     *   actor: array{id: int|null, email: string|null, fullName: string|null, role: string}
     * }
     */
    private function serialize(AdminAuditLog $log): array
    {
        $actor = $log->getActor();

        return [
            'id' => $log->getId(),
            'action' => $log->getAction(),
            'resourceType' => $log->getResourceType(),
            'resourceId' => $log->getResourceId(),
            'resourceLabel' => $log->getResourceLabel(),
            'status' => $log->getStatus(),
            'metadata' => $log->getMetadata(),
            'createdAt' => $log->getCreatedAt()->format(DATE_ATOM),
            'actor' => [
                'id' => $actor?->getId(),
                'email' => $log->getActorEmail(),
                'fullName' => $actor?->getDisplayName(),
                'role' => $log->getActorRole(),
            ],
        ];
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' !== $value ? $value : null;
    }

    private function parseDate(mixed $value): \DateTimeImmutable|false|null
    {
        if (!is_string($value) || '' === trim($value)) {
            return null;
        }

        try {
            return new \DateTimeImmutable($value);
        } catch (\Throwable) {
            return false;
        }
    }
}
