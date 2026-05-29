<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

final class UserAccountStatusChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        if (!$user instanceof User || $user->canAuthenticate()) {
            return;
        }

        throw new CustomUserMessageAccountStatusException(
            'Ce compte est bloque. Contacte le support EventFlow.'
        );
    }

    public function checkPostAuth(UserInterface $user): void
    {
    }
}
