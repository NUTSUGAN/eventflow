<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\User;
use App\Entity\WithdrawalRequest;
use App\Repository\EventRepository;
use App\Repository\WithdrawalRequestRepository;
use App\Service\WithdrawalService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/organizer/withdrawals')]
final class OrganizerWithdrawalController extends AbstractController
{
    #[Route('', name: 'api_organizer_withdrawal_index', methods: ['GET'])]
    public function index(
        EventRepository $eventRepository,
        WithdrawalRequestRepository $withdrawalRepository,
        WithdrawalService $withdrawalService,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json(['message' => 'Accès réservé aux organisateurs.'], Response::HTTP_FORBIDDEN);
        }

        $events = $eventRepository->findBy(['organizer' => $user], ['createdAt' => 'DESC']);
        $existingWithdrawals = $withdrawalRepository->findForOrganizer($user);
        $withdrawalsByEventId = [];

        foreach ($existingWithdrawals as $withdrawal) {
            $eventId = $withdrawal->getEvent()?->getId();

            if (null !== $eventId && !isset($withdrawalsByEventId[$eventId])) {
                $withdrawalsByEventId[$eventId] = $withdrawal;
            }
        }

        $items = [];

        foreach ($events as $event) {
            if (!$event instanceof Event || !$withdrawalService->isEventFinished($event)) {
                continue;
            }

            $amounts = $withdrawalService->calculateEventAmounts($event);
            $withdrawal = $withdrawalsByEventId[$event->getId()] ?? null;
            $hasBlockingWithdrawal = $withdrawalRepository->hasBlockingRequestForEvent($event);

            if ((float) $amounts['grossAmount'] <= 0 && !$withdrawal instanceof WithdrawalRequest) {
                continue;
            }

            $items[] = [
                'event' => [
                    'id' => $event->getId(),
                    'title' => $event->getTitle(),
                    'startDatetime' => $event->getStartDatetime()?->format(DATE_ATOM),
                    'endDatetime' => $event->getEndDatetime()?->format(DATE_ATOM),
                    'withdrawalFeePercent' => $event->getWithdrawalFeePercent(),
                ],
                'amounts' => $amounts,
                'withdrawal' => $withdrawal instanceof WithdrawalRequest
                    ? $withdrawalService->serialize($withdrawal)
                    : null,
                'canRequest' => !$hasBlockingWithdrawal && (float) $amounts['grossAmount'] > 0,
            ];
        }

        return $this->json(['items' => $items]);
    }

    #[Route('/{id<\d+>}', name: 'api_organizer_withdrawal_show', methods: ['GET'])]
    public function show(
        WithdrawalRequest $withdrawal,
        WithdrawalService $withdrawalService,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json(['message' => 'Accès réservé aux organisateurs.'], Response::HTTP_FORBIDDEN);
        }

        $isOwner = $withdrawal->getOrganizer()?->getId() === $user->getId();
        $isAdmin = User::ROLE_ADMIN === $user->getEffectiveRole();

        if (!$isOwner && !$isAdmin) {
            return $this->json(['message' => 'Ce suivi de retrait ne t’appartient pas.'], Response::HTTP_FORBIDDEN);
        }

        return $this->json([
            'withdrawal' => $withdrawalService->serialize($withdrawal),
        ]);
    }

    #[Route('', name: 'api_organizer_withdrawal_create', methods: ['POST'])]
    public function create(
        Request $request,
        EventRepository $eventRepository,
        WithdrawalService $withdrawalService,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Non authentifié.'], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json(['message' => 'Accès réservé aux organisateurs.'], Response::HTTP_FORBIDDEN);
        }

        $data = $request->toArray();
        $eventId = (int) ($data['eventId'] ?? 0);
        $event = $eventId > 0 ? $eventRepository->find($eventId) : null;

        if (!$event instanceof Event) {
            return $this->json(['message' => 'Évènement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        try {
            $withdrawal = $withdrawalService->createRequest($event, $user);
        } catch (\DomainException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        }

        return $this->json([
            'message' => 'Demande de retrait envoyée à EventFlow.',
            'withdrawal' => $withdrawalService->serialize($withdrawal),
        ], Response::HTTP_CREATED);
    }

    private function isOrganizerOrAdmin(User $user): bool
    {
        return in_array($user->getEffectiveRole(), [User::ROLE_ORGANIZER, User::ROLE_ADMIN], true);
    }
}
