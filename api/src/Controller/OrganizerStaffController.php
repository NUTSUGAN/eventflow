<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\OrganizerStaffService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/organizer/staff')]
final class OrganizerStaffController extends AbstractController
{
    #[Route('', name: 'api_organizer_staff_index', methods: ['GET'])]
    public function index(OrganizerStaffService $organizerStaffService): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->canManageStaff()) {
            return $this->json([
                'message' => 'Accès réservé aux organisateurs pour la gestion du staff.',
            ], Response::HTTP_FORBIDDEN);
        }

        $memberships = $organizerStaffService->listMembers($user);

        return $this->json([
            'staffMembers' => array_map(
                fn ($membership): array => $organizerStaffService->serializeMembership($membership),
                $memberships,
            ),
            'count' => $organizerStaffService->countMembers($user),
            'totalCount' => count($memberships),
            'limit' => OrganizerStaffService::MAX_STAFF_MEMBERS,
        ]);
    }

    #[Route('', name: 'api_organizer_staff_create', methods: ['POST'])]
    public function create(
        Request $request,
        OrganizerStaffService $organizerStaffService,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->canManageStaff()) {
            return $this->json([
                'message' => 'Accès réservé aux organisateurs pour la gestion du staff.',
            ], Response::HTTP_FORBIDDEN);
        }

        $payload = $request->toArray();
        $email = trim((string) ($payload['email'] ?? ''));

        try {
            $membership = $organizerStaffService->addMemberByEmail($user, $email);
        } catch (\DomainException $exception) {
            return $this->json([
                'message' => $exception->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }

        $wasReactivated =
            $membership->getCreatedAt() instanceof \DateTimeImmutable
            && $membership->getStatusChangedAt() instanceof \DateTimeImmutable
            && $membership->getStatusChangedAt() > $membership->getCreatedAt();

        return $this->json([
            'message' => $wasReactivated
                ? 'Le membre du staff a été remis en service.'
                : 'Membre du staff ajoute avec succès.',
            'staffMember' => $organizerStaffService->serializeMembership($membership),
            'count' => $organizerStaffService->countMembers($user),
            'totalCount' => count($organizerStaffService->listMembers($user)),
            'limit' => OrganizerStaffService::MAX_STAFF_MEMBERS,
        ], Response::HTTP_CREATED);
    }

    #[Route('/{membershipId<\d+>}/out-of-service', name: 'api_organizer_staff_deactivate', methods: ['PATCH'])]
    public function deactivate(
        int $membershipId,
        OrganizerStaffService $organizerStaffService,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->canManageStaff()) {
            return $this->json([
                'message' => 'Accès réservé aux organisateurs pour la gestion du staff.',
            ], Response::HTTP_FORBIDDEN);
        }

        try {
            $membership = $organizerStaffService->setMemberOutOfService($user, $membershipId);
        } catch (\DomainException $exception) {
            return $this->json([
                'message' => $exception->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }

        return $this->json([
            'message' => 'Le membre a été passe hors service.',
            'staffMember' => $organizerStaffService->serializeMembership($membership),
            'count' => $organizerStaffService->countMembers($user),
            'totalCount' => count($organizerStaffService->listMembers($user)),
            'limit' => OrganizerStaffService::MAX_STAFF_MEMBERS,
        ]);
    }
}
