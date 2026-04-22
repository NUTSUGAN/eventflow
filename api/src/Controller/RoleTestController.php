<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

class RoleTestController extends AbstractController
{
    #[Route('/api/test/user', name: 'api_test_user', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function user(): JsonResponse
    {
        return $this->json([
            'message' => 'Accès autorisé pour un utilisateur connecté.'
        ]);
    }

    #[Route('/api/test/admin', name: 'api_test_admin', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function admin(): JsonResponse
    {
        return $this->json([
            'message' => 'Accès autorisé pour un administrateur.'
        ]);
    }

    #[Route('/api/test/organizer', name: 'api_test_organizer', methods: ['GET'])]
    #[IsGranted('ROLE_ORGANIZER')]
    public function organizer(): JsonResponse
    {
        return $this->json([
            'message' => 'Accès autorisé pour un organisateur.'
        ]);
    }

    #[Route('/api/test/staff', name: 'api_test_staff', methods: ['GET'])]
    #[IsGranted('ROLE_STAFF')]
    public function staff(): JsonResponse
    {
        return $this->json([
            'message' => 'Accès autorisé pour le staff.'
        ]);
    }
}