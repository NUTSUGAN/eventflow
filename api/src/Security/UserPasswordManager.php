<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserPasswordManager
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function hashPassword(User $user, string $plainPassword): void
    {
        $user->setPasswordHash($this->passwordHasher->hashPassword($user, $plainPassword));
    }
}
