<?php

namespace App\Controller;

use App\Entity\Checkin;
use App\Entity\Ticket;
use App\Repository\CheckinRepository;
use App\Repository\TicketRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/tickets')]
#[IsGranted('ROLE_ADMIN_SUPPORT')]
final class AdminTicketController extends AbstractController
{
    #[Route('', name: 'api_admin_ticket_index', methods: ['GET'])]
    public function index(
        TicketRepository $ticketRepository,
        CheckinRepository $checkinRepository,
    ): JsonResponse {
        $tickets = $ticketRepository->findForAdminAudit();

        return $this->json(array_map(
            fn (Ticket $ticket): array => $this->serializeTicket(
                $ticket,
                $checkinRepository->findLatestForTicket($ticket),
            ),
            $tickets,
        ));
    }

    private function serializeTicket(Ticket $ticket, ?Checkin $latestCheckin): array
    {
        $order = $ticket->getCustomerOrder();
        $client = $order?->getClient();
        $ticketType = $ticket->getTicketType();
        $event = $ticketType?->getEvent();

        return [
            'id' => $ticket->getId(),
            'status' => $ticket->getStatus(),
            'issuedAt' => $ticket->getIssuedAt()?->format(DATE_ATOM),
            'qrTokenMasked' => $this->maskToken((string) $ticket->getQrToken()),
            'order' => [
                'id' => $order?->getId(),
                'reference' => $order?->getReference(),
                'status' => $order?->getStatus(),
            ],
            'client' => [
                'id' => $client?->getId(),
                'fullName' => $client?->getDisplayName(),
                'email' => $client?->getEmail(),
            ],
            'ticketType' => [
                'id' => $ticketType?->getId(),
                'name' => $ticketType?->getName(),
            ],
            'event' => [
                'id' => $event?->getId(),
                'title' => $event?->getTitle(),
                'startDatetime' => $event?->getStartDatetime()?->format(DATE_ATOM),
                'location' => [
                    'city' => $event?->getLocation()?->getCity(),
                ],
            ],
            'latestCheckin' => $latestCheckin ? [
                'id' => $latestCheckin->getId(),
                'result' => $latestCheckin->getResult(),
                'scannedAt' => $latestCheckin->getScannedAt()?->format(DATE_ATOM),
                'staff' => [
                    'id' => $latestCheckin->getStaffUser()?->getId(),
                    'fullName' => $latestCheckin->getStaffUser()?->getDisplayName(),
                    'email' => $latestCheckin->getStaffUser()?->getEmail(),
                ],
            ] : null,
        ];
    }

    private function maskToken(string $token): string
    {
        $token = trim($token);

        if ('' === $token) {
            return '';
        }

        if (strlen($token) <= 12) {
            return substr($token, 0, 3).'...'.substr($token, -3);
        }

        return substr($token, 0, 6).'...'.substr($token, -4);
    }
}
