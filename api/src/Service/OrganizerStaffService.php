<?php

namespace App\Service;

use App\Entity\Event;
use App\Entity\OrganizerStaffMember;
use App\Entity\User;
use App\Repository\OrganizerStaffMemberRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class OrganizerStaffService
{
    public const MAX_STAFF_MEMBERS = 10;

    public function __construct(
        private readonly OrganizerStaffMemberRepository $organizerStaffMemberRepository,
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly MailerInterface $mailer,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * @return list<OrganizerStaffMember>
     */
    public function listMembers(User $organizer): array
    {
        return $this->organizerStaffMemberRepository->findForOrganizer($organizer);
    }

    public function countMembers(User $organizer): int
    {
        return $this->organizerStaffMemberRepository->countActiveForOrganizer($organizer);
    }

    public function addMemberByEmail(User $organizer, string $email): OrganizerStaffMember
    {
        if (!$organizer->canManageStaff()) {
            throw new \DomainException('Seuls les organisateurs peuvent gérer un staff.');
        }

        $normalizedEmail = mb_strtolower(trim($email));

        if ('' === $normalizedEmail) {
            throw new \DomainException('L email du membre staff est obligatoire.');
        }

        $staffUser = $this->userRepository->findOneByEmailInsensitive($normalizedEmail);

        if (!$staffUser instanceof User) {
            throw new \DomainException('Aucun utilisateur EventFlow ne correspond à cet email.');
        }

        if ($staffUser->getId() === $organizer->getId()) {
            throw new \DomainException('Tu ne peux pas t ajouter toi-meme dans ton propre staff.');
        }

        $staffUserBaseRole = $staffUser->getBaseRole();

        if (User::isAdminRole($staffUserBaseRole)) {
            throw new \DomainException('Tu ne peux pas ajouter un administrateur dans ton staff.');
        }

        if ($staffUserBaseRole === User::ROLE_ORGANIZER) {
            throw new \DomainException('Tu ne peux pas ajouter un autre organisateur dans ton staff.');
        }

        $existingMembership = $this->organizerStaffMemberRepository->findOneForOrganizerAndStaffUser(
            $organizer,
            $staffUser,
        );

        if ($existingMembership instanceof OrganizerStaffMember && $existingMembership->isActive()) {
            throw new \DomainException('Cet utilisateur fait déjà partie de ton staff.');
        }

        if ($this->countMembers($organizer) >= self::MAX_STAFF_MEMBERS) {
            throw new \DomainException('Tu as déjà atteint la limite de 10 membres de staff.');
        }

        $now = new \DateTimeImmutable();

        if ($existingMembership instanceof OrganizerStaffMember) {
            $membership = $existingMembership
                ->setStatus(OrganizerStaffMember::STATUS_ACTIVE)
                ->setStatusChangedAt($now)
            ;
        } else {
            $membership = (new OrganizerStaffMember())
                ->setOrganizer($organizer)
                ->setStaffUser($staffUser)
                ->setCreatedAt($now)
                ->setStatus(OrganizerStaffMember::STATUS_ACTIVE)
                ->setStatusChangedAt($now)
            ;

            $organizer->addManagedStaffMember($membership);
            $staffUser->addStaffMembership($membership);
            $this->entityManager->persist($membership);
        }

        $this->entityManager->flush();

        $this->sendMembershipEmails($membership, $existingMembership instanceof OrganizerStaffMember);

        return $membership;
    }

    public function setMemberOutOfService(User $organizer, int $membershipId): OrganizerStaffMember
    {
        if (!$organizer->canManageStaff()) {
            throw new \DomainException('Seuls les organisateurs peuvent gérer un staff.');
        }

        $membership = $this->organizerStaffMemberRepository->findOneForOrganizerById(
            $organizer,
            $membershipId,
        );

        if (!$membership instanceof OrganizerStaffMember) {
            throw new \DomainException('Membre de staff introuvable.');
        }

        if ($membership->isOutOfService()) {
            throw new \DomainException('Ce membre est déjà hors service.');
        }

        $membership
            ->setStatus(OrganizerStaffMember::STATUS_OUT_OF_SERVICE)
            ->setStatusChangedAt(new \DateTimeImmutable())
        ;

        $this->entityManager->flush();

        return $membership;
    }

    /**
     * @return list<int>
     */
    public function getAccessibleOrganizerIds(User $user): array
    {
        if ($user->isAdminAccount()) {
            return [];
        }

        $organizerIds = $this->organizerStaffMemberRepository->findOrganizerIdsForStaffUser($user);

        if ($user->isOrganizerOrAdmin() && null !== $user->getId()) {
            $organizerIds[] = (int) $user->getId();
        }

        $organizerIds = array_values(array_unique(array_filter(
            array_map(static fn (int $organizerId): int => (int) $organizerId, $organizerIds),
            static fn (int $organizerId): bool => $organizerId > 0,
        )));

        return $organizerIds;
    }

    public function canAccessEvent(User $user, Event $event): bool
    {
        if ($user->isAdminAccount()) {
            return true;
        }

        $organizerId = $event->getOrganizer()?->getId();

        if (null === $organizerId) {
            return false;
        }

        return in_array((int) $organizerId, $this->getAccessibleOrganizerIds($user), true);
    }

    /**
     * @return array{
     *   id: int|null,
     *   createdAt: string|null,
     *   status: string|null,
     *   isActive: bool,
     *   statusChangedAt: string|null,
     *   staffUser: array{
     *     id: int|null,
     *     email: string|null,
     *     firstName: string|null,
     *     lastName: string|null,
     *     displayName: string
     *   }
     * }
     */
    public function serializeMembership(OrganizerStaffMember $membership): array
    {
        $staffUser = $membership->getStaffUser();

        return [
            'id' => $membership->getId(),
            'createdAt' => $membership->getCreatedAt()?->format(DATE_ATOM),
            'status' => $membership->getStatus(),
            'isActive' => $membership->isActive(),
            'statusChangedAt' => $membership->getStatusChangedAt()?->format(DATE_ATOM),
            'staffUser' => [
                'id' => $staffUser?->getId(),
                'email' => $staffUser?->getEmail(),
                'firstName' => $staffUser?->getFirstName(),
                'lastName' => $staffUser?->getLastName(),
                'displayName' => $staffUser?->getDisplayName() ?? 'Utilisateur EventFlow',
            ],
        ];
    }

    private function sendMembershipEmails(OrganizerStaffMember $membership, bool $wasReactivated): void
    {
        $organizer = $membership->getOrganizer();
        $staffUser = $membership->getStaffUser();

        if (!$organizer instanceof User || !$staffUser instanceof User) {
            return;
        }

        $frontendAppUrl = $this->readEnv('FRONTEND_APP_URL') ?? 'http://localhost:5173';
        $scanUrl = rtrim($frontendAppUrl, '/').'/staff/scan';
        $staffPageUrl = rtrim($frontendAppUrl, '/').'/organizer/staff';

        $staffEmail = trim((string) $staffUser->getEmail());
        $organizerEmail = trim((string) $organizer->getEmail());
        $organizerName = $organizer->getDisplayName();
        $staffName = $staffUser->getDisplayName();

        if ('' !== $staffEmail) {
            try {
                $this->mailer->send(
                    (new Email())
                        ->from('no-reply@eventflow.local')
                        ->to($staffEmail)
                        ->subject($wasReactivated
                            ? 'Tu es de nouveau actif dans un staff EventFlow'
                            : 'Tu fais maintenant partie d’un staff EventFlow')
                        ->text(
                            sprintf(
                                "Bonjour %s,\n\n".
                                "%s %s.\n\n".
                                "Tu peux des maintenant ouvrir la page de scan ici :\n%s\n\n".
                                "Tu y retrouveras les évènements auxquels tu peux donner accès.\n",
                                $staffName,
                                $organizerName,
                                $wasReactivated
                                    ? 't’a remis en service dans son staff EventFlow'
                                    : 't a ajoute à son staff EventFlow',
                                $scanUrl,
                            )
                        )
                );
            } catch (\Throwable $exception) {
                $this->logger->warning('Unable to send organizer staff email to staff user.', [
                    'organizerId' => $organizer->getId(),
                    'staffUserId' => $staffUser->getId(),
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        if ('' !== $organizerEmail) {
            try {
                $this->mailer->send(
                    (new Email())
                        ->from('no-reply@eventflow.local')
                        ->to($organizerEmail)
                        ->subject($wasReactivated
                            ? 'Membre remis en service dans ton staff EventFlow'
                            : 'Nouveau membre ajouté à ton staff EventFlow')
                        ->text(
                            sprintf(
                                "Bonjour %s,\n\n".
                                "Tu as %s %s (%s) dans ton staff EventFlow.\n\n".
                                "Tu peux suivre ton équipe ici :\n%s\n",
                                $organizerName,
                                $wasReactivated ? 'remis en service' : 'ajoute',
                                $staffName,
                                $staffUser->getEmail() ?? 'email inconnu',
                                $staffPageUrl,
                            )
                        )
                );
            } catch (\Throwable $exception) {
                $this->logger->warning('Unable to send organizer staff confirmation email.', [
                    'organizerId' => $organizer->getId(),
                    'staffUserId' => $staffUser->getId(),
                    'message' => $exception->getMessage(),
                ]);
            }
        }
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
