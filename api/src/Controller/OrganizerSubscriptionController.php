<?php

namespace App\Controller;

use App\Entity\AbonnementOrganisateur;
use App\Entity\NewsletterSubscription;
use App\Entity\User;
use App\Repository\AbonnementOrganisateurRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class OrganizerSubscriptionController extends AbstractController
{
    #[Route('/api/organizers/{id}/follow', name: 'api_organizer_follow', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function follow(
        int $id,
        UserRepository $userRepository,
        AbonnementOrganisateurRepository $subscriptionRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $currentUser = $this->getUser();

        if (!$currentUser instanceof User) {
            return $this->json([
                'message' => 'Authentification requise.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $organizer = $userRepository->find($id);

        if (!$organizer instanceof User) {
            return $this->json([
                'message' => 'Organisateur introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($currentUser->getId() === $organizer->getId()) {
            return $this->json([
                'message' => 'Vous ne pouvez pas vous abonner à votre propre profil.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!$this->isOrganizer($organizer)) {
            return $this->json([
                'message' => 'Cet utilisateur ne peut pas être suivi comme organisateur.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $subscription = $subscriptionRepository->findOneForClientAndOrganizer($currentUser, $organizer);
        $statusCode = Response::HTTP_OK;

        $now = new \DateTimeImmutable();

        if (!$subscription instanceof AbonnementOrganisateur) {
            $subscription = new AbonnementOrganisateur();
            $subscription->setClient($currentUser);
            $subscription->setOrganizer($organizer);
            $subscription->setCreatedAt($now);
            $entityManager->persist($subscription);
            $statusCode = Response::HTTP_CREATED;
        }

        $subscription->setStatus('ACTIVE');
        $this->upsertEventflowSubscription(
            $currentUser,
            $entityManager,
            $now
        );
        $entityManager->flush();

        return $this->json([
            'message' => 'Abonnement Organisateur active.',
            'subscription' => $this->buildSubscriptionPayload($subscription),
            'organizer' => $this->buildOrganizerPayload($organizer),
        ], $statusCode);
    }

    #[Route('/api/organizers/{id}/follow', name: 'api_organizer_unfollow', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function unfollow(
        int $id,
        UserRepository $userRepository,
        AbonnementOrganisateurRepository $subscriptionRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $currentUser = $this->getUser();

        if (!$currentUser instanceof User) {
            return $this->json([
                'message' => 'Authentification requise.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $organizer = $userRepository->find($id);

        if (!$organizer instanceof User) {
            return $this->json([
                'message' => 'Organisateur introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        $subscription = $subscriptionRepository->findOneForClientAndOrganizer($currentUser, $organizer);

        if (!$subscription instanceof AbonnementOrganisateur) {
            return $this->json([
                'message' => 'Aucun abonnement actif pour cet organisateur.',
                'subscription' => [
                    'canFollow' => true,
                    'isFollowing' => false,
                    'status' => null,
                    'requiresAuth' => false,
                    'isOwnOrganizer' => false,
                ],
                'organizer' => $this->buildOrganizerPayload($organizer),
            ], Response::HTTP_OK);
        }

        $subscription->setStatus('CANCELLED');
        $entityManager->flush();

        return $this->json([
            'message' => 'Abonnement Organisateur désactivé.',
            'subscription' => $this->buildSubscriptionPayload($subscription),
            'organizer' => $this->buildOrganizerPayload($organizer),
        ]);
    }

    private function buildSubscriptionPayload(AbonnementOrganisateur $subscription): array
    {
        $status = $subscription->getStatus();

        return [
            'canFollow' => true,
            'isFollowing' => 'ACTIVE' === $status,
            'status' => $status,
            'requiresAuth' => false,
            'isOwnOrganizer' => false,
        ];
    }

    private function buildOrganizerPayload(User $organizer): array
    {
        return [
            'id' => $organizer->getId(),
            'firstName' => $organizer->getFirstName(),
            'lastName' => $organizer->getLastName(),
            'fullName' => trim(sprintf('%s %s', $organizer->getFirstName(), $organizer->getLastName())),
            'role' => $this->resolvePrimaryRole($organizer),
            'profilePhoto' => $organizer->getProfilePhoto(),
        ];
    }

    private function upsertEventflowSubscription(
        User $user,
        EntityManagerInterface $entityManager,
        \DateTimeImmutable $now
    ): void {
        $email = $user->getEmail() ?? '';

        if ('' === $email) {
            return;
        }

        $newsletterSubscription = $entityManager
            ->getRepository(NewsletterSubscription::class)
            ->findOneBy(['email' => $email])
        ;

        if (!$newsletterSubscription instanceof NewsletterSubscription) {
            $newsletterSubscription = (new NewsletterSubscription())
                ->setEmail($email)
                ->setCreatedAt($now)
            ;
        }

        $newsletterSubscription
            ->setUser($user)
            ->setStatus(NewsletterSubscription::STATUS_SUBSCRIBED)
            ->setSource(NewsletterSubscription::SOURCE_ORGANIZER_FOLLOW)
            ->setConsentedAt($now)
            ->setUnsubscribedAt(null)
            ->setUpdatedAt($now)
        ;

        $user->addNewsletterSubscription($newsletterSubscription);
        $entityManager->persist($newsletterSubscription);
    }

    private function isOrganizer(User $user): bool
    {
        return in_array(
            $this->resolvePrimaryRole($user),
            [User::ROLE_ORGANIZER, User::ROLE_ADMIN],
            true
        );
    }

    private function resolvePrimaryRole(User $user): string
    {
        $storedRole = strtoupper((string) $user->getRole());

        return match ($storedRole) {
            'CLIENT', 'ROLE_CLIENT' => User::ROLE_CLIENT,
            'ORGANIZER', 'ORGANISATEUR', 'ROLE_ORGANIZER', 'ROLE_ORGANISATEUR' => User::ROLE_ORGANIZER,
            'STAFF', 'ROLE_STAFF' => User::ROLE_STAFF,
            'ADMIN', 'ROLE_ADMIN' => User::ROLE_ADMIN,
            default => $this->resolveRoleFromSecurity($user),
        };
    }

    private function resolveRoleFromSecurity(User $user): string
    {
        $roles = array_values(array_filter(
            $user->getRoles(),
            static fn (string $role): bool => 'ROLE_USER' !== $role
        ));

        return $roles[0] ?? User::ROLE_CLIENT;
    }
}
