<?php

namespace App\Tests\Security;

use App\Entity\User;
use App\Security\UserPasswordManager;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class UserPasswordManagerTest extends KernelTestCase
{
    public function testPasswordIsHashedAndCanBeVerified(): void
    {
        self::bootKernel();

        $container = static::getContainer();
        $passwordHasher = $container->get(UserPasswordHasherInterface::class);
        $manager = new UserPasswordManager($passwordHasher);

        $user = (new User())
            ->setEmail('client@eventflow.test')
            ->setRole(User::ROLE_CLIENT);

        $manager->hashPassword($user, 'Password123!');

        self::assertNotSame('Password123!', $user->getPasswordHash());
        self::assertTrue($passwordHasher->isPasswordValid($user, 'Password123!'));
    }
}
