<?php

namespace App\Controller;

use App\Entity\AbonnementOrganisateur;
use App\Entity\NewsletterSubscription;
use App\Entity\Order;
use App\Entity\OrganizerApplication;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/users')]
#[IsGranted('ROLE_ADMIN_SUPPORT')]
final class AdminUserController extends AbstractController
{
    #[Route('', name: 'api_admin_user_index', methods: ['GET'])]
    public function index(Request $request, UserRepository $userRepository): JsonResponse
    {
        $role = $this->normalizeRoleFilter($request->query->get('role'));
        $includeAdminAccounts = $this->isGranted(User::ROLE_ADMIN);

        if (false === $role) {
            return $this->json([
                'message' => 'Filtre de rôle invalide.',
            ], 400);
        }

        if (!$includeAdminAccounts && User::isAdminRole($role)) {
            return $this->json([
                'message' => 'Accès réservé au super administrateur.',
            ], 403);
        }

        $users = $userRepository->findForAdminList(
            $this->normalizeNullableString($request->query->get('search')),
            $role,
            $includeAdminAccounts,
        );

        return $this->json(array_map(
            fn (User $user): array => $this->serializeUser($user),
            $users,
        ));
    }

    #[Route('/{id}', name: 'api_admin_user_show', methods: ['GET'])]
    public function show(User $user): JsonResponse
    {
        return $this->json($this->serializeUser($user));
    }

    #[Route('/{id}/role', name: 'api_admin_user_update_role', methods: ['PATCH'])]
    public function updateRole(
        User $user,
        Request $request,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        try {
            $data = $request->toArray();
        } catch (\Throwable) {
            $data = [];
        }

        $role = $this->normalizeAssignableRole($data['role'] ?? null);

        if (null === $role) {
            return $this->json([
                'message' => 'Le rôle demandé est invalide.',
            ], 400);
        }

        if (!$this->isGranted(User::ROLE_ADMIN) && ($user->isAdminAccount() || User::isAdminRole($role))) {
            return $this->json([
                'message' => 'Seul le super administrateur peut modifier un compte admin.',
            ], 403);
        }

        $currentUser = $this->getUser();

        if (
            $currentUser instanceof User &&
            $currentUser->getId() === $user->getId() &&
            $user->isSuperAdminAccount() &&
            User::ROLE_ADMIN !== $role
        ) {
            return $this->json([
                'message' => 'Tu ne peux pas retirer ton propre rôle administrateur.',
            ], 409);
        }

        $previousRole = $user->getBaseRole();
        $user->setRole($role);
        $this->syncOrganizerApplicationAfterRoleChange($user, $previousRole, $role);

        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json([
            'message' => 'Rôle utilisateur mis à jour.',
            'user' => $this->serializeUser($user),
        ]);
    }

    #[Route('/{id}/status', name: 'api_admin_user_update_status', methods: ['PATCH'])]
    public function updateStatus(
        User $user,
        Request $request,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        try {
            $data = $request->toArray();
        } catch (\Throwable) {
            $data = [];
        }

        $accountStatus = $this->normalizeAccountStatus($data['accountStatus'] ?? null);

        if (null === $accountStatus) {
            return $this->json([
                'message' => 'Le statut doit être active, disabled ou blocked.',
            ], 400);
        }

        if (!$this->isGranted(User::ROLE_ADMIN) && $user->isAdminAccount()) {
            return $this->json([
                'message' => 'Seul le super administrateur peut modifier un compte admin.',
            ], 403);
        }

        $currentUser = $this->getUser();

        if (
            $currentUser instanceof User &&
            $currentUser->getId() === $user->getId() &&
            User::ACCOUNT_STATUS_ACTIVE !== $accountStatus &&
            $user->isAdminAccount()
        ) {
            return $this->json([
                'message' => 'Tu ne peux pas désactiver ou bloquer ton propre compte admin.',
            ], 409);
        }

        $user->setAccountStatus($accountStatus);
        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json([
            'message' => 'Statut du compte mis à jour.',
            'user' => $this->serializeUser($user),
        ]);
    }

    /**
     * @return array{
     *   id: int|null,
     *   email: string|null,
     *   firstName: string|null,
     *   lastName: string|null,
     *   fullName: string,
     *   role: string,
     *   accountStatus: string,
     *   effectiveRole: string,
     *   roles: list<string>,
     *   profilePhoto: string|null,
     *   createdAt: string|null,
     *   termsAcceptedAt: string|null,
     *   privacyAcceptedAt: string|null,
     *   newsletterSubscribed: bool,
     *   eventflowSubscriptionsCount: int,
     *   eventflowSubscriptions: list<array{id: int|null, organizerId: int|null, organizerName: string, organizerEmail: string|null, createdAt: string|null}>,
     *   organizedEventsCount: int,
     *   ordersCount: int,
     *   ticketsCount: int,
     *   staffCheckinsCount: int,
     *   managedStaffCount: int,
     *   staffOrganizerCount: int,
     *   organizerApplication: array{id: int|null, status: string|null, organizationName: string|null, city: string|null, submittedAt: string|null, reviewedAt: string|null}|null
     * }
     */
    private function serializeUser(User $user): array
    {
        $eventflowSubscriptions = $this->serializeActiveEventflowSubscriptions($user);

        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'fullName' => $user->getDisplayName(),
            'role' => $user->getBaseRole(),
            'accountStatus' => $user->getAccountStatus(),
            'effectiveRole' => $user->getEffectiveRole(),
            'roles' => array_values(array_filter(
                $user->getRoles(),
                static fn (string $role): bool => 'ROLE_USER' !== $role,
            )),
            'profilePhoto' => $user->getProfilePhoto(),
            'createdAt' => $user->getCreatedAt()?->format(DATE_ATOM),
            'termsAcceptedAt' => $user->getTermsAcceptedAt()?->format(DATE_ATOM),
            'privacyAcceptedAt' => $user->getPrivacyAcceptedAt()?->format(DATE_ATOM),
            'newsletterSubscribed' => $this->hasActiveNewsletterSubscription($user),
            'eventflowSubscriptionsCount' => count($eventflowSubscriptions),
            'eventflowSubscriptions' => $eventflowSubscriptions,
            'organizedEventsCount' => $user->getOrganizedEvents()->count(),
            'ordersCount' => $user->getClientOrders()->count(),
            'ticketsCount' => $this->countUserTickets($user),
            'staffCheckinsCount' => $user->getStaffCheckins()->count(),
            'managedStaffCount' => $user->countActiveManagedStaffMembers(),
            'staffOrganizerCount' => $user->countActiveStaffMemberships(),
            'organizerApplication' => $this->serializeOrganizerApplication($user->getOrganizerApplication()),
        ];
    }

    private function hasActiveNewsletterSubscription(User $user): bool
    {
        foreach ($user->getNewsletterSubscriptions() as $newsletterSubscription) {
            if (
                $newsletterSubscription instanceof NewsletterSubscription &&
                NewsletterSubscription::STATUS_SUBSCRIBED === $newsletterSubscription->getStatus() &&
                null === $newsletterSubscription->getUnsubscribedAt()
            ) {
                return true;
            }
        }

        return false;
    }

    private function countUserTickets(User $user): int
    {
        $count = 0;

        foreach ($user->getClientOrders() as $order) {
            if ($order instanceof Order) {
                $count += $order->getTickets()->count();
            }
        }

        return $count;
    }

    /**
     * @return list<array{id: int|null, organizerId: int|null, organizerName: string, organizerEmail: string|null, createdAt: string|null}>
     */
    private function serializeActiveEventflowSubscriptions(User $user): array
    {
        $subscriptions = [];

        foreach ($user->getClientSubscriptions() as $subscription) {
            if (
                !$subscription instanceof AbonnementOrganisateur ||
                'ACTIVE' !== $subscription->getStatus()
            ) {
                continue;
            }

            $organizer = $subscription->getOrganizer();

            if (!$organizer instanceof User) {
                continue;
            }

            $subscriptions[] = [
                'id' => $subscription->getId(),
                'organizerId' => $organizer->getId(),
                'organizerName' => $organizer->getDisplayName(),
                'organizerEmail' => $organizer->getEmail(),
                'createdAt' => $subscription->getCreatedAt()?->format(DATE_ATOM),
            ];
        }

        return $subscriptions;
    }

    /**
     * @return array{id: int|null, status: string|null, organizationName: string|null, city: string|null, submittedAt: string|null, reviewedAt: string|null}|null
     */
    private function serializeOrganizerApplication(?OrganizerApplication $application): ?array
    {
        if (!$application instanceof OrganizerApplication) {
            return null;
        }

        return [
            'id' => $application->getId(),
            'status' => $application->getStatus(),
            'organizationName' => $application->getOrganizationName(),
            'city' => $application->getCity(),
            'submittedAt' => $application->getSubmittedAt()?->format(DATE_ATOM),
            'reviewedAt' => $application->getReviewedAt()?->format(DATE_ATOM),
        ];
    }

    private function syncOrganizerApplicationAfterRoleChange(
        User $user,
        string $previousRole,
        string $nextRole,
    ): void {
        $application = $user->getOrganizerApplication();

        if (!$application instanceof OrganizerApplication) {
            return;
        }

        $now = new \DateTimeImmutable();

        if (User::ROLE_ORGANIZER === $nextRole) {
            $application
                ->setStatus(OrganizerApplication::STATUS_APPROVED)
                ->setReviewedAt($now)
                ->setReviewNote(
                    $application->getReviewNote()
                        ?: 'Rôle organisateur attribué depuis la gestion utilisateurs.'
                )
            ;

            return;
        }

        if (
            User::ROLE_ORGANIZER === $previousRole &&
            User::ROLE_CLIENT === $nextRole &&
            OrganizerApplication::STATUS_APPROVED === $application->getStatus()
        ) {
            $application
                ->setStatus(OrganizerApplication::STATUS_REJECTED)
                ->setReviewedAt($now)
                ->setReviewNote('Rôle organisateur retiré depuis la gestion utilisateurs.')
            ;
        }
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);

        return '' !== $value ? $value : null;
    }

    private function normalizeRoleFilter(mixed $value): string|false|null
    {
        if (null === $value || '' === trim((string) $value) || 'all' === strtolower(trim((string) $value))) {
            return null;
        }

        $role = $this->normalizeRole((string) $value);

        if (null === $role || User::ROLE_STAFF === $role) {
            return false;
        }

        return $role;
    }

    private function normalizeAssignableRole(mixed $value): ?string
    {
        $role = is_string($value) ? $this->normalizeRole($value) : null;

        if (User::ROLE_STAFF === $role) {
            return null;
        }

        return $role;
    }

    private function normalizeAccountStatus(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $accountStatus = strtolower(trim($value));

        return match ($accountStatus) {
            User::ACCOUNT_STATUS_ACTIVE => User::ACCOUNT_STATUS_ACTIVE,
            User::ACCOUNT_STATUS_DISABLED => User::ACCOUNT_STATUS_DISABLED,
            User::ACCOUNT_STATUS_BLOCKED => User::ACCOUNT_STATUS_BLOCKED,
            default => null,
        };
    }

    private function normalizeRole(string $role): ?string
    {
        $role = strtoupper(trim($role));

        if (!str_starts_with($role, 'ROLE_')) {
            $role = 'ROLE_'.$role;
        }

        return match ($role) {
            'ROLE_USER', 'ROLE_CLIENT' => User::ROLE_CLIENT,
            'ROLE_ORGANIZER', 'ROLE_ORGANISATEUR' => User::ROLE_ORGANIZER,
            'ROLE_ADMIN' => User::ROLE_ADMIN,
            'ROLE_ADMIN_SUPPORT' => User::ROLE_ADMIN_SUPPORT,
            'ROLE_ADMIN_FINANCE' => User::ROLE_ADMIN_FINANCE,
            'ROLE_STAFF' => User::ROLE_STAFF,
            default => null,
        };
    }
}
