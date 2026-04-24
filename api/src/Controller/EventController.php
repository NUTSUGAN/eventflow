<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\TicketType;
use App\Entity\User;
use App\Repository\AbonnementOrganisateurRepository;
use App\Repository\EventRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class EventController extends AbstractController
{
    #[Route('/api/events/{id}', name: 'api_event_detail', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(
        int $id,
        EventRepository $eventRepository,
        AbonnementOrganisateurRepository $subscriptionRepository
    ): JsonResponse {
        $event = $eventRepository->findOneForPublicDetail($id);

        if (!$event instanceof Event) {
            return $this->json([
                'message' => 'Evenement introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        $organizer = $event->getOrganizer();
        $currentUser = $this->getUser();

        $subscription = [
            'canFollow' => false,
            'isFollowing' => false,
            'status' => null,
        ];

        if ($currentUser instanceof User && $organizer instanceof User && $currentUser->getId() !== $organizer->getId()) {
            $existingSubscription = $subscriptionRepository->findOneForClientAndOrganizer($currentUser, $organizer);
            $subscriptionStatus = $existingSubscription?->getStatus();

            $subscription = [
                'canFollow' => true,
                'isFollowing' => 'ACTIVE' === $subscriptionStatus,
                'status' => $subscriptionStatus,
            ];
        }

        return $this->json([
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'description' => $event->getDescription(),
            'status' => $event->getStatus(),
            'startsAt' => $event->getStartDatetime()?->format(DATE_ATOM),
            'endsAt' => $event->getEndDatetime()?->format(DATE_ATOM),
            'capacity' => $event->getCapacity(),
            'createdAt' => $event->getCreatedAt()?->format(DATE_ATOM),
            'category' => [
                'id' => $event->getCategory()?->getId(),
                'name' => $event->getCategory()?->getName(),
                'description' => $event->getCategory()?->getDescription(),
            ],
            'media' => [
                'thumbnailUrl' => $event->getThumbnailPhoto(),
                'coverUrl' => $event->getCoverPhoto(),
            ],
            'location' => [
                'address' => $event->getLocation()?->getAddress(),
                'city' => $event->getLocation()?->getCity(),
                'postalCode' => $event->getLocation()?->getPostalCode(),
                'country' => $event->getLocation()?->getCountry(),
                'latitude' => null !== $event->getLocation()?->getLatitude() ? (float) $event->getLocation()->getLatitude() : null,
                'longitude' => null !== $event->getLocation()?->getLongitude() ? (float) $event->getLocation()->getLongitude() : null,
            ],
            'organizer' => $organizer instanceof User ? [
                'id' => $organizer->getId(),
                'firstName' => $organizer->getFirstName(),
                'lastName' => $organizer->getLastName(),
                'fullName' => trim(sprintf('%s %s', $organizer->getFirstName(), $organizer->getLastName())),
                'role' => $this->resolvePrimaryRole($organizer),
                'profilePhoto' => $organizer->getProfilePhoto(),
            ] : null,
            'subscription' => $subscription,
            'ticketTypes' => array_map(
                fn (TicketType $ticketType): array => [
                    'id' => $ticketType->getId(),
                    'name' => $ticketType->getName(),
                    'type' => $ticketType->getType(),
                    'basePrice' => null !== $ticketType->getPrice() ? (float) $ticketType->getPrice() : null,
                    'stock' => $ticketType->getStock(),
                    'saleStartAt' => $ticketType->getSalesStartAt()?->format(DATE_ATOM),
                    'saleEndAt' => $ticketType->getSalesEndAt()?->format(DATE_ATOM),
                    'maxPerOrder' => $ticketType->getMaxPerOrder(),
                    'isActive' => $ticketType->isActive(),
                ],
                $event->getTicketTypes()->toArray()
            ),
        ]);
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
