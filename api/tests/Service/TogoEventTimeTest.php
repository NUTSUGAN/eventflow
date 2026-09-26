<?php

namespace App\Tests\Service;

use App\Controller\OrganizerEventController;
use App\Controller\OrganizerTicketTypeController;
use PHPUnit\Framework\TestCase;

final class TogoEventTimeTest extends TestCase
{
    public function testEventAndSaleInputsDoNotFollowFrenchDaylightSavingTime(): void
    {
        foreach ([OrganizerEventController::class => 'parseDateTime', OrganizerTicketTypeController::class => 'parseLocalDateTime'] as $class => $method) {
            $reflection = new \ReflectionClass($class);
            $controller = $reflection->newInstanceWithoutConstructor();
            foreach (['2027-03-28T02:30', '2027-10-31T02:30'] as $input) {
                $date = $reflection->getMethod($method)->invoke($controller, $input);
                self::assertSame($input, $date->format('Y-m-d\TH:i'));
                self::assertSame('+00:00', $date->format('P'));
            }
        }
    }
}
