<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\PromotionCampaign;
use App\Entity\OrderItem;
use App\Entity\TicketType;
use App\Entity\User;
use App\Repository\AbonnementOrganisateurRepository;
use App\Repository\EventRepository;
use App\Repository\OrderItemRepository;
use App\Repository\TicketTypeRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class EventController extends AbstractController
{
    private const PUBLIC_TIMEZONE = 'Europe/Paris';

    #[Route('/api/events/filters', name: 'api_event_filters', methods: ['GET'])]
    public function filters(EventRepository $eventRepository): JsonResponse
    {
        return $this->json([
            'categories' => $eventRepository->findPublicCategoryFilters(),
            'cities' => $eventRepository->findPublicCityFilters(),
        ]);
    }

    #[Route('/api/events', name: 'api_event_list', methods: ['GET'])]
    public function index(
        Request $request,
        EventRepository $eventRepository,
        AbonnementOrganisateurRepository $subscriptionRepository
    ): JsonResponse
    {
        $dateFilter = null;
        $dateValue = trim((string) $request->query->get('date', ''));

        if ('' !== $dateValue) {
            $dateFilter = \DateTimeImmutable::createFromFormat('!Y-m-d', $dateValue);

            if (!$dateFilter instanceof \DateTimeImmutable) {
                return $this->json([
                    'message' => 'Le filtre date doit être au format YYYY-MM-DD.',
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        $typeFilter = trim((string) $request->query->get('type', $request->query->get('category', '')));
        $cityFilter = trim((string) $request->query->get('city', ''));
        $searchFilter = trim((string) $request->query->get('search', ''));
        $scopeFilter = trim((string) $request->query->get('scope', 'upcoming'));
        $followingFilter = mb_strtolower(trim((string) $request->query->get('following', '')));
        $limit = max(1, min(24, $request->query->getInt('limit', 18)));
        $requestedPage = max(1, min(500, $request->query->getInt('page', 1)));
        $normalizedSearchFilter = '' !== $searchFilter ? $searchFilter : null;
        $normalizedTypeFilter = '' !== $typeFilter ? $typeFilter : null;
        $normalizedCityFilter = '' !== $cityFilter ? $cityFilter : null;
        $normalizedScopeFilter = 'archive' === mb_strtolower($scopeFilter) ? 'archive' : 'upcoming';
        $isFollowingOnly = in_array($followingFilter, ['1', 'true', 'yes', 'on'], true);
        $currentUser = $this->getUser();
        $followedOrganizerIds = $isFollowingOnly && $currentUser instanceof User
            ? $subscriptionRepository->findActiveOrganizerIdsForClient($currentUser)
            : null;
        $total = $eventRepository->countPublicList(
            $normalizedSearchFilter,
            $normalizedTypeFilter,
            $normalizedCityFilter,
            $dateFilter,
            $normalizedScopeFilter,
            $followedOrganizerIds
        );
        $totalPages = max(1, (int) ceil($total / $limit));
        $page = min($requestedPage, $totalPages);
        $offset = ($page - 1) * $limit;

        $events = $eventRepository->findPublicList(
            $normalizedSearchFilter,
            $normalizedTypeFilter,
            $normalizedCityFilter,
            $dateFilter,
            $limit,
            $offset,
            $normalizedScopeFilter,
            $followedOrganizerIds
        );

        return $this->json([
            'items' => array_map(
                fn (Event $event): array => $this->serializeEventSummary($request, $event),
                $events
            ),
            'page' => $page,
            'pageSize' => $limit,
            'total' => $total,
            'totalPages' => $totalPages,
            'hasPreviousPage' => $page > 1,
            'hasNextPage' => $page < $totalPages,
        ]);
    }

    #[Route('/api/events/{id}', name: 'api_event_detail', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(
        int $id,
        Request $request,
        EventRepository $eventRepository,
        AbonnementOrganisateurRepository $subscriptionRepository,
        TicketTypeRepository $ticketTypeRepository,
        OrderItemRepository $orderItemRepository
    ): JsonResponse {
        $event = $eventRepository->findOneForPublicDetail($id);

        if (!$event instanceof Event) {
            return $this->json([
                'message' => 'l’évènement introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        $organizer = $event->getOrganizer();
        $currentUser = $this->getUser();

        $subscription = [
            'canFollow' => false,
            'isFollowing' => false,
            'status' => null,
            'requiresAuth' => false,
            'isOwnOrganizer' => false,
        ];

        if ($organizer instanceof User) {
            if (!$currentUser instanceof User) {
                $subscription['requiresAuth'] = true;
            } elseif ($currentUser->getId() === $organizer->getId()) {
                $subscription['isOwnOrganizer'] = true;
            } else {
                $existingSubscription = $subscriptionRepository->findOneForClientAndOrganizer($currentUser, $organizer);
                $subscriptionStatus = $existingSubscription?->getStatus();

                $subscription = [
                    'canFollow' => true,
                    'isFollowing' => 'ACTIVE' === $subscriptionStatus,
                    'status' => $subscriptionStatus,
                    'requiresAuth' => false,
                    'isOwnOrganizer' => false,
                ];
            }
        }

        $ticketTypes = $ticketTypeRepository->findActiveForEventOrdered($event->getId());

        return $this->json([
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'description' => $event->getDescription(),
            'status' => $event->getStatus(),
            'startsAt' => $this->formatDateTimeForFrontend($event->getStartDatetime()),
            'endsAt' => $this->formatDateTimeForFrontend($event->getEndDatetime()),
            'capacity' => $event->getCapacity(),
            'createdAt' => $this->formatDateTimeForFrontend($event->getCreatedAt()),
            'category' => [
                'id' => $event->getCategory()?->getId(),
                'name' => $event->getCategory()?->getName(),
                'description' => $event->getCategory()?->getDescription(),
            ],
            'media' => [
                'thumbnailUrl' => $this->toPublicAssetUrl($request, $event->getThumbnailPhoto()),
                'coverUrl' => $this->toPublicAssetUrl($request, $event->getCoverPhoto()),
                'videoUrl' => $this->isEventFinished($event)
                    ? $this->toPublicAssetUrl($request, $event->getEventVideo())
                    : null,
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
                'profilePhoto' => $this->toPublicAssetUrl($request, $organizer->getProfilePhoto()),
            ] : null,
            'subscription' => $subscription,
            'ticketTypes' => array_map(
                fn (TicketType $ticketType): array => $this->serializePublicTicketType(
                    $ticketType,
                    $orderItemRepository->countReservedQuantityForTicketType($ticketType, \App\Entity\Order::STOCK_CONSUMING_STATUSES)
                ),
                $ticketTypes
            ),
            ...$this->serializeSponsorship($event),
        ]);
    }

    private function serializePublicTicketType(TicketType $ticketType, int $reservedQuantity): array
    {
        $stock = (int) ($ticketType->getStock() ?? 0);

        return [
            'id' => $ticketType->getId(),
            'name' => $ticketType->getName(),
            'description' => $ticketType->getDescription(),
            'basePrice' => null !== $ticketType->getPrice() ? (float) $ticketType->getPrice() : null,
            'stock' => $stock,
            'reservedQuantity' => $reservedQuantity,
            'availableStock' => max(0, $stock - $reservedQuantity),
            'saleStartAt' => $this->formatDateTimeForFrontend($ticketType->getSalesStartAt()),
            'saleEndAt' => $this->formatDateTimeForFrontend($ticketType->getSalesEndAt()),
            'maxPerOrder' => $ticketType->getMaxPerOrder(),
            'isActive' => $ticketType->isActive(),
        ];
    }

    private function serializeEventSummary(Request $request, Event $event): array
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

        $venue = $event->getLocation()?->getAddress() ?? $event->getLocation()?->getCity() ?? 'Lieu à confirmer';

        return [
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'shortDescription' => $this->createExcerpt($event->getDescription()),
            'city' => $event->getLocation()?->getCity() ?? 'Ville à confirmer',
            'venue' => $venue,
            'startsAt' => $this->formatDateTimeForFrontend($event->getStartDatetime()),
            'category' => $event->getCategory()?->getName() ?? 'évènement',
            'coverImageUrl' => $this->toPublicAssetUrl($request, $event->getThumbnailPhoto() ?? $event->getCoverPhoto()),
            'minPrice' => $minPrice,
            'currency' => 'EUR',
            ...$this->serializeSponsorship($event),
        ];
    }

    /**
     * @return array{isSponsored: bool, sponsoredCampaignId: int|null, sponsoredChannels: list<string>}
     */
    private function serializeSponsorship(Event $event): array
    {
        $now = new \DateTimeImmutable();

        foreach ($event->getPromotionCampaigns() as $campaign) {
            if (!$campaign instanceof PromotionCampaign || !$campaign->isActiveAt($now)) {
                continue;
            }

            $channels = [];

            foreach ($campaign->getChannels() as $channel) {
                $channelCode = $channel->getChannelCode();

                if (is_string($channelCode)) {
                    $channels[] = $channelCode;
                }
            }

            return [
                'isSponsored' => true,
                'sponsoredCampaignId' => $campaign->getId(),
                'sponsoredChannels' => $channels,
            ];
        }

        return [
            'isSponsored' => false,
            'sponsoredCampaignId' => null,
            'sponsoredChannels' => [],
        ];
    }

    private function isEventFinished(Event $event): bool
    {
        $endDatetime = $event->getEndDatetime();

        return $endDatetime instanceof \DateTimeImmutable
            && $endDatetime < new \DateTimeImmutable();
    }

    private function formatDateTimeForFrontend(?\DateTimeImmutable $dateTime): ?string
    {
        if (!$dateTime instanceof \DateTimeImmutable) {
            return null;
        }

        return $dateTime
            ->setTimezone(new \DateTimeZone(self::PUBLIC_TIMEZONE))
            ->format(DATE_ATOM);
    }

    private function createExcerpt(?string $text, int $maxLength = 140): string
    {
        $text = trim(preg_replace('/\s+/', ' ', (string) $text) ?? '');

        if ('' === $text) {
            return 'Informations à venir pour cet l’évènement.';
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

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $normalizedPath = str_replace('\\', '/', $path);

        if (!str_starts_with($normalizedPath, '/')) {
            return null;
        }

        return $this->publicFileExists($normalizedPath) ? $normalizedPath : null;
    }

    private function toPublicAssetUrl(Request $request, ?string $path): ?string
    {
        $normalizedPath = $this->normalizeMediaPath($path);

        if (null === $normalizedPath) {
            return null;
        }

        if (
            str_starts_with($normalizedPath, 'http://')
            || str_starts_with($normalizedPath, 'https://')
        ) {
            return $normalizedPath;
        }

        return $request->getSchemeAndHttpHost().$normalizedPath;
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
