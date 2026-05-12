<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\User;
use App\Repository\EventRepository;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class PublicSearchController extends AbstractController
{
    #[Route('/api/search/suggestions', name: 'api_search_suggestions', methods: ['GET'])]
    public function suggestions(
        Request $request,
        EventRepository $eventRepository,
        UserRepository $userRepository
    ): JsonResponse {
        $query = trim((string) $request->query->get('q', ''));

        if (mb_strlen($query) < 3) {
            return $this->json([
                'query' => $query,
                'events' => [],
                'organizers' => [],
            ]);
        }

        $events = $eventRepository->findPublicSuggestionsByTitle($query, 5);
        $organizers = $userRepository->findPublicOrganizerSuggestions($query, 5);

        return $this->json([
            'query' => $query,
            'events' => array_map(
                fn (Event $event): array => $this->serializeEventSuggestion($request, $event),
                $events
            ),
            'organizers' => array_map(
                fn (User $organizer): array => $this->serializeOrganizerSuggestion($request, $organizer),
                $organizers
            ),
        ]);
    }

    private function serializeEventSuggestion(Request $request, Event $event): array
    {
        return [
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'category' => $event->getCategory()?->getName(),
            'city' => $event->getLocation()?->getCity(),
            'startsAt' => $event->getStartDatetime()?->format(DATE_ATOM),
            'coverImageUrl' => $this->toPublicAssetUrl($request, $event->getThumbnailPhoto() ?? $event->getCoverPhoto()),
        ];
    }

    private function serializeOrganizerSuggestion(Request $request, User $organizer): array
    {
        return [
            'id' => $organizer->getId(),
            'firstName' => $organizer->getFirstName(),
            'lastName' => $organizer->getLastName(),
            'fullName' => trim(sprintf('%s %s', $organizer->getFirstName(), $organizer->getLastName())),
            'profilePhoto' => $this->toPublicAssetUrl($request, $organizer->getProfilePhoto()),
        ];
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
