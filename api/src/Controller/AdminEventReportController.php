<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\EventReport;
use App\Entity\User;
use App\Repository\EventReportRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/event-reports')]
#[IsGranted('ROLE_ADMIN_SUPPORT')]
final class AdminEventReportController extends AbstractController
{
    #[Route('', name: 'api_admin_event_report_index', methods: ['GET'])]
    public function index(
        Request $request,
        EventReportRepository $eventReportRepository,
    ): JsonResponse {
        $status = strtolower(trim((string) $request->query->get('status', '')));
        $status = '' !== $status ? $status : null;

        if (null !== $status && !in_array($status, EventReport::STATUSES, true)) {
            return $this->json(['message' => 'Filtre de statut invalide.'], Response::HTTP_BAD_REQUEST);
        }

        return $this->json([
            'items' => array_map(
                fn (EventReport $eventReport): array => $this->serializeReport($eventReport),
                $eventReportRepository->findForAdmin($status),
            ),
        ]);
    }

    #[Route('/{id<\d+>}', name: 'api_admin_event_report_show', methods: ['GET'])]
    public function show(EventReport $eventReport): JsonResponse
    {
        return $this->json([
            'report' => $this->serializeReport($eventReport),
        ]);
    }

    #[Route('/{id<\d+>}', name: 'api_admin_event_report_update', methods: ['PATCH'])]
    public function update(
        EventReport $eventReport,
        Request $request,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $data = $request->toArray();
        $status = strtolower(trim((string) ($data['status'] ?? '')));

        if (!in_array($status, EventReport::STATUSES, true)) {
            return $this->json(['message' => 'Statut de signalement invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $eventReport->setStatus($status);
        $entityManager->flush();

        return $this->json([
            'message' => 'Statut du signalement mis à jour.',
            'report' => $this->serializeReport($eventReport),
        ]);
    }

    /**
     * @return array{
     *   id: int|null,
     *   reason: string|null,
     *   details: string|null,
     *   status: string|null,
     *   createdAt: string|null,
     *   event: array{id: int|null, title: string|null, status: string|null, startDatetime: string|null, city: string|null},
     *   reporter: array{id: int|null, fullName: string, email: string|null},
     *   organizer: array{id: int|null, fullName: string|null, email: string|null}
     * }
     */
    private function serializeReport(EventReport $eventReport): array
    {
        $event = $eventReport->getEvent();
        $reporter = $eventReport->getReporter();
        $organizer = $event?->getOrganizer();

        return [
            'id' => $eventReport->getId(),
            'reason' => $eventReport->getReason(),
            'details' => $eventReport->getDetails(),
            'status' => $eventReport->getStatus(),
            'createdAt' => $eventReport->getCreatedAt()?->format(DATE_ATOM),
            'event' => $this->serializeEventSummary($event),
            'reporter' => $this->serializeUserSummary($reporter),
            'organizer' => [
                'id' => $organizer?->getId(),
                'fullName' => $organizer?->getDisplayName(),
                'email' => $organizer?->getEmail(),
            ],
        ];
    }

    /**
     * @return array{id: int|null, title: string|null, status: string|null, startDatetime: string|null, city: string|null}
     */
    private function serializeEventSummary(?Event $event): array
    {
        return [
            'id' => $event?->getId(),
            'title' => $event?->getTitle(),
            'status' => $event?->getStatus(),
            'startDatetime' => $event?->getStartDatetime()?->format(DATE_ATOM),
            'city' => $event?->getLocation()?->getCity(),
        ];
    }

    /**
     * @return array{id: int|null, fullName: string, email: string|null}
     */
    private function serializeUserSummary(?User $user): array
    {
        return [
            'id' => $user?->getId(),
            'fullName' => $user?->getDisplayName() ?? 'Utilisateur inconnu',
            'email' => $user?->getEmail(),
        ];
    }
}
