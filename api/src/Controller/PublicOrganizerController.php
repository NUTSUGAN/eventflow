<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\User;
use App\Repository\AbonnementOrganisateurRepository;
use App\Repository\EventRepository;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class PublicOrganizerController extends AbstractController
{
    #[Route('/api/organizers/{id}', name: 'api_public_organizer_profile', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(
        int $id,
        Request $request,
        UserRepository $userRepository,
        EventRepository $eventRepository,
        AbonnementOrganisateurRepository $subscriptionRepository
    ): JsonResponse {
        $organizer = $userRepository->findPublicOrganizerById($id);

        if (!$organizer instanceof User) {
            return $this->json([
                'message' => 'Organisateur introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        $events = $eventRepository->findPublishedByOrganizer($organizer->getId(), 12);
        $publishedEventCount = $eventRepository->countPublishedByOrganizer($organizer->getId());
        $currentUser = $this->getUser();

        $subscription = [
            'canFollow' => false,
            'isFollowing' => false,
            'status' => null,
            'requiresAuth' => false,
            'isOwnOrganizer' => false,
        ];

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

        return $this->json([
            'organizer' => [
                'id' => $organizer->getId(),
                'firstName' => $organizer->getFirstName(),
                'lastName' => $organizer->getLastName(),
                'fullName' => trim(sprintf('%s %s', $organizer->getFirstName(), $organizer->getLastName())),
                'profilePhoto' => $this->toPublicAssetUrl($request, $organizer->getProfilePhoto()),
                'createdAt' => $organizer->getCreatedAt()?->format(DATE_ATOM),
                'publishedEventCount' => $publishedEventCount,
            ],
            'subscription' => $subscription,
            'events' => array_map(
                fn (Event $event): array => $this->serializeEventSummary($request, $event),
                $events
            ),
        ]);
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

        $venue = $event->getLocation()?->getAddress() ?? $event->getLocation()?->getCity() ?? 'Lieu a confirmer';

        return [
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'shortDescription' => $this->createExcerpt($event->getDescription()),
            'city' => $event->getLocation()?->getCity() ?? 'Ville a confirmer',
            'venue' => $venue,
            'startsAt' => $event->getStartDatetime()?->format(DATE_ATOM),
            'category' => $event->getCategory()?->getName() ?? 'Evenement',
            'coverImageUrl' => $this->toPublicAssetUrl($request, $event->getThumbnailPhoto() ?? $event->getCoverPhoto()),
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
}
