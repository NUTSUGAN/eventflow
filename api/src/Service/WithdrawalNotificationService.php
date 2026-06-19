<?php

namespace App\Service;

use App\Entity\WithdrawalRequest;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class WithdrawalNotificationService
{
    public function __construct(
        private readonly MailerInterface $mailer,
        #[Autowire('%env(string:FRONTEND_APP_URL)%')]
        private readonly string $frontendUrl,
        #[Autowire('%env(string:MAILER_FROM_EMAIL)%')]
        private readonly string $fromEmail,
    ) {
    }

    public function notifyTrackingUpdated(WithdrawalRequest $withdrawal): void
    {
        $organizer = $withdrawal->getOrganizer();
        $event = $withdrawal->getEvent();
        $adminNote = $withdrawal->getAdminNote();
        $paymentReference = $withdrawal->getPaymentReference();

        $body = "Bonjour {$organizer?->getFirstName()},\n\n".
            "EventFlow a mis à jour le suivi de ta demande de retrait.\n\n".
            "Événement : {$event?->getTitle()}\n".
            "Statut : {$this->statusLabel($withdrawal->getStatus())}\n".
            "CA brut : {$withdrawal->getGrossAmount()} {$withdrawal->getCurrency()}\n".
            "Frais EventFlow : {$withdrawal->getFeeAmount()} {$withdrawal->getCurrency()} ({$withdrawal->getFeePercent()} %)\n".
            "Montant net : {$withdrawal->getNetAmount()} {$withdrawal->getCurrency()}\n";

        if (null !== $paymentReference) {
            $body .= "Référence de paiement : {$paymentReference}\n";
        }

        if (null !== $withdrawal->getPaidAt()) {
            $body .= "Date de paiement : {$withdrawal->getPaidAt()->format('d/m/Y H:i')}\n";
        }

        if (null !== $adminNote) {
            $body .= "\nMessage EventFlow :\n{$adminNote}\n";
        }

        $body .= "\nConsulter le suivi : {$this->frontendUrl('/organizer/withdrawals/'.(string) $withdrawal->getId())}\n";

        $this->send(
            $organizer?->getEmail(),
            'Suivi de retrait mis à jour',
            $body
        );
    }

    private function send(?string $recipient, string $subject, string $body): void
    {
        if (!is_string($recipient) || '' === trim($recipient)) {
            return;
        }

        try {
            $this->mailer->send(
                (new Email())
                    ->from($this->fromEmail)
                    ->to(trim($recipient))
                    ->subject($subject)
                    ->text($body)
            );
        } catch (\Throwable) {
            // A mail outage must not block the admin withdrawal workflow.
        }
    }

    private function frontendUrl(string $path): string
    {
        return rtrim($this->frontendUrl, '/').'/'.ltrim($path, '/');
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            WithdrawalRequest::STATUS_PENDING => 'En attente',
            WithdrawalRequest::STATUS_APPROVED => 'Approuvé',
            WithdrawalRequest::STATUS_PAID => 'Payé',
            WithdrawalRequest::STATUS_REJECTED => 'Refusé',
            WithdrawalRequest::STATUS_CANCELLED => 'Annulé',
            default => $status,
        };
    }
}
