<?php

namespace App\Service;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Ticket;
use App\Entity\User;
use App\Repository\OrderRepository;
use App\Repository\TicketRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class TicketFulfillmentService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly OrderRepository $orderRepository,
        private readonly TicketRepository $ticketRepository,
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function fulfillPaidOrder(Order $order): void
    {
        if (Order::STATUS_PAID !== $order->getStatus()) {
            return;
        }

        $createdTickets = [];
        $existingTicketsByTicketType = [];

        foreach ($order->getTickets() as $existingTicket) {
            $ticketTypeId = $existingTicket->getTicketType()?->getId();

            if (null === $ticketTypeId) {
                continue;
            }

            $existingTicketsByTicketType[$ticketTypeId] = ($existingTicketsByTicketType[$ticketTypeId] ?? 0) + 1;
        }

        $issuedAt = new \DateTimeImmutable();

        foreach ($order->getOrderItems() as $orderItem) {
            if (!$orderItem instanceof OrderItem) {
                continue;
            }

            $ticketType = $orderItem->getTicketType();
            $ticketTypeId = $ticketType?->getId();

            if (null === $ticketType || null === $ticketTypeId) {
                continue;
            }

            $expectedQuantity = max(0, (int) ($orderItem->getQuantity() ?? 0));
            $existingQuantity = $existingTicketsByTicketType[$ticketTypeId] ?? 0;
            $missingQuantity = max(0, $expectedQuantity - $existingQuantity);

            for ($index = 0; $index < $missingQuantity; ++$index) {
                $ticket = (new Ticket())
                    ->setCustomerOrder($order)
                    ->setTicketType($ticketType)
                    ->setQrToken($this->generateUniqueQrToken())
                    ->setStatus(Ticket::STATUS_ISSUED)
                    ->setIssuedAt($issuedAt)
                ;

                $order->addTicket($ticket);
                $this->entityManager->persist($ticket);
                $createdTickets[] = $ticket;
            }
        }

        if ([] === $createdTickets) {
            return;
        }

        $this->entityManager->flush();
        $this->sendTicketConfirmationEmail($order);
    }

    public function fulfillPaidOrdersForUser(User $user): void
    {
        foreach ($this->orderRepository->findPaidOrdersForUser($user) as $order) {
            if (!$order instanceof Order) {
                continue;
            }

            if (Order::STATUS_PAID !== $order->getStatus()) {
                continue;
            }

            $this->fulfillPaidOrder($order);
        }
    }

    private function sendTicketConfirmationEmail(Order $order): void
    {
        $customerEmail = trim((string) $order->getClient()?->getEmail());

        $customerName = trim(sprintf(
            '%s %s',
            (string) ($order->getClient()?->getFirstName() ?? ''),
            (string) ($order->getClient()?->getLastName() ?? ''),
        ));

        $orderSummary = $this->buildOrderSummary($order);

        if ('' !== $customerEmail) {
            $frontendAppUrl = $this->readEnv('FRONTEND_APP_URL') ?? 'http://localhost:5173';
            $ticketListUrl = rtrim($frontendAppUrl, '/').'/mes-billets';

            $eventLine = is_string($orderSummary['eventTitle']) && '' !== trim($orderSummary['eventTitle'])
                ? sprintf("Evenement : %s\n", trim((string) $orderSummary['eventTitle']))
                : '';

            if ($orderSummary['eventStartsAt'] instanceof \DateTimeImmutable) {
                $eventLine .= sprintf(
                    "Date : %s\n",
                    $orderSummary['eventStartsAt']
                        ->setTimezone(new \DateTimeZone('Europe/Paris'))
                        ->format('d/m/Y a H:i')
                );
            }

            $linesBlock = [] !== $orderSummary['lineSummaries']
                ? implode("\n", $orderSummary['lineSummaries'])
                : '- Billets confirmes';

            try {
                $this->mailer->send(
                    (new Email())
                        ->from('no-reply@eventflow.local')
                        ->to($customerEmail)
                        ->subject('Tes billets EventFlow sont prets')
                        ->text(
                            sprintf(
                                "Bonjour %s,\n\n".
                                "Le paiement de ta commande %s a bien ete confirme.\n\n".
                                "%s".
                                "Billets generes :\n%s\n\n".
                                "Retrouve tes billets et leurs QR codes ici :\n%s\n\n".
                                "A tres vite sur EventFlow.\n",
                                '' !== $customerName ? $customerName : 'EventFlow',
                                (string) $order->getReference(),
                                $eventLine,
                                $linesBlock,
                                $ticketListUrl,
                            )
                        )
                );
            } catch (\Throwable $exception) {
                $this->logger->warning('Unable to send ticket confirmation email to customer.', [
                    'orderId' => $order->getId(),
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        $organizerEmail = trim((string) ($orderSummary['organizerEmail'] ?? ''));

        if ('' === $organizerEmail) {
            return;
        }

        $organizerName = trim((string) ($orderSummary['organizerName'] ?? ''));
        $eventLine = is_string($orderSummary['eventTitle']) && '' !== trim($orderSummary['eventTitle'])
            ? sprintf("Evenement : %s\n", trim((string) $orderSummary['eventTitle']))
            : '';

        if ($orderSummary['eventStartsAt'] instanceof \DateTimeImmutable) {
            $eventLine .= sprintf(
                "Date : %s\n",
                $orderSummary['eventStartsAt']
                    ->setTimezone(new \DateTimeZone('Europe/Paris'))
                    ->format('d/m/Y a H:i')
            );
        }

        $linesBlock = [] !== $orderSummary['lineSummaries']
            ? implode("\n", $orderSummary['lineSummaries'])
            : '- Billets confirmes';

        try {
            $this->mailer->send(
                (new Email())
                    ->from('no-reply@eventflow.local')
                    ->to($organizerEmail)
                    ->subject('Nouvelle commande payee sur ton evenement EventFlow')
                    ->text(
                        sprintf(
                            "Bonjour %s,\n\n".
                            "Une commande vient d etre payee sur ton evenement.\n\n".
                            "Commande : %s\n".
                            "Client : %s\n".
                            "Email client : %s\n".
                            "%s".
                            "Billets vendus :\n%s\n\n".
                            "Paiement confirme sur EventFlow.\n",
                            '' !== $organizerName ? $organizerName : 'Organisateur',
                            (string) $order->getReference(),
                            '' !== $customerName ? $customerName : 'Client EventFlow',
                            trim((string) $order->getClient()?->getEmail()),
                            $eventLine,
                            $linesBlock,
                        )
                    )
            );
        } catch (\Throwable $exception) {
            $this->logger->warning('Unable to send ticket confirmation email to organizer.', [
                'orderId' => $order->getId(),
                'message' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * @return array{
     *   eventTitle: string|null,
     *   eventStartsAt: \DateTimeImmutable|null,
     *   lineSummaries: list<string>,
     *   organizerEmail: string|null,
     *   organizerName: string|null
     * }
     */
    private function buildOrderSummary(Order $order): array
    {
        $eventTitle = null;
        $eventStartsAt = null;
        $lineSummaries = [];
        $organizerEmail = null;
        $organizerName = null;

        foreach ($order->getOrderItems() as $orderItem) {
            if (!$orderItem instanceof OrderItem) {
                continue;
            }

            $ticketType = $orderItem->getTicketType();
            $event = $ticketType?->getEvent();
            $organizer = $event?->getOrganizer();

            if (null === $eventTitle) {
                $eventTitle = $event?->getTitle();
                $eventStartsAt = $event?->getStartDatetime();
                $organizerEmail = $organizer?->getEmail();
                $organizerName = trim(sprintf(
                    '%s %s',
                    (string) ($organizer?->getFirstName() ?? ''),
                    (string) ($organizer?->getLastName() ?? ''),
                ));
            }

            $lineSummaries[] = sprintf(
                '- %s x%d',
                (string) ($ticketType?->getName() ?? 'Billet EventFlow'),
                (int) ($orderItem->getQuantity() ?? 0),
            );
        }

        return [
            'eventTitle' => $eventTitle,
            'eventStartsAt' => $eventStartsAt,
            'lineSummaries' => $lineSummaries,
            'organizerEmail' => $organizerEmail,
            'organizerName' => $organizerName,
        ];
    }

    private function generateUniqueQrToken(): string
    {
        do {
            $token = bin2hex(random_bytes(24));
        } while (null !== $this->ticketRepository->findOneBy(['qrToken' => $token]));

        return $token;
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
