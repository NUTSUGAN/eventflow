<?php

namespace App\Tests\Security;

use App\EventSubscriber\ApiCsrfSubscriber;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

final class ApiCsrfSubscriberTest extends TestCase
{
    public function testMissingTokenBlocksLoginBeforeAuthentication(): void
    {
        $manager = $this->createMock(CsrfTokenManagerInterface::class);
        $event = $this->request('/api/login', 'POST');
        (new ApiCsrfSubscriber($manager))->validate($event);
        self::assertSame(403, $event->getResponse()?->getStatusCode());
    }

    public function testValidTokenAllowsMutation(): void
    {
        $manager = $this->createMock(CsrfTokenManagerInterface::class);
        $manager->expects(self::once())->method('isTokenValid')
            ->with(self::callback(fn (CsrfToken $token) => 'api' === $token->getId() && 'valid-token' === $token->getValue()))
            ->willReturn(true);
        $event = $this->request('/api/orders', 'POST');
        $event->getRequest()->headers->set('X-CSRF-Token', 'valid-token');
        (new ApiCsrfSubscriber($manager))->validate($event);
        self::assertFalse($event->hasResponse());
    }

    public function testInvalidTokenBlocksDeletion(): void
    {
        $manager = $this->createMock(CsrfTokenManagerInterface::class);
        $manager->method('isTokenValid')->willReturn(false);
        $event = $this->request('/api/me', 'DELETE');
        $event->getRequest()->headers->set('X-CSRF-Token', 'wrong-token');
        (new ApiCsrfSubscriber($manager))->validate($event);
        self::assertSame(403, $event->getResponse()?->getStatusCode());
    }

    public function testFedaPayWebhookAndReadsAreExempt(): void
    {
        $manager = $this->createMock(CsrfTokenManagerInterface::class);
        $manager->expects(self::never())->method('isTokenValid');
        foreach ([['/api/fedapay/webhook', 'POST'], ['/api/csrf-token', 'GET'], ['/api/orders', 'OPTIONS']] as [$path, $method]) {
            $event = $this->request($path, $method);
            (new ApiCsrfSubscriber($manager))->validate($event);
            self::assertFalse($event->hasResponse());
        }
    }

    private function request(string $path, string $method): RequestEvent
    {
        return new RequestEvent($this->createMock(HttpKernelInterface::class), Request::create($path, $method), HttpKernelInterface::MAIN_REQUEST);
    }
}
