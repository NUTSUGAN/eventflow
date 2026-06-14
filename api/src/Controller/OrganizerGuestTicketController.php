<?php

namespace App\Controller;

use App\Entity\Checkin;
use App\Entity\Event;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Ticket;
use App\Entity\TicketType;
use App\Entity\User;
use App\Repository\CheckinRepository;
use App\Repository\EventRepository;
use App\Repository\OrderItemRepository;
use App\Repository\TicketRepository;
use App\Repository\TicketTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;

final class OrganizerGuestTicketController extends AbstractController
{
    private const PUBLIC_TIMEZONE = 'Europe/Paris';

    #[Route('/api/organizer/events/{eventId}/guest-tickets', name: 'api_organizer_guest_tickets_index', methods: ['GET'])]
    public function index(
        int $eventId,
        Request $request,
        EventRepository $eventRepository,
        TicketRepository $ticketRepository,
        CheckinRepository $checkinRepository,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Non authentifie.'], Response::HTTP_UNAUTHORIZED);
        }

        $event = $eventRepository->find($eventId);

        if (!$event instanceof Event) {
            return $this->json(['message' => 'Evenement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if (!$this->canManageEvent($user, $event)) {
            return $this->json(['message' => 'Vous ne pouvez gerer que vos propres invitations.'], Response::HTTP_FORBIDDEN);
        }

        return $this->json([
            'guestTickets' => array_map(
                fn (Ticket $ticket): array => $this->serializeGuestTicket($request, $ticket, $checkinRepository),
                $ticketRepository->findInvitationsForEvent($eventId),
            ),
        ]);
    }

    #[Route('/api/organizer/events/{eventId}/guest-tickets', name: 'api_organizer_guest_tickets_create', methods: ['POST'])]
    public function create(
        int $eventId,
        Request $request,
        EventRepository $eventRepository,
        TicketTypeRepository $ticketTypeRepository,
        TicketRepository $ticketRepository,
        OrderItemRepository $orderItemRepository,
        CheckinRepository $checkinRepository,
        EntityManagerInterface $entityManager,
        MailerInterface $mailer,
        LoggerInterface $logger,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Non authentifie.'], Response::HTTP_UNAUTHORIZED);
        }

        $event = $eventRepository->find($eventId);

        if (!$event instanceof Event) {
            return $this->json(['message' => 'Evenement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if (!$this->canManageEvent($user, $event)) {
            return $this->json(['message' => 'Vous ne pouvez inviter que sur vos propres evenements.'], Response::HTTP_FORBIDDEN);
        }

        $payload = $request->toArray();
        $recipientEmail = mb_strtolower(trim((string) ($payload['recipientEmail'] ?? '')));
        $recipientName = trim((string) ($payload['recipientName'] ?? ''));
        $ticketTypeId = (int) ($payload['ticketTypeId'] ?? 0);

        if ('' === $recipientEmail || false === filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['message' => 'Renseigne un email invite valide.'], Response::HTTP_BAD_REQUEST);
        }

        if ($ticketTypeId <= 0) {
            return $this->json(['message' => 'Choisis le type de billet a envoyer.'], Response::HTTP_BAD_REQUEST);
        }

        $ticketType = $ticketTypeRepository->find($ticketTypeId);

        if (
            !$ticketType instanceof TicketType
            || $ticketType->getEvent()?->getId() !== $event->getId()
        ) {
            return $this->json(['message' => 'Ce type de billet ne correspond pas a cet evenement.'], Response::HTTP_BAD_REQUEST);
        }

        if (!$ticketType->isActive()) {
            return $this->json(['message' => 'Ce type de billet est inactif.'], Response::HTTP_BAD_REQUEST);
        }

        $reservedQuantity = $orderItemRepository->countReservedQuantityForTicketType(
            $ticketType,
            Order::STOCK_CONSUMING_STATUSES,
        );
        $availableStock = max(0, (int) ($ticketType->getStock() ?? 0) - $reservedQuantity);

        if ($availableStock <= 0) {
            return $this->json(['message' => 'Il n y a plus de place disponible sur ce billet.'], Response::HTTP_BAD_REQUEST);
        }

        $now = new \DateTimeImmutable();
        $order = (new Order())
            ->setClient($user)
            ->setPromotionCampaign(null)
            ->setReference($this->generateInvitationReference())
            ->setStatus(Order::STATUS_PAID)
            ->setOrderType(Order::TYPE_TICKET)
            ->setTotalAmount('0.00')
            ->setCurrency(Order::DEFAULT_CURRENCY)
            ->setCreatedAt($now)
        ;

        $orderItem = (new OrderItem())
            ->setCustomerOrder($order)
            ->setTicketType($ticketType)
            ->setQuantity(1)
            ->setUnitPriceAtPurchase('0.00')
        ;
        $order->addOrderItem($orderItem);

        $ticket = (new Ticket())
            ->setCustomerOrder($order)
            ->setTicketType($ticketType)
            ->setQrToken($this->generateUniqueQrToken($ticketRepository))
            ->setStatus(Ticket::STATUS_ISSUED)
            ->setSource(Ticket::SOURCE_INVITATION)
            ->setRecipientEmail($recipientEmail)
            ->setRecipientName('' !== $recipientName ? $recipientName : null)
            ->setIssuedAt($now)
        ;
        $order->addTicket($ticket);

        $entityManager->persist($order);
        $entityManager->persist($orderItem);
        $entityManager->persist($ticket);
        $entityManager->flush();

        try {
            $this->sendGuestTicketEmail($request, $mailer, $ticket);
            $ticket->setSentAt(new \DateTimeImmutable());
            $entityManager->flush();
        } catch (\Throwable $exception) {
            $logger->warning('Unable to send guest ticket email.', [
                'ticketId' => $ticket->getId(),
                'message' => $exception->getMessage(),
            ]);
        }

        return $this->json([
            'message' => null !== $ticket->getSentAt()
                ? 'Invitation créée et envoyée par email.'
                : 'Invitation créée, mais l\'email n\'a pas pu être envoyé pour le moment.',
            'guestTicket' => $this->serializeGuestTicket($request, $ticket, $checkinRepository),
        ], Response::HTTP_CREATED);
    }

    #[Route('/api/guest-tickets/{token}', name: 'api_guest_ticket_show', methods: ['GET'])]
    public function showPublicGuestTicket(
        string $token,
        Request $request,
        TicketRepository $ticketRepository,
        CheckinRepository $checkinRepository,
    ): JsonResponse {
        $ticket = $ticketRepository->findInvitationByQrToken($token);

        if (!$ticket instanceof Ticket) {
            return $this->json(['message' => 'Billet invite introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'guestTicket' => $this->serializeGuestTicket($request, $ticket, $checkinRepository, true),
        ]);
    }

    private function sendGuestTicketEmail(Request $request, MailerInterface $mailer, Ticket $ticket): void
    {
        $recipientEmail = trim((string) $ticket->getRecipientEmail());

        if ('' === $recipientEmail) {
            throw new \RuntimeException('Recipient email is missing.');
        }

        $event = $ticket->getTicketType()?->getEvent();
        $location = $event?->getLocation();
        $guestTicketUrl = $this->buildGuestTicketUrl($request, $ticket);
        $recipientName = trim((string) ($ticket->getRecipientName() ?? ''));

        $mailer->send(
            (new Email())
                ->from('no-reply@eventflow.local')
                ->to($recipientEmail)
                ->subject('Ton invitation EventFlow')
                ->text(sprintf(
                    "Bonjour %s,\n\n".
                    "Tu as recu une invitation pour l'événement : %s.\n\n".
                    "Date : %s\n".
                    "Lieu : %s\n".
                    "Billet : %s\n".
                    "Code : EVF-%06d\n\n".
                    "Ouvre ton billet et presente le QR code au scan :\n%s\n\n".
                    "A très vite sur EventFlow.\n",
                    '' !== $recipientName ? $recipientName : 'invite',
                    (string) ($event?->getTitle() ?? 'EventFlow'),
                    $this->formatDateTimeForFrontend($event?->getStartDatetime()) ?? 'Date à confirmer',
                    (string) ($location?->getAddress() ?? $location?->getCity() ?? 'Lieu à confirmer'),
                    (string) ($ticket->getTicketType()?->getName() ?? 'Invitation'),
                    (int) ($ticket->getId() ?? 0),
                    $guestTicketUrl,
                ))
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeGuestTicket(
        Request $request,
        Ticket $ticket,
        CheckinRepository $checkinRepository,
        bool $includeQrToken = false,
    ): array {
        $ticketType = $ticket->getTicketType();
        $event = $ticketType?->getEvent();
        $location = $event?->getLocation();
        $latestValidCheckin = $checkinRepository->findLatestValidForTicket($ticket);
        $latestCheckin = $checkinRepository->findLatestForTicket($ticket);

        return [
            'id' => $ticket->getId(),
            'displayCode' => sprintf('EVF-%06d', (int) ($ticket->getId() ?? 0)),
            'status' => $ticket->getStatus(),
            'source' => $ticket->getSource(),
            'recipientEmail' => $ticket->getRecipientEmail(),
            'recipientName' => $ticket->getRecipientName(),
            'issuedAt' => $this->formatDateTimeForFrontend($ticket->getIssuedAt()),
            'sentAt' => $this->formatDateTimeForFrontend($ticket->getSentAt()),
            'usedAt' => $this->formatDateTimeForFrontend($latestValidCheckin?->getScannedAt()),
            'scanResult' => $latestCheckin?->getResult(),
            'hasCheckedIn' => $ticket->getStatus() === Ticket::STATUS_USED || $latestValidCheckin instanceof Checkin,
            'qrToken' => $includeQrToken ? $ticket->getQrToken() : null,
            'guestTicketUrl' => $this->buildGuestTicketUrl($request, $ticket),
            'ticketType' => [
                'id' => $ticketType?->getId(),
                'name' => $ticketType?->getName(),
            ],
            'event' => [
                'id' => $event?->getId(),
                'title' => $event?->getTitle(),
                'startsAt' => $this->formatDateTimeForFrontend($event?->getStartDatetime()),
                'endsAt' => $this->formatDateTimeForFrontend($event?->getEndDatetime()),
                'city' => $location?->getCity(),
                'venue' => $location?->getAddress() ?? $location?->getCity(),
                'coverImageUrl' => $this->toPublicAssetUrl($request, $event?->getCoverPhoto() ?? $event?->getThumbnailPhoto()),
            ],
            'order' => [
                'id' => $ticket->getCustomerOrder()?->getId(),
                'reference' => $ticket->getCustomerOrder()?->getReference(),
            ],
        ];
    }

    private function canManageEvent(User $user, Event $event): bool
    {
        if (in_array(User::ROLE_ADMIN, $user->getRoles(), true)) {
            return true;
        }

        return in_array(User::ROLE_ORGANIZER, $user->getRoles(), true)
            && $event->getOrganizer()?->getId() === $user->getId();
    }

    private function generateUniqueQrToken(TicketRepository $ticketRepository): string
    {
        do {
            $token = bin2hex(random_bytes(24));
        } while (null !== $ticketRepository->findOneBy(['qrToken' => $token]));

        return $token;
    }

    private function generateInvitationReference(): string
    {
        return 'INV-'.(new \DateTimeImmutable())->format('YmdHis').'-'.strtoupper(bin2hex(random_bytes(3)));
    }

    private function buildGuestTicketUrl(Request $request, Ticket $ticket): string
    {
        $frontendAppUrl = $this->readEnv('FRONTEND_APP_URL') ?? $request->getSchemeAndHttpHost();

        return rtrim($frontendAppUrl, '/').'/guest-ticket/'.urlencode((string) $ticket->getQrToken());
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

    private function toPublicAssetUrl(Request $request, ?string $path): ?string
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

        return $request->getSchemeAndHttpHost().$normalizedPath;
    }

    private function readEnv(string $name): ?string
    {
        $value = $_SERVER[$name] ?? $_ENV[$name] ?? getenv($name);

        if (!is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return '' === $trimmed ? null : $trimmed;
    }
}
