<?php

namespace App\Service;

use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\Payment;
use App\Entity\Ticket;
use App\Entity\User;
use App\Repository\OrderRepository;
use App\Repository\TicketRepository;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;

final class TicketFulfillmentService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly OrderRepository $orderRepository,
        private readonly TicketRepository $ticketRepository,
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
        #[Autowire('%env(string:MAILER_FROM_EMAIL)%')]
        private readonly string $mailerFromEmail,
        #[Autowire('%env(string:ORGANIZER_REVIEW_EMAIL)%')]
        private readonly string $reviewEmail,
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
        $isFreeOrder = Payment::PROVIDER_FREE === $order->getPayment()?->getProvider()
            || (float) ($order->getTotalAmount() ?? '0.00') <= 0.0;
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
                ? sprintf("l’évènement : %s\n", trim((string) $orderSummary['eventTitle']))
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
                : '- Billets confirmés';

            try {
                $this->mailer->send(
                    (new TemplatedEmail())
                        ->from($this->mailerFromEmail)
                        ->to($customerEmail)
                        ->subject('Tes billets EventFlow sont prêts')
                        ->htmlTemplate('emails/notification.html.twig')
                        ->context([
                            'emailTitle' => 'Tes billets sont prêts',
                            'preheader' => 'Retrouve tes billets et leurs QR codes EventFlow.',
                            'appUrl' => rtrim($frontendAppUrl, '/'),
                            'logoUrl' => rtrim($frontendAppUrl, '/').'/eventflow-logo.png',
                            'heroImage' => $this->absoluteImageUrl($orderSummary['eventImage'] ?? null, $frontendAppUrl),
                            'heroAlt' => (string) ($orderSummary['eventTitle'] ?? 'Événement EventFlow'),
                            'eyebrow' => $isFreeOrder ? 'Réservation confirmée' : 'Paiement confirmé',
                            'heading' => 'Tes billets sont prêts',
                            'greeting' => 'Bonjour '.('' !== $customerName ? $customerName : 'EventFlow').',',
                            'paragraphs' => [
                                $isFreeOrder
                                    ? 'Ta réservation gratuite est confirmée.'
                                    : 'Ton paiement a bien été confirmé.',
                                'Tes billets et leurs QR codes sont maintenant disponibles dans ton espace.',
                            ],
                            'details' => array_filter([
                                'Événement' => $orderSummary['eventTitle'] ?? null,
                                'Date' => $orderSummary['eventStartsAt'] instanceof \DateTimeImmutable
                                    ? $orderSummary['eventStartsAt']->setTimezone(new \DateTimeZone('Europe/Paris'))->format('d/m/Y à H:i')
                                    : null,
                                'Commande' => (string) $order->getReference(),
                            ]),
                            'actionUrl' => $ticketListUrl,
                            'actionLabel' => 'Voir mes billets',
                            'note' => 'Présente le QR code du billet à l’entrée de l’événement.',
                        ])
                        ->text(
                            sprintf(
                                "Bonjour %s,\n\n".
                                "%s\n\n".
                                "%s".
                                "Billets generes :\n%s\n\n".
                                "Retrouve tes billets et leurs QR codes ici :\n%s\n\n".
                                "A tres vite sur EventFlow.\n",
                                '' !== $customerName ? $customerName : 'EventFlow',
                                $isFreeOrder
                                    ? sprintf('Ta commande gratuite %s est confirmée.', (string) $order->getReference())
                                    : sprintf('Le paiement de ta commande %s a bien été confirmé.', (string) $order->getReference()),
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

        if (!$isFreeOrder && '' !== trim($this->reviewEmail)) {
            $frontendAppUrl = $this->readEnv('FRONTEND_APP_URL') ?? 'http://localhost:5173';
            try {
                $this->mailer->send(
                    (new TemplatedEmail())
                        ->from($this->mailerFromEmail)
                        ->to(trim($this->reviewEmail))
                        ->subject('Nouveau paiement de billet EventFlow')
                        ->htmlTemplate('emails/notification.html.twig')
                        ->context([
                            'emailTitle' => 'Nouveau paiement de billet',
                            'preheader' => 'Une commande de billets a été payée.',
                            'appUrl' => rtrim($frontendAppUrl, '/'),
                            'eyebrow' => 'Paiement EventFlow',
                            'heading' => 'Nouveau paiement confirmé',
                            'paragraphs' => ['Une commande de billets vient d’être payée et les billets ont été émis.'],
                            'details' => array_filter([
                                'Événement' => $orderSummary['eventTitle'] ?? null,
                                'Commande' => (string) $order->getReference(),
                                'Montant' => number_format((float) $order->getTotalAmount(), 0, ',', ' ').' '.($order->getCurrency() ?? 'XOF'),
                                'Client' => $customerEmail,
                                'Organisateur' => $orderSummary['organizerEmail'] ?? null,
                            ]),
                        ])
                        ->text(sprintf(
                            "Nouveau paiement EventFlow\nÉvénement : %s\nCommande : %s\nMontant : %s %s\nClient : %s\nOrganisateur : %s\n",
                            $orderSummary['eventTitle'] ?? 'Événement EventFlow',
                            $order->getReference(),
                            $order->getTotalAmount(),
                            $order->getCurrency() ?? 'XOF',
                            $customerEmail,
                            $orderSummary['organizerEmail'] ?? '-',
                        ))
                );
            } catch (\Throwable $exception) {
                $this->logger->warning('Unable to send payment notification to EventFlow admin.', [
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
            ? sprintf("l’évènement : %s\n", trim((string) $orderSummary['eventTitle']))
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
            : '- Billets confirmés';

        try {
            $this->mailer->send(
                (new TemplatedEmail())
                    ->from($this->mailerFromEmail)
                    ->to($organizerEmail)
                    ->subject(
                        $isFreeOrder
                            ? 'Nouvelle commande gratuite sur ton évènement EventFlow'
                            : 'Nouvelle commande payée sur ton évènement EventFlow'
                    )
                    ->htmlTemplate('emails/notification.html.twig')
                    ->context([
                        'emailTitle' => 'Nouvelle commande EventFlow',
                        'preheader' => 'Une nouvelle commande vient d’être confirmée.',
                        'appUrl' => rtrim(($this->readEnv('FRONTEND_APP_URL') ?? 'http://localhost:5173'), '/'),
                        'logoUrl' => rtrim(($this->readEnv('FRONTEND_APP_URL') ?? 'http://localhost:5173'), '/').'/eventflow-logo.png',
                        'heroImage' => $this->absoluteImageUrl($orderSummary['eventImage'] ?? null, $this->readEnv('FRONTEND_APP_URL') ?? 'http://localhost:5173'),
                        'heroAlt' => (string) ($orderSummary['eventTitle'] ?? 'Événement EventFlow'),
                        'eyebrow' => 'Vente EventFlow',
                        'heading' => $isFreeOrder ? 'Nouvelle réservation confirmée' : 'Nouveau paiement confirmé',
                        'greeting' => 'Bonjour '.('' !== $organizerName ? $organizerName : 'Organisateur').',',
                        'paragraphs' => [
                            $isFreeOrder
                                ? 'Une commande gratuite vient d’être confirmée sur ton événement.'
                                : 'Une commande vient d’être payée sur ton événement.',
                        ],
                        'details' => array_filter([
                            'Événement' => $orderSummary['eventTitle'] ?? null,
                            'Commande' => (string) $order->getReference(),
                            'Client' => '' !== $customerName ? $customerName : 'Client EventFlow',
                            'E-mail' => trim((string) $order->getClient()?->getEmail()),
                        ]),
                    ])
                    ->text(
                        sprintf(
                            "Bonjour %s,\n\n".
                            "%s\n\n".
                            "%s\n".
                            "Commande : %s\n".
                            "Client : %s\n".
                            "Email client : %s\n".
                            "%s".
                            "Billets vendus :\n%s\n\n".
                            "%s\n",
                            '' !== $organizerName ? $organizerName : 'Organisateur',
                            $isFreeOrder
                                ? 'Une commande gratuite vient d’être confirmée sur ton évènement.'
                                : 'Une commande vient d’être payée sur ton évènement.',
                            $isFreeOrder
                                ? 'Commande gratuite confirmée.'
                                : 'Paiement confirmé.',
                            (string) $order->getReference(),
                            '' !== $customerName ? $customerName : 'Client EventFlow',
                            trim((string) $order->getClient()?->getEmail()),
                            $eventLine,
                            $linesBlock,
                            $isFreeOrder
                                ? 'Billets gratuits confirmés sur EventFlow.'
                                : 'Paiement confirmé sur EventFlow.',
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
     *   eventImage: string|null,
     *   organizerEmail: string|null,
     *   organizerName: string|null
     * }
     */
    private function buildOrderSummary(Order $order): array
    {
        $eventTitle = null;
        $eventStartsAt = null;
        $eventImage = null;
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
                $eventImage = $event?->getCoverPhoto() ?? $event?->getThumbnailPhoto();
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
            'eventImage' => $eventImage,
            'organizerEmail' => $organizerEmail,
            'organizerName' => $organizerName,
        ];
    }

    private function absoluteImageUrl(?string $image, string $frontendAppUrl): ?string
    {
        $image = trim((string) $image);
        if ('' === $image) {
            return null;
        }
        if (filter_var($image, FILTER_VALIDATE_URL)) {
            return $image;
        }

        return rtrim($frontendAppUrl, '/').'/'.ltrim($image, '/');
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
