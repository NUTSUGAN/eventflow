<?php

namespace App\Service;

use App\Entity\NewsletterSubscription;
use App\Entity\OrganizerStaffMember;
use App\Entity\Ticket;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final readonly class AccountErasureService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UploadedImageStorage $imageStorage,
        private UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    /**
     * Anonymise le compte tout en conservant les objets métiers nécessaires
     * aux justificatifs de paiement, aux billets et à l'audit.
     *
     * @return array{mode: string, anonymizedEmail: string}
     */
    public function anonymize(User $user): array
    {
        $now = new \DateTimeImmutable();
        $userId = (int) $user->getId();
        $anonymizedEmail = sprintf('deleted-user-%d-%s@anonymous.eventflow.local', $userId, $now->format('YmdHis'));

        $this->imageStorage->remove($user->getProfilePhoto());

        foreach ($user->getOauthAccounts()->toArray() as $oauthAccount) {
            $this->entityManager->remove($oauthAccount);
        }

        foreach ($user->getNewsletterSubscriptions() as $newsletterSubscription) {
            $newsletterSubscription
                ->setStatus(NewsletterSubscription::STATUS_UNSUBSCRIBED)
                ->setUnsubscribedAt($now)
                ->setUpdatedAt($now)
                ->setEmail($anonymizedEmail)
            ;
        }

        foreach ($user->getClientSubscriptions()->toArray() as $subscription) {
            $this->entityManager->remove($subscription);
        }

        foreach ($user->getOrganizerSubscriptions()->toArray() as $subscription) {
            $this->entityManager->remove($subscription);
        }

        foreach ($user->getStaffMemberships() as $staffMembership) {
            $staffMembership
                ->setStatus(OrganizerStaffMember::STATUS_OUT_OF_SERVICE)
                ->setStatusChangedAt($now)
            ;
        }

        foreach ($user->getManagedStaffMembers() as $managedStaffMember) {
            $managedStaffMember
                ->setStatus(OrganizerStaffMember::STATUS_OUT_OF_SERVICE)
                ->setStatusChangedAt($now)
            ;
        }

        foreach ($user->getClientOrders() as $order) {
            foreach ($order->getTickets() as $ticket) {
                $ticket
                    ->setRecipientName(null)
                    ->setRecipientEmail($this->resolveAnonymizedTicketEmail($ticket, $anonymizedEmail))
                ;
            }
        }

        $user
            ->setFirstName('Compte')
            ->setLastName('supprimé')
            ->setEmail($anonymizedEmail)
            ->setPasswordHash($this->passwordHasher->hashPassword($user, bin2hex(random_bytes(32))))
            ->setRole(User::ROLE_CLIENT)
            ->setAccountStatus(User::ACCOUNT_STATUS_DISABLED)
            ->setFailedLoginAttempts(0)
            ->setProfilePhoto(null)
            ->setTermsAcceptedAt(null)
            ->setPrivacyAcceptedAt(null)
        ;

        $this->entityManager->flush();

        return [
            'mode' => 'anonymized',
            'anonymizedEmail' => $anonymizedEmail,
        ];
    }

    private function resolveAnonymizedTicketEmail(Ticket $ticket, string $fallbackEmail): string
    {
        if (Ticket::SOURCE_INVITATION === $ticket->getSource()) {
            return sprintf('deleted-guest-ticket-%d@anonymous.eventflow.local', (int) $ticket->getId());
        }

        return $fallbackEmail;
    }
}
