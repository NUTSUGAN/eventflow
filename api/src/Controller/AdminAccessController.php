<?php

namespace App\Controller;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin')]
#[IsGranted('ROLE_ADMIN')]
final class AdminAccessController extends AbstractController
{
    #[Route('/roles', name: 'api_admin_roles_index', methods: ['GET'])]
    public function roles(): JsonResponse
    {
        return $this->json([
            'items' => [
                [
                    'role' => User::ROLE_ADMIN,
                    'label' => 'Super administrateur',
                    'description' => 'Accès complet, comptes admin, finance et historique sensible.',
                ],
                [
                    'role' => User::ROLE_ADMIN_SUPPORT,
                    'label' => 'Support admin',
                    'description' => 'Support, modération et contenu hors finance et hors comptes admin.',
                ],
                [
                    'role' => User::ROLE_ADMIN_FINANCE,
                    'label' => 'Admin finance',
                    'description' => 'Commandes, paiements, retraits et frais plateforme.',
                ],
            ],
        ]);
    }

    #[Route('/admin-invitations', name: 'api_admin_invitations_index', methods: ['GET'])]
    public function invitations(): JsonResponse
    {
        return $this->json([
            'items' => [],
            'message' => 'Les invitations admin ne sont pas encore actives.',
        ]);
    }
}
