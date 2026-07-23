<?php

namespace App\EventSubscriber;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

final readonly class CorsResponseSubscriber implements EventSubscriberInterface
{
    /**
     * @param list<string> $allowedOrigins
     */
    public function __construct(
        #[Autowire('%env(string:FRONTEND_APP_URL)%')]
        private string $frontendAppUrl = 'http://localhost:5173',
        private array $allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ],
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 256],
            KernelEvents::RESPONSE => ['onKernelResponse', -256],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        $request = $event->getRequest();

        if ('OPTIONS' !== $request->getMethod()) {
            return;
        }

        $response = new Response('', Response::HTTP_NO_CONTENT);
        $this->applyCorsHeaders($response, (string) $request->headers->get('Origin', ''));
        $event->setResponse($response);
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        $this->applyCorsHeaders(
            $event->getResponse(),
            (string) $event->getRequest()->headers->get('Origin', ''),
        );
    }

    private function applyCorsHeaders(Response $response, string $origin): void
    {
        if (!$this->isAllowedOrigin($origin)) {
            return;
        }

        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Vary', 'Origin');
    }

    private function isAllowedOrigin(string $origin): bool
    {
        if ('' === trim($origin)) {
            return false;
        }

        $allowedOrigins = array_unique([
            rtrim($this->frontendAppUrl, '/'),
            ...$this->allowedOrigins,
        ]);

        return in_array(rtrim($origin, '/'), $allowedOrigins, true);
    }
}
