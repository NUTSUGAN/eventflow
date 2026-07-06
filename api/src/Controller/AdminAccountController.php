<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin')]
#[IsGranted('ROLE_ADMIN')]
final class AdminAccountController extends AbstractController
{
    #[Route('/admin-users', name: 'api_admin_account_index', methods: ['GET'])]
    public function index(Request $request, UserRepository $userRepository): JsonResponse
    {
        $admins = $userRepository->findAdminAccounts(
            $this->normalizeNullableString($request->query->get('search')),
        );

        return $this->json(array_map($this->serializeAdmin(...), $admins));
    }

    #[Route('/users/{id}/grant-admin', name: 'api_admin_account_grant', methods: ['POST', 'PATCH'])]
    public function grantAdmin(
        User $user,
        Request $request,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $role = $this->readAdminRole($request, User::ROLE_ADMIN_SUPPORT);

        if (null === $role) {
            return $this->json(['message' => 'Rôle admin invalide.'], 400);
        }

        $user->setRole($role);
        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json([
            'message' => 'Accès admin attribué.',
            'user' => $this->serializeAdmin($user),
        ]);
    }

    #[Route('/users/{id}/revoke-admin', name: 'api_admin_account_revoke', methods: ['POST', 'PATCH'])]
    public function revokeAdmin(User $user, EntityManagerInterface $entityManager): JsonResponse
    {
        $currentUser = $this->getUser();

        if ($currentUser instanceof User && $currentUser->getId() === $user->getId()) {
            return $this->json(['message' => 'Tu ne peux pas supprimer ton propre accès admin.'], 409);
        }

        if (!$user->isAdminAccount()) {
            return $this->json(['message' => 'Ce compte n’est pas admin.'], 409);
        }

        $user->setRole(User::ROLE_CLIENT);
        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json([
            'message' => 'Accès admin retiré.',
            'user' => $this->serializeAdmin($user),
        ]);
    }

    #[Route('/users/{id}/change-admin-role', name: 'api_admin_account_change_role', methods: ['POST', 'PATCH'])]
    public function changeAdminRole(
        User $user,
        Request $request,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if (!$user->isAdminAccount()) {
            return $this->json(['message' => 'Ce compte n’est pas admin.'], 409);
        }

        $role = $this->readAdminRole($request);

        if (null === $role) {
            return $this->json(['message' => 'Rôle admin invalide.'], 400);
        }

        $currentUser = $this->getUser();

        if (
            $currentUser instanceof User &&
            $currentUser->getId() === $user->getId() &&
            User::ROLE_ADMIN !== $role
        ) {
            return $this->json(['message' => 'Tu ne peux pas retirer ton propre rôle super admin.'], 409);
        }

        $user->setRole($role);
        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json([
            'message' => 'Rôle admin mis à jour.',
            'user' => $this->serializeAdmin($user),
        ]);
    }

    /**
     * @return array{
     *   id: int|null,
     *   email: string|null,
     *   firstName: string|null,
     *   lastName: string|null,
     *   fullName: string,
     *   role: string,
     *   accountStatus: string,
     *   createdAt: string|null
     * }
     */
    private function serializeAdmin(User $user): array
    {
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'fullName' => $user->getDisplayName(),
            'role' => $user->getBaseRole(),
            'accountStatus' => $user->getAccountStatus(),
            'createdAt' => $user->getCreatedAt()?->format(DATE_ATOM),
        ];
    }

    private function readAdminRole(Request $request, ?string $default = null): ?string
    {
        try {
            $data = $request->toArray();
        } catch (\Throwable) {
            $data = [];
        }

        $role = is_string($data['role'] ?? null) ? strtoupper(trim($data['role'])) : $default;

        if (null === $role || '' === $role) {
            return null;
        }

        if (!str_starts_with($role, 'ROLE_')) {
            $role = 'ROLE_'.$role;
        }

        return in_array($role, [
            User::ROLE_ADMIN,
            User::ROLE_ADMIN_SUPPORT,
            User::ROLE_ADMIN_FINANCE,
        ], true) ? $role : null;
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' !== $value ? $value : null;
    }
}
