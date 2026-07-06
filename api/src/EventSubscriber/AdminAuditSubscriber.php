<?php

namespace App\EventSubscriber;

use App\Entity\User;
use App\Service\AdminAuditLogger;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

class AdminAuditSubscriber implements EventSubscriberInterface
{
    private const AUDITED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    public function __construct(
        private readonly AdminAuditLogger $auditLogger,
        private readonly TokenStorageInterface $tokenStorage,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => 'onKernelResponse',
        ];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $method = strtoupper($request->getMethod());

        if (!in_array($method, self::AUDITED_METHODS, true)) {
            return;
        }

        $actor = $this->tokenStorage->getToken()?->getUser();

        if (!$actor instanceof User || !$actor->isAdminAccount()) {
            return;
        }

        $path = $request->getPathInfo();

        if (!$this->shouldAuditPath($path)) {
            return;
        }

        $statusCode = $event->getResponse()->getStatusCode();
        $resourceType = $this->resolveResourceType($path);
        $resourceId = $this->resolveResourceId($request->attributes->all());

        $this->auditLogger->log(
            $actor,
            (string) ($request->attributes->get('_route') ?: strtolower($method.'_'.$resourceType)),
            $resourceType,
            $resourceId,
            null,
            [
                'method' => $method,
                'path' => $path,
                'statusCode' => $statusCode,
                'route' => $request->attributes->get('_route'),
                'payload' => $this->readSafePayload($request->getContent()),
            ],
            $this->resolveStatus($statusCode),
        );
    }

    private function resolveResourceType(string $path): string
    {
        $segments = array_values(array_filter(explode('/', trim($path, '/'))));

        return $segments[2] ?? 'admin';
    }

    private function shouldAuditPath(string $path): bool
    {
        foreach (['/api/admin', '/api/organizer', '/api/staff'] as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string, mixed> $attributes
     */
    private function resolveResourceId(array $attributes): int|string|null
    {
        foreach (['id', 'userId', 'eventId', 'reportId', 'promotionId', 'withdrawalId', 'channelId'] as $key) {
            $value = $attributes[$key] ?? null;

            if (is_scalar($value) && '' !== trim((string) $value)) {
                return (string) $value;
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function readSafePayload(string $content): ?array
    {
        if ('' === trim($content)) {
            return null;
        }

        $payload = json_decode($content, true);

        if (!is_array($payload)) {
            return null;
        }

        foreach (['password', 'passwordHash', 'token', 'qrToken', 'providerPaymentId'] as $sensitiveKey) {
            unset($payload[$sensitiveKey]);
        }

        return $payload;
    }

    private function resolveStatus(int $statusCode): string
    {
        if (403 === $statusCode) {
            return 'forbidden';
        }

        if ($statusCode >= 400) {
            return 'failed';
        }

        return 'success';
    }
}
