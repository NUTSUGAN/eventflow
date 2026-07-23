<?php

namespace App\Controller;

use App\Entity\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait OrganizerAdminReadOnlyTrait
{
    private function denyAdminOrganizerMutation(User $user, ?User $organizer = null): ?JsonResponse
    {
        if (!$user->isAdminAccount()) {
            return null;
        }

        if ($organizer instanceof User && $organizer->getId() === $user->getId()) {
            return null;
        }

        return $this->json([
            'message' => 'Les admins peuvent consulter cette fiche, mais seul l’organisateur peut la modifier.',
        ], Response::HTTP_FORBIDDEN);
    }
}
