<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final class ApiCsrfSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly CsrfTokenManagerInterface $tokens)
    {
    }

    public static function getSubscribedEvents(): array
    {
        // After routing and session setup, before the security firewall (login/logout).
        return [KernelEvents::REQUEST => ['validate', 16]];
    }

    public function validate(RequestEvent $event): void
    {
        $request = $event->getRequest();
        if (!$event->isMainRequest() || $request->isMethodSafe()
            || !str_starts_with($request->getPathInfo(), '/api/')
            || '/api/fedapay/webhook' === $request->getPathInfo()) {
            return;
        }

        $value = (string) $request->headers->get('X-CSRF-Token', '');
        if ('' === $value || !$this->tokens->isTokenValid(new CsrfToken('api', $value))) {
            $event->setResponse(new JsonResponse([
                'message' => 'Jeton de sécurité invalide. Recharge la page et réessaie.',
                'code' => 'csrf_invalid',
            ], 403));
        }
    }
}
