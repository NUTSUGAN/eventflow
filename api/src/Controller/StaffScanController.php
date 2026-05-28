<?php

namespace App\Controller;

use App\Entity\User;
use App\Service\StaffCheckinService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/staff/scan')]
final class StaffScanController extends AbstractController
{
    #[Route('/events', name: 'api_staff_scan_events', methods: ['GET'])]
    public function events(StaffCheckinService $staffCheckinService): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->canAccessStaffTools()) {
            return $this->json([
                'message' => 'Acces reserve au staff et aux organisateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $this->json([
            'events' => $staffCheckinService->listAccessibleEvents($user),
        ]);
    }

    #[Route('/checkins', name: 'api_staff_scan_checkin', methods: ['POST'])]
    public function checkin(
        Request $request,
        StaffCheckinService $staffCheckinService,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->canAccessStaffTools()) {
            return $this->json([
                'message' => 'Acces reserve au staff et aux organisateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        $payload = $request->toArray();
        $eventId = (int) ($payload['eventId'] ?? 0);
        $scanPayload = trim((string) ($payload['scanPayload'] ?? $payload['qrToken'] ?? ''));

        if ($eventId <= 0 || '' === $scanPayload) {
            return $this->json([
                'message' => 'eventId et scanPayload sont obligatoires.',
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            $result = $staffCheckinService->registerScan($user, $eventId, $scanPayload);
        } catch (\DomainException $exception) {
            return $this->json([
                'message' => $exception->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }

        return $this->json($result);
    }
}
