<?php

namespace App\Controller;

use App\Entity\Category;
use App\Entity\Event;
use App\Entity\Location;
use App\Entity\User;
use App\Repository\CategoryRepository;
use App\Repository\EventRepository;
use App\Repository\LocationRepository;
use App\Repository\UserRepository;
use App\Service\UploadedImageStorage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/events')]
#[IsGranted('ROLE_ADMIN_SUPPORT')]
final class AdminEventController extends AbstractController
{
    private const ALLOWED_STATUSES = ['draft', 'published', 'cancelled', 'suspended'];

    public function __construct(
        private readonly UploadedImageStorage $imageStorage,
    ) {
    }

    #[Route('', name: 'api_admin_event_index', methods: ['GET'])]
    public function index(EventRepository $eventRepository): JsonResponse
    {
        $events = $eventRepository->findBy([], ['id' => 'DESC']);

        $data = array_map(
            fn (Event $event) => $this->serializeEvent($event),
            $events
        );

        return $this->json($data);
    }

    #[Route('/{id}', name: 'api_admin_event_show', methods: ['GET'])]
    public function show(Event $event): JsonResponse
    {
        return $this->json($this->serializeEvent($event));
    }

    #[Route('', name: 'api_admin_event_create', methods: ['POST'])]
    public function create(
        Request $request,
        UserRepository $userRepository,
        CategoryRepository $categoryRepository,
        LocationRepository $locationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $data = $this->getRequestData($request);

        $organizerId = $data['organizerId'] ?? null;
        $categoryId = $data['categoryId'] ?? null;
        $locationId = $data['locationId'] ?? null;

        $title = trim((string) ($data['title'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $thumbnailFile = $request->files->get('thumbnailPhoto');
        $coverFile = $request->files->get('coverPhoto');
        $status = strtolower(trim((string) ($data['status'] ?? 'draft')));
        $capacity = $data['capacity'] ?? null;

        if (
            $organizerId === null ||
            $categoryId === null ||
            $locationId === null ||
            $title === '' ||
            $description === ''
        ) {
            return $this->json([
                'message' => 'Les champs organizerId, categoryId, locationId, title et description sont obligatoires.'
            ], 400);
        }

        if (!$thumbnailFile instanceof UploadedFile || !$coverFile instanceof UploadedFile) {
            return $this->json([
                'message' => 'Les fichiers thumbnailPhoto et coverPhoto sont obligatoires.'
            ], 400);
        }

        if (!is_numeric($capacity) || (int) $capacity <= 0) {
            return $this->json([
                'message' => 'La capacité doit être un entier positif.'
            ], 400);
        }

        if (!in_array($status, self::ALLOWED_STATUSES, true)) {
            return $this->json([
                'message' => 'Le statut doit être draft, published, cancelled ou suspended.'
            ], 400);
        }

        $startDatetime = $this->parseDateTime($data['startDatetime'] ?? null);
        $endDatetime = $this->parseDateTime($data['endDatetime'] ?? null);

        if (!$startDatetime || !$endDatetime) {
            return $this->json([
                'message' => 'Les dates startDatetime et endDatetime sont obligatoires et doivent être valides.'
            ], 400);
        }

        if ($endDatetime <= $startDatetime) {
            return $this->json([
                'message' => 'La date de fin doit être postérieure à la date de début.'
            ], 400);
        }

        $organizer = $userRepository->find($organizerId);
        if (!$organizer instanceof User) {
            return $this->json([
                'message' => 'Organisateur introuvable.'
            ], 404);
        }

        if (
            !in_array(User::ROLE_ORGANIZER, $organizer->getRoles(), true) &&
            !$organizer->isAdminAccount()
        ) {
            return $this->json([
                'message' => 'L’utilisateur sélectionné doit être organisateur ou administrateur.'
            ], 400);
        }

        $category = $categoryRepository->find($categoryId);
        if (!$category instanceof Category) {
            return $this->json([
                'message' => 'Catégorie introuvable.'
            ], 404);
        }

        $location = $locationRepository->find($locationId);
        if (!$location instanceof Location) {
            return $this->json([
                'message' => 'Lieu introuvable.'
            ], 404);
        }

        try {
            $thumbnailPath = $this->uploadImage($thumbnailFile);
            $coverPath = $this->uploadImage($coverFile);
        } catch (\RuntimeException $e) {
            return $this->json([
                'message' => $e->getMessage()
            ], 400);
        }

        $event = new Event();
        $event->setOrganizer($organizer);
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
            'message' => 'Événement créé avec succès.',
            'event' => $this->serializeEvent($event)
        ], 201);
    }

    #[Route('/{id}', name: 'api_admin_event_update', methods: ['PATCH', 'POST'])]
    public function update(
        Event $event,
        Request $request,
        UserRepository $userRepository,
        CategoryRepository $categoryRepository,
        LocationRepository $locationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $data = $this->getRequestData($request);

        $startDatetime = $event->getStartDatetime();
        $endDatetime = $event->getEndDatetime();

        if (array_key_exists('title', $data)) {
            $title = trim((string) $data['title']);
            if ($title === '') {
                return $this->json(['message' => 'Le titre ne peut pas être vide.'], 400);
            }
            $event->setTitle($title);
        }

        if (array_key_exists('description', $data)) {
            $description = trim((string) $data['description']);
            if ($description === '') {
                return $this->json(['message' => 'La description ne peut pas être vide.'], 400);
            }
            $event->setDescription($description);
        }

        if (array_key_exists('capacity', $data)) {
            if (!is_numeric($data['capacity']) || (int) $data['capacity'] <= 0) {
                return $this->json(['message' => 'La capacité doit être un entier positif.'], 400);
            }
            $event->setCapacity((int) $data['capacity']);
        }

        if (array_key_exists('status', $data)) {
            $status = strtolower(trim((string) $data['status']));
            if (!in_array($status, self::ALLOWED_STATUSES, true)) {
                return $this->json(['message' => 'Le statut doit être draft, published, cancelled ou suspended.'], 400);
            }
            $event->setStatus($status);
        }

        if (array_key_exists('startDatetime', $data)) {
            $parsedStart = $this->parseDateTime($data['startDatetime']);
            if (!$parsedStart) {
                return $this->json(['message' => 'startDatetime doit être une date valide.'], 400);
            }
            $startDatetime = $parsedStart;
            $event->setStartDatetime($parsedStart);
        }

        if (array_key_exists('endDatetime', $data)) {
            $parsedEnd = $this->parseDateTime($data['endDatetime']);
            if (!$parsedEnd) {
                return $this->json(['message' => 'endDatetime doit être une date valide.'], 400);
            }
            $endDatetime = $parsedEnd;
            $event->setEndDatetime($parsedEnd);
        }

        if ($startDatetime && $endDatetime && $endDatetime <= $startDatetime) {
            return $this->json([
                'message' => 'La date de fin doit être postérieure à la date de début.'
            ], 400);
        }

        if (array_key_exists('organizerId', $data)) {
            $organizer = $userRepository->find($data['organizerId']);
            if (!$organizer instanceof User) {
                return $this->json(['message' => 'Organisateur introuvable.'], 404);
            }
        if (
            !in_array(User::ROLE_ORGANIZER, $organizer->getRoles(), true) &&
            !$organizer->isAdminAccount()
        ) {
            return $this->json([
                'message' => 'L’utilisateur sélectionné doit être organisateur ou administrateur.'
            ], 400);
        }
            $event->setOrganizer($organizer);
        }

        if (array_key_exists('categoryId', $data)) {
            $category = $categoryRepository->find($data['categoryId']);
            if (!$category instanceof Category) {
                return $this->json(['message' => 'Catégorie introuvable.'], 404);
            }
            $event->setCategory($category);
        }

        if (array_key_exists('locationId', $data)) {
            $location = $locationRepository->find($data['locationId']);
            if (!$location instanceof Location) {
                return $this->json(['message' => 'Lieu introuvable.'], 404);
            }
            $event->setLocation($location);
        }

        $thumbnailFile = $request->files->get('thumbnailPhoto');
        if ($thumbnailFile instanceof UploadedFile) {
            try {
                $newThumbnailPath = $this->uploadImage($thumbnailFile);
                $this->removeUploadedFile($event->getThumbnailPhoto());
                $event->setThumbnailPhoto($newThumbnailPath);
            } catch (\RuntimeException $e) {
                return $this->json(['message' => $e->getMessage()], 400);
            }
        }

        $coverFile = $request->files->get('coverPhoto');
        if ($coverFile instanceof UploadedFile) {
            try {
                $newCoverPath = $this->uploadImage($coverFile);
                $this->removeUploadedFile($event->getCoverPhoto());
                $event->setCoverPhoto($newCoverPath);
            } catch (\RuntimeException $e) {
                return $this->json(['message' => $e->getMessage()], 400);
            }
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Événement mis à jour avec succès.',
            'event' => $this->serializeEvent($event)
        ]);
    }

    #[Route('/{id}', name: 'api_admin_event_delete', methods: ['DELETE'])]
    public function delete(
        Event $event,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        if (!$event->getTicketTypes()->isEmpty() || !$event->getPromotionCampaigns()->isEmpty()) {
            return $this->json([
                'message' => 'Impossible de supprimer un événement déjà lié à des types de billets ou des promotions.'
            ], 409);
        }

        $this->removeUploadedFile($event->getThumbnailPhoto());
        $this->removeUploadedFile($event->getCoverPhoto());

        $entityManager->remove($event);
        $entityManager->flush();

        return $this->json([
            'message' => 'Événement supprimé avec succès.'
        ]);
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
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return new \DateTimeImmutable($value);
        } catch (\Exception) {
            return null;
        }
    }

    private function uploadImage(UploadedFile $file): string
    {
        return $this->imageStorage->storeUploadedImage($file, 'events', 'event');

        $mimeType = $file->getMimeType() ?? '';

        if (!str_starts_with($mimeType, 'image/')) {
            throw new \RuntimeException('Le fichier envoyé doit être une image.');
        }

        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/events';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = preg_replace('/[^A-Za-z0-9_-]/', '-', $originalName) ?: 'image';
        $extension = $file->guessExtension() ?: 'bin';

        $filename = uniqid('event_', true) . '-' . $safeName . '.' . $extension;

        $file->move($uploadDir, $filename);

        return '/uploads/events/' . $filename;
    }

    private function removeUploadedFile(?string $relativePath): void
    {
        $this->imageStorage->remove($relativePath);

        return;

        if (!$relativePath) {
            return;
        }

        $fullPath = $this->getParameter('kernel.project_dir') . '/public' . $relativePath;

        if (is_file($fullPath)) {
            unlink($fullPath);
        }
    }

    private function serializeEvent(Event $event): array
    {
        return [
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'description' => $event->getDescription(),
            'startDatetime' => $event->getStartDatetime()?->format(\DateTimeInterface::ATOM),
            'endDatetime' => $event->getEndDatetime()?->format(\DateTimeInterface::ATOM),
            'capacity' => $event->getCapacity(),
            'thumbnailPhoto' => $event->getThumbnailPhoto(),
            'coverPhoto' => $event->getCoverPhoto(),
            'status' => $event->getStatus(),
            'createdAt' => $event->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'organizer' => [
                'id' => $event->getOrganizer()?->getId(),
                'email' => $event->getOrganizer()?->getEmail(),
                'firstName' => $event->getOrganizer()?->getFirstName(),
                'lastName' => $event->getOrganizer()?->getLastName(),
            ],
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
                'latitude' => $event->getLocation()?->getLatitude(),
                'longitude' => $event->getLocation()?->getLongitude(),
            ],
        ];
    }
}
