<?php

namespace App\Tests\Entity;

use App\Entity\User;
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    public function testUserIdentifierUsesEmail(): void
    {
        $user = (new User())->setEmail('client@eventflow.test');

        self::assertSame('client@eventflow.test', $user->getUserIdentifier());
    }

    public function testRoleIsNormalizedForSymfonySecurity(): void
    {
        $user = (new User())->setRole('client');

        self::assertSame('ROLE_CLIENT', $user->getRole());
        self::assertSame(['ROLE_CLIENT', 'ROLE_USER'], $user->getRoles());
    }

    public function testKnownApplicationRolesAreAvailable(): void
    {
        self::assertSame('ROLE_CLIENT', User::ROLE_CLIENT);
        self::assertSame('ROLE_ORGANIZER', User::ROLE_ORGANIZER);
        self::assertSame('ROLE_STAFF', User::ROLE_STAFF);
        self::assertSame('ROLE_ADMIN', User::ROLE_ADMIN);
    }
}
