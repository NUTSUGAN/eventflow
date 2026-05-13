<?php

namespace App\Controller;

use App\Entity\Category;
use App\Entity\Event;
use App\Entity\Location;
use App\Entity\User;
use App\Repository\CategoryRepository;
use App\Repository\EventRepository;
use App\Repository\LocationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/organizer/events')]
final class OrganizerEventController extends AbstractController
{
    private const ALLOWED_STATUSES = ['draft', 'published', 'cancelled'];

    #[Route('/options', name: 'api_organizer_event_options', methods: ['GET'])]
    public function options(
        CategoryRepository $categoryRepository,
        LocationRepository $locationRepository
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Acces reserve aux organisateurs ou administrateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        $categories = $categoryRepository->findBy([], ['name' => 'ASC']);
        $locations = $locationRepository->findBy([], ['city' => 'ASC', 'address' => 'ASC']);

        return $this->json([
            'categories' => array_map(
                static fn (Category $category): array => [
                    'id' => $category->getId(),
                    'name' => $category->getName(),
                    'description' => $category->getDescription(),
                ],
                $categories
            ),
            'locations' => array_map(
                static fn (Location $location): array => [
                    'id' => $location->getId(),
                    'address' => $location->getAddress(),
                    'city' => $location->getCity(),
                    'postalCode' => $location->getPostalCode(),
                    'country' => $location->getCountry(),
                ],
                $locations
            ),
        ]);
    }

    #[Route('', name: 'api_organizer_event_index', methods: ['GET'])]
    public function index(EventRepository $eventRepository): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Acces reserve aux organisateurs ou administrateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        $events = $eventRepository->findBy(
            ['organizer' => $user],
            ['createdAt' => 'DESC']
        );

        return $this->json(array_map(
            fn (Event $event): array => $this->serializeEvent($event),
            $events
        ));
    }

    #[Route('', name: 'api_organizer_event_create', methods: ['POST'])]
    public function create(
        Request $request,
        CategoryRepository $categoryRepository,
        LocationRepository $locationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Acces reserve aux organisateurs ou administrateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = $this->getRequestData($request);

        $categoryId = $data['categoryId'] ?? null;
        $locationId = $data['locationId'] ?? null;
        $title = trim((string) ($data['title'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $status = strtolower(trim((string) ($data['status'] ?? 'draft')));
        $capacity = $data['capacity'] ?? null;

        if (
            $categoryId === null ||
            $locationId === null ||
            $title === '' ||
            $description === ''
        ) {
            return $this->json([
                'message' => 'Les champs categoryId, locationId, title et description sont obligatoires.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $thumbnailFile = $request->files->get('thumbnailPhoto');
        $coverFile = $request->files->get('coverPhoto');

        if (!$thumbnailFile instanceof UploadedFile || !$coverFile instanceof UploadedFile) {
            return $this->json([
                'message' => 'Les fichiers thumbnailPhoto et coverPhoto sont obligatoires.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!is_numeric($capacity) || (int) $capacity <= 0) {
            return $this->json([
                'message' => 'La capacite doit etre un entier positif.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!in_array($status, self::ALLOWED_STATUSES, true)) {
            return $this->json([
                'message' => 'Le statut doit etre draft, published ou cancelled.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $startDatetime = $this->parseDateTime($data['startDatetime'] ?? null);
        $endDatetime = $this->parseDateTime($data['endDatetime'] ?? null);

        if (!$startDatetime || !$endDatetime) {
            return $this->json([
                'message' => 'Les dates startDatetime et endDatetime sont obligatoires et doivent etre valides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($endDatetime <= $startDatetime) {
            return $this->json([
                'message' => 'La date de fin doit etre posterieure a la date de debut.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $category = $categoryRepository->find($categoryId);

        if (!$category instanceof Category) {
            return $this->json([
                'message' => 'Categorie introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        $location = $locationRepository->find($locationId);

        if (!$location instanceof Location) {
            return $this->json([
                'message' => 'Lieu introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        try {
            $thumbnailPath = $this->uploadImage($thumbnailFile);
            $coverPath = $this->uploadImage($coverFile);
        } catch (\RuntimeException $exception) {
            return $this->json([
                'message' => $exception->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }

        $event = new Event();
        $event->setOrganizer($user);
        $event->setCategory($category);
        $event->setLocation($location);
        $event->setTitle($title);
        $event->setDescription($description);
        $event->setStartDatetime($startDatetime);
        $event->setEndDatetime($endDatetime);
        $event->setCapacity((int) $capacity);
        $event->setThumbnailPhoto($thumbnailPath);
        $event->setCoverPhoto($coverPath);
        $event->setStatus($status);
        $event->setCreatedAt(new \DateTimeImmutable());

        $entityManager->persist($event);
        $entityManager->flush();

        return $this->json([
            'message' => 'Evenement cree avec succes.',
            'event' => $this->serializeEvent($event),
        ], Response::HTTP_CREATED);
    }

    private function isOrganizerOrAdmin(User $user): bool
    {
        $roles = $user->getRoles();

        return in_array(User::ROLE_ORGANIZER, $roles, true)
            || in_array(User::ROLE_ADMIN, $roles, true);
    }

    private function getRequestData(Request $request): array
    {
        $contentType = (string) $request->headers->get('Content-Type', '');

        if (str_contains($contentType, 'application/json')) {
            try {
                return $request->toArray();
            } catch (\Throwable) {
                return [];
            }
        }

        return $request->request->all();
    }

    private function parseDateTime(mixed $value): ?\DateTimeImmutable
    {
        if (!is_string($value) || '' === trim($value)) {
            return null;
        }

        try {
            return new \DateTimeImmutable($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function uploadImage(UploadedFile $file): string
    {
        $mimeType = $file->getMimeType() ?? '';

        if (!str_starts_with($mimeType, 'image/')) {
            throw new \RuntimeException('Le fichier envoye doit etre une image.');
        }

        $uploadDir = $this->getParameter('kernel.project_dir').'/public/uploads/events';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = preg_replace('/[^A-Za-z0-9_-]/', '-', $originalName) ?: 'image';
        $extension = $file->guessExtension() ?: 'bin';
        $filename = uniqid('event_', true).'-'.$safeName.'.'.$extension;

        $file->move($uploadDir, $filename);

        return '/uploads/events/'.$filename;
    }

    private function serializeEvent(Event $event): array
    {
        return [
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'description' => $event->getDescription(),
            'startDatetime' => $event->getStartDatetime()?->format(DATE_ATOM),
            'endDatetime' => $event->getEndDatetime()?->format(DATE_ATOM),
            'capacity' => $event->getCapacity(),
            'thumbnailPhoto' => $event->getThumbnailPhoto(),
            'coverPhoto' => $event->getCoverPhoto(),
            'status' => $event->getStatus(),
            'createdAt' => $event->getCreatedAt()?->format(DATE_ATOM),
            'ticketTypesCount' => $event->getTicketTypes()->count(),
            'category' => [
                'id' => $event->getCategory()?->getId(),
                'name' => $event->getCategory()?->getName(),
            ],
            'location' => [
                'id' => $event->getLocation()?->getId(),
                'address' => $event->getLocation()?->getAddress(),
                'city' => $event->getLocation()?->getCity(),
                'postalCode' => $event->getLocation()?->getPostalCode(),
                'country' => $event->getLocation()?->getCountry(),
            ],
        ];
    }
}
