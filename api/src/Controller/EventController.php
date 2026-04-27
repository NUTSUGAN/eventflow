<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\TicketType;
use App\Entity\User;
use App\Repository\AbonnementOrganisateurRepository;
use App\Repository\EventRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class EventController extends AbstractController
{
    #[Route('/api/events', name: 'api_event_list', methods: ['GET'])]
    public function index(Request $request, EventRepository $eventRepository): JsonResponse
    {
        $dateFilter = null;
        $dateValue = trim((string) $request->query->get('date', ''));

        if ('' !== $dateValue) {
            $dateFilter = \DateTimeImmutable::createFromFormat('!Y-m-d', $dateValue);

            if (!$dateFilter instanceof \DateTimeImmutable) {
                return $this->json([
                    'message' => 'Le filtre date doit etre au format YYYY-MM-DD.',
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        $typeFilter = trim((string) $request->query->get('type', $request->query->get('category', '')));
        $cityFilter = trim((string) $request->query->get('city', ''));
        $searchFilter = trim((string) $request->query->get('search', ''));
        $limit = max(1, min(24, $request->query->getInt('limit', 18)));

        $events = $eventRepository->findPublicList(
            '' !== $searchFilter ? $searchFilter : null,
            '' !== $typeFilter ? $typeFilter : null,
            '' !== $cityFilter ? $cityFilter : null,
            $dateFilter,
            $limit
        );

        return $this->json(array_map(
            fn (Event $event): array => $this->serializeEventSummary($event),
            $events
        ));
    }

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
                'thumbnailUrl' => $this->normalizeMediaPath($event->getThumbnailPhoto()),
                'coverUrl' => $this->normalizeMediaPath($event->getCoverPhoto()),
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
                'profilePhoto' => $this->normalizeMediaPath($organizer->getProfilePhoto()),
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

    private function serializeEventSummary(Event $event): array
    {
        $minPrice = null;

        foreach ($event->getTicketTypes() as $ticketType) {
            if (!$ticketType->isActive()) {
                continue;
            }

            $price = $ticketType->getPrice();

            if (null === $price) {
                continue;
            }

            $floatPrice = (float) $price;
            $minPrice = null === $minPrice ? $floatPrice : min($minPrice, $floatPrice);
        }

        $venue = $event->getLocation()?->getAddress() ?? $event->getLocation()?->getCity() ?? 'Lieu a confirmer';

        return [
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'shortDescription' => $this->createExcerpt($event->getDescription()),
            'city' => $event->getLocation()?->getCity() ?? 'Ville a confirmer',
            'venue' => $venue,
            'startsAt' => $event->getStartDatetime()?->format(DATE_ATOM),
            'category' => $event->getCategory()?->getName() ?? 'Evenement',
            'coverImageUrl' => $this->normalizeMediaPath($event->getThumbnailPhoto() ?? $event->getCoverPhoto()),
            'minPrice' => $minPrice,
            'currency' => 'EUR',
        ];
    }

    private function createExcerpt(?string $text, int $maxLength = 140): string
    {
        $text = trim(preg_replace('/\s+/', ' ', (string) $text) ?? '');

        if ('' === $text) {
            return 'Informations a venir pour cet evenement.';
        }

        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }

        return rtrim(mb_substr($text, 0, $maxLength - 1)).'...';
    }

    private function normalizeMediaPath(?string $path): ?string
    {
        $path = trim((string) $path);

        if ('' === $path) {
            return null;
        }

        if (
            str_starts_with($path, 'http://')
            || str_starts_with($path, 'https://')
            || str_starts_with($path, '/')
        ) {
            return $this->publicFileExists($path) ? $path : null;
        }

        $normalizedPath = str_replace('\\', '/', $path);

        if (!str_contains($normalizedPath, '/')) {
            $normalizedPath = '/uploads/events/'.$normalizedPath;
        } elseif (!str_starts_with($normalizedPath, '/')) {
            $normalizedPath = '/'.$normalizedPath;
        }

        return $this->publicFileExists($normalizedPath) ? $normalizedPath : null;
    }

    private function publicFileExists(string $publicPath): bool
    {
        if (
            str_starts_with($publicPath, 'http://')
            || str_starts_with($publicPath, 'https://')
        ) {
            return true;
        }

        $filesystemPath = dirname(__DIR__, 2).'/public'.str_replace('/', DIRECTORY_SEPARATOR, $publicPath);

        return is_file($filesystemPath);
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
