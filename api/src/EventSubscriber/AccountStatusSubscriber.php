<?php

namespace App\EventSubscriber;

use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final class AccountStatusSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly Security $security,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['denyInactiveAccountApiAccess', 8],
        ];
    }

    public function denyInactiveAccountApiAccess(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();

        if (!str_starts_with($path, '/api/') || '/api/logout' === $path) {
            return;
        }

        $user = $this->security->getUser();

        if (!$user instanceof User || $user->canAuthenticate()) {
            return;
        }

        $event->setResponse(new JsonResponse([
            'message' => 'Ce compte est bloqué.',
        ], JsonResponse::HTTP_FORBIDDEN));
    }
}
