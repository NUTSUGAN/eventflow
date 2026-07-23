<?php

namespace App\Service;

use App\Entity\Checkin;
use App\Entity\Event;
use App\Entity\Order;
use App\Entity\Payment;
use App\Entity\Ticket;
use App\Entity\User;
use App\Repository\CheckinRepository;
use App\Repository\EventRepository;
use App\Repository\TicketRepository;
use Doctrine\ORM\EntityManagerInterface;

final class StaffCheckinService
{
    public function __construct(
        private readonly EventRepository $eventRepository,
        private readonly TicketRepository $ticketRepository,
        private readonly CheckinRepository $checkinRepository,
        private readonly OrganizerStaffService $organizerStaffService,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listAccessibleEvents(User $user): array
    {
        $events = $this->eventRepository->findAccessibleForStaffScan(
            $user,
            $this->organizerStaffService->getAccessibleOrganizerIds($user),
        );

        return array_map(
            fn (Event $event): array => $this->serializeAccessibleEvent($event),
            $events,
        );
    }

    /**
     * @return array{
     *   result: string,
     *   message: string,
     *   checkin: array{id: int|null, scannedAt: string|null},
     *   ticket: array<string, mixed>|null
     * }
     */
    public function registerScan(User $staffUser, int $eventId, string $scanPayload): array
    {
        $event = $this->eventRepository->findOneForStaffScanById($eventId);

        if (!$event instanceof Event) {
            throw new \DomainException('L’évènement de scan est introuvable.');
        }

        if (!$this->organizerStaffService->canAccessEvent($staffUser, $event)) {
            throw new \DomainException('Tu n’as pas accès à cet évènement pour le scan.');
        }

        $normalizedToken = trim($scanPayload);

        if ('' === $normalizedToken) {
            throw new \DomainException('Le QR scanné est vide.');
        }

        [$ticket, $matchedToken] = $this->findTicketFromScanPayload($normalizedToken);
        $storedScannedToken = $matchedToken ?? $normalizedToken;

        if (
            !$ticket instanceof Ticket
            || $ticket->getTicketType()?->getEvent()?->getId() !== $event?->getId()
        ) {
            $checkin = $this->createCheckin(
                event: $event,
                staffUser: $staffUser,
                scannedToken: $storedScannedToken,
                result: Checkin::RESULT_INVALID,
            );

            return [
                'result' => Checkin::RESULT_INVALID,
                'message' => 'Billet invalide ou non associé à cet évènement.',
                'checkin' => $this->serializeCheckin($checkin),
                'ticket' => null,
            ];
        }

        if (!$this->isTicketEligibleForEntry($ticket)) {
            $checkin = $this->createCheckin(
                event: $event,
                staffUser: $staffUser,
                scannedToken: $storedScannedToken,
                result: Checkin::RESULT_INVALID,
                ticket: $ticket,
            );

            return [
                'result' => Checkin::RESULT_INVALID,
                'message' => 'Ce billet n’est pas exploitable pour un accès valide.',
                'checkin' => $this->serializeCheckin($checkin),
                'ticket' => $this->serializeTicket($ticket),
            ];
        }

        if ($ticket->getStatus() === Ticket::STATUS_USED) {
            $checkin = $this->createCheckin(
                event: $event,
                staffUser: $staffUser,
                scannedToken: $storedScannedToken,
                result: Checkin::RESULT_ALREADY_USED,
                ticket: $ticket,
            );

            $latestValidCheckin = $this->checkinRepository->findLatestValidForTicket($ticket);

            return [
                'result' => Checkin::RESULT_ALREADY_USED,
                'message' => 'Billet déjà utilisé.',
                'checkin' => $this->serializeCheckin($checkin),
                'ticket' => $this->serializeTicket($ticket, $latestValidCheckin?->getScannedAt()),
            ];
        }

        $ticket->setStatus(Ticket::STATUS_USED);
        $checkin = $this->createCheckin(
            event: $event,
            staffUser: $staffUser,
            scannedToken: $storedScannedToken,
            result: Checkin::RESULT_VALID,
            ticket: $ticket,
            flushTicket: true,
        );

        return [
            'result' => Checkin::RESULT_VALID,
            'message' => 'Billet valide. Accès autorisé.',
            'checkin' => $this->serializeCheckin($checkin),
            'ticket' => $this->serializeTicket($ticket, $checkin->getScannedAt()),
        ];
    }

    /**
     * @return array{0: Ticket|null, 1: string|null}
     */
    private function findTicketFromScanPayload(string $scanPayload): array
    {
        foreach ($this->buildScanTokenCandidates($scanPayload) as $candidateToken) {
            $ticket = $this->ticketRepository->findOneForCheckinByQrToken($candidateToken);

            if ($ticket instanceof Ticket) {
                return [$ticket, $candidateToken];
            }
        }

        return [null, null];
    }

    /**
     * A keyboard-wedge scanner can be configured as QWERTY while Windows is in
     * AZERTY. In that case the hex qrToken arrives with French keyboard symbols.
     *
     * @return list<string>
     */
    private function buildScanTokenCandidates(string $scanPayload): array
    {
        $rawToken = trim($scanPayload);

        if ('' === $rawToken) {
            return [];
        }

        $candidates = [];
        $this->addTokenCandidate($candidates, $rawToken);

        $azertyFixedToken = strtr($rawToken, [
            '&' => '1',
            'é' => '2',
            '"' => '3',
            '\'' => '4',
            '(' => '5',
            '-' => '6',
            'è' => '7',
            '_' => '8',
            'ç' => '9',
            'à' => '0',
            'q' => 'a',
            'Q' => 'A',
        ]);

        $this->addTokenCandidate($candidates, $azertyFixedToken);

        return $candidates;
    }

    /**
     * @param list<string> $candidates
     */
    private function addTokenCandidate(array &$candidates, string $candidate): void
    {
        $candidate = trim($candidate);

        if ('' === $candidate) {
            return;
        }

        foreach ([$candidate, strtolower($candidate)] as $token) {
            if (!in_array($token, $candidates, true)) {
                $candidates[] = $token;
            }
        }
    }

    /**
     * @return array{id: int|null, scannedAt: string|null}
     */
    private function serializeCheckin(Checkin $checkin): array
    {
        return [
            'id' => $checkin->getId(),
            'scannedAt' => $checkin->getScannedAt()?->format(DATE_ATOM),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeAccessibleEvent(Event $event): array
    {
        $organizer = $event->getOrganizer();
        $location = $event?->getLocation();

        return [
            'id' => $event?->getId(),
            'title' => $event?->getTitle(),
            'status' => $event->getStatus(),
            'startsAt' => $event?->getStartDatetime()?->format(DATE_ATOM),
            'city' => $location?->getCity(),
            'venue' => $location?->getAddress() ?? $location?->getCity(),
            'organizer' => [
                'id' => $organizer?->getId(),
                'displayName' => $organizer?->getDisplayName() ?? 'Organisateur',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeTicket(Ticket $ticket, ?\DateTimeImmutable $usedAt = null): array
    {
        $order = $ticket->getCustomerOrder();
        $event = $ticket->getTicketType()?->getEvent();
        $location = $event?->getLocation();
        $customer = $order?->getClient();
        $isInvitation = $ticket->getSource() === Ticket::SOURCE_INVITATION;

        return [
            'id' => $ticket->getId(),
            'displayCode' => sprintf('EVF-%06d', (int) ($ticket->getId() ?? 0)),
            'status' => $ticket->getStatus(),
            'issuedAt' => $ticket->getIssuedAt()?->format(DATE_ATOM),
            'usedAt' => $usedAt?->format(DATE_ATOM),
            'ticketType' => [
                'id' => $ticket->getTicketType()?->getId(),
                'name' => $ticket->getTicketType()?->getName(),
            ],
            'event' => [
                'id' => $event?->getId(),
                'title' => $event?->getTitle(),
                'startsAt' => $event?->getStartDatetime()?->format(DATE_ATOM),
                'city' => $location?->getCity(),
                'venue' => $location?->getAddress() ?? $location?->getCity(),
            ],
            'order' => [
                'id' => $order?->getId(),
                'reference' => $order?->getReference(),
                'status' => $order?->getStatus(),
            ],
            'customer' => [
                'id' => $isInvitation ? null : $customer?->getId(),
                'displayName' => $isInvitation
                    ? ($ticket->getRecipientName() ?? 'Invité')
                    : ($customer?->getDisplayName() ?? 'Client'),
                'email' => $isInvitation ? $ticket->getRecipientEmail() : $customer?->getEmail(),
            ],
        ];
    }

    private function createCheckin(
        Event $event,
        User $staffUser,
        string $scannedToken,
        string $result,
        ?Ticket $ticket = null,
        bool $flushTicket = false,
    ): Checkin {
        $checkin = (new Checkin())
            ->setEvent($event)
            ->setStaffUser($staffUser)
            ->setScannedToken($scannedToken)
            ->setScannedAt(new \DateTimeImmutable())
            ->setResult($result)
            ->setTicket($ticket)
        ;

        if ($flushTicket && $ticket instanceof Ticket) {
            $this->entityManager->persist($ticket);
        }

        $this->entityManager->persist($checkin);
        $this->entityManager->flush();

        return $checkin;
    }

    private function isTicketEligibleForEntry(Ticket $ticket): bool
    {
        $order = $ticket->getCustomerOrder();
        $payment = $order?->getPayment();

        if (!$order instanceof Order || $order->getStatus() !== Order::STATUS_PAID) {
            return false;
        }

        if ($ticket->getStatus() === Ticket::STATUS_CANCELLED) {
            return false;
        }

        if ($payment instanceof Payment && $payment->getStatus() !== Payment::STATUS_PAID) {
            return false;
        }

        return true;
    }
}
