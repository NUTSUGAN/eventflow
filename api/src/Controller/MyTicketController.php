<?php

namespace App\Controller;

use App\Entity\Order;
use App\Entity\Payment;
use App\Entity\Ticket;
use App\Entity\User;
use App\Repository\TicketRepository;
use App\Service\TicketFulfillmentService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/me/tickets')]
final class MyTicketController extends AbstractController
{
    private const PUBLIC_TIMEZONE = 'Europe/Paris';

    #[Route('', name: 'api_my_tickets_index', methods: ['GET'])]
    public function index(
        Request $request,
        TicketRepository $ticketRepository,
        TicketFulfillmentService $ticketFulfillmentService,
    ): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $ticketFulfillmentService->fulfillPaidOrdersForUser($user);
        $tickets = $ticketRepository->findPaidTicketsForUser($user);

        return $this->json([
            'tickets' => array_map(
                fn (Ticket $ticket): array => $this->serializeTicket($request, $ticket),
                $tickets,
            ),
        ]);
    }

    #[Route('/{ticketId<\d+>}', name: 'api_my_tickets_show', methods: ['GET'])]
    public function show(
        int $ticketId,
        Request $request,
        TicketRepository $ticketRepository,
        TicketFulfillmentService $ticketFulfillmentService,
    ): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $ticketFulfillmentService->fulfillPaidOrdersForUser($user);
        $ticket = $ticketRepository->findPaidTicketForUserById($user, $ticketId);

        if (!$ticket instanceof Ticket) {
            return $this->json([
                'message' => 'Billet introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'ticket' => $this->serializeTicket($request, $ticket, true),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeTicket(Request $request, Ticket $ticket, bool $includeQrToken = false): array
    {
        $order = $ticket->getCustomerOrder();
        $ticketType = $ticket->getTicketType();
        $event = $ticketType?->getEvent();
        $location = $event?->getLocation();
        $venue = $location?->getAddress() ?? $location?->getCity() ?? 'Lieu a confirmer';

        return [
            'id' => $ticket->getId(),
            'displayCode' => sprintf('EVF-%06d', (int) ($ticket->getId() ?? 0)),
            'status' => $ticket->getStatus(),
            'issuedAt' => $this->formatDateTimeForFrontend($ticket->getIssuedAt()),
            'qrToken' => $includeQrToken ? $ticket->getQrToken() : null,
            'ticketType' => [
                'id' => $ticketType?->getId(),
                'name' => $ticketType?->getName(),
                'description' => $ticketType?->getDescription(),
            ],
            'order' => [
                'id' => $order?->getId(),
                'reference' => $order?->getReference(),
                'status' => $order?->getStatus(),
                'createdAt' => $this->formatDateTimeForFrontend($order?->getCreatedAt()),
                'total' => (float) ($order?->getTotalAmount() ?? '0.00'),
                'currency' => $order?->getCurrency() ?? Order::DEFAULT_CURRENCY,
                'payment' => $this->serializePayment($order?->getPayment()),
            ],
            'event' => [
                'id' => $event?->getId(),
                'title' => $event?->getTitle(),
                'startsAt' => $this->formatDateTimeForFrontend($event?->getStartDatetime()),
                'endsAt' => $this->formatDateTimeForFrontend($event?->getEndDatetime()),
                'city' => $location?->getCity(),
                'venue' => $venue,
                'coverImageUrl' => $this->toPublicAssetUrl($request, $event?->getCoverPhoto() ?? $event?->getThumbnailPhoto()),
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function serializePayment(?Payment $payment): ?array
    {
        if (!$payment instanceof Payment) {
            return null;
        }

        return [
            'provider' => $payment->getProvider(),
            'providerPaymentId' => $payment->getProviderPaymentId(),
            'amount' => (float) ($payment->getAmount() ?? '0.00'),
            'currency' => $payment->getCurrency(),
            'status' => $payment->getStatus(),
            'paidAt' => $this->formatDateTimeForFrontend($payment->getPaidAt()),
        ];
    }

    private function formatDateTimeForFrontend(?\DateTimeImmutable $dateTime): ?string
    {
        if (!$dateTime instanceof \DateTimeImmutable) {
            return null;
        }

        return $dateTime
            ->setTimezone(new \DateTimeZone(self::PUBLIC_TIMEZONE))
            ->format(DATE_ATOM);
    }

    private function normalizeMediaPath(?string $path): ?string
    {
        $path = trim((string) $path);

        if ('' === $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $normalizedPath = str_replace('\\', '/', $path);

        if (!str_starts_with($normalizedPath, '/')) {
            return null;
        }

        return $this->publicFileExists($normalizedPath) ? $normalizedPath : null;
    }

    private function toPublicAssetUrl(Request $request, ?string $path): ?string
    {
        $normalizedPath = $this->normalizeMediaPath($path);

        if (null === $normalizedPath) {
            return null;
        }

        if (
            str_starts_with($normalizedPath, 'http://')
            || str_starts_with($normalizedPath, 'https://')
        ) {
            return $normalizedPath;
        }

        return $request->getSchemeAndHttpHost().$normalizedPath;
    }

    private function publicFileExists(string $publicPath): bool
    {
        if (
            str_starts_with($publicPath, 'http://')
            || str_starts_with($publicPath, 'https://')
        ) {
            return true;
        }

        $filesystemPath = dirname(__DIR__, 2).'/public'.str_replace('/', DIRECTORY_SEPARATOR, $publicPath);

        return is_file($filesystemPath);
    }
}
