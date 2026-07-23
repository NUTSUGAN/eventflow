<?php

namespace App\Controller;

use App\Entity\Category;
use App\Entity\Checkin;
use App\Entity\Event;
use App\Entity\Location;
use App\Entity\Order;
use App\Entity\OrderItem;
use App\Entity\User;
use App\Repository\CategoryRepository;
use App\Repository\CheckinRepository;
use App\Repository\AbonnementOrganisateurRepository;
use App\Repository\EventRepository;
use App\Repository\WithdrawalSettingRepository;
use App\Service\UploadedImageStorage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/organizer/events')]
final class OrganizerEventController extends AbstractController
{
    use OrganizerAdminReadOnlyTrait;

    private const ORGANIZER_TIMEZONE = 'Europe/Paris';
    private const ALLOWED_STATUSES = ['draft', 'published'];
    private const DEFAULT_CATEGORIES = [
        [
            'name' => 'Concert',
            'description' => 'Concerts live, showcases et performances musicales.',
        ],
        [
            'name' => 'Festival',
            'description' => 'Festivals, grands rassemblements et formats multi-scènes.',
        ],
        [
            'name' => 'Conférence',
            'description' => 'Conférences, talks et évènements professionnels.',
        ],
        [
            'name' => 'Atelier',
            'description' => 'Ateliers pratiques, masterclass et sessions guidées.',
        ],
        [
            'name' => 'Spectacle',
            'description' => 'Spectacles, stand-up, théâtre et performances artistiques.',
        ],
        [
            'name' => 'Exposition',
            'description' => 'Expositions, pop-up culturels et expériences immersives.',
        ],
        [
            'name' => 'Sport',
            'description' => 'Rencontres sportives, tournois et évènements fitness.',
        ],
    ];

    public function __construct(
        private readonly UploadedImageStorage $imageStorage,
    ) {
    }

    #[Route('/options', name: 'api_organizer_event_options', methods: ['GET'])]
    public function options(
        CategoryRepository $categoryRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifié.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Accès réservé aux organisateurs ou administrateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        $categories = $this->ensureDefaultCategories($categoryRepository, $entityManager);

        return $this->json([
            'categories' => array_map(
                static fn (Category $category): array => [
                    'id' => $category->getId(),
                    'name' => $category->getName(),
                    'description' => $category->getDescription(),
                ],
                $categories
            ),
        ]);
    }

    #[Route('', name: 'api_organizer_event_index', methods: ['GET'])]
    public function index(EventRepository $eventRepository): JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifié.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Accès réservé aux organisateurs ou administrateurs.',
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

    #[Route('/dashboard', name: 'api_organizer_event_dashboard', methods: ['GET'])]
    public function dashboard(
        EventRepository $eventRepository,
        EntityManagerInterface $entityManager,
        AbonnementOrganisateurRepository $subscriptionRepository,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifié.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Accès réservé aux organisateurs ou administrateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        $events = $eventRepository->findBy(
            ['organizer' => $user],
            ['createdAt' => 'DESC']
        );

        $salesByEvent = $this->findOrganizerSalesByEvent($user, $entityManager);
        $salesTotals = $this->findOrganizerSalesTotals($user, $entityManager);
        $scansByEvent = $this->findOrganizerScansByEvent($user, $entityManager);
        $scanTotals = $this->findOrganizerScanTotals($user, $entityManager);
        $subscriberCount = $subscriptionRepository->countActiveForOrganizer($user);
        $now = new \DateTimeImmutable();

        return $this->json([
            'stats' => [
                'revenue' => [
                    'total' => $salesTotals['revenueTotal'],
                    'currency' => Order::DEFAULT_CURRENCY,
                ],
                'orders' => [
                    'paid' => $salesTotals['paidOrders'],
                ],
                'subscribers' => [
                    'total' => $subscriberCount,
                ],
                'tickets' => [
                    'sold' => $salesTotals['ticketsSold'],
                ],
                'scans' => $scanTotals,
                'events' => [
                    'total' => count($events),
                    'published' => count(array_filter(
                        $events,
                        static fn (Event $event): bool => 'published' === $event->getStatus(),
                    )),
                    'draft' => count(array_filter(
                        $events,
                        static fn (Event $event): bool => 'draft' === $event->getStatus(),
                    )),
                    'cancelled' => count(array_filter(
                        $events,
                        static fn (Event $event): bool => 'cancelled' === $event->getStatus(),
                    )),
                    'upcoming' => count(array_filter(
                        $events,
                        static fn (Event $event): bool => $event->getStartDatetime() instanceof \DateTimeImmutable
                            && $event->getStartDatetime() >= $now
                            && 'cancelled' !== $event->getStatus(),
                    )),
                ],
                'staff' => [
                    'active' => $user->countActiveManagedStaffMembers(),
                ],
            ],
            'events' => array_map(
                fn (Event $event): array => $this->serializeDashboardEvent(
                    $event,
                    $salesByEvent,
                    $scansByEvent,
                ),
                $events,
            ),
        ]);
    }

    #[Route('', name: 'api_organizer_event_create', methods: ['POST'])]
    public function create(
        Request $request,
        CategoryRepository $categoryRepository,
        EntityManagerInterface $entityManager,
        WithdrawalSettingRepository $withdrawalSettingRepository,
    ): JsonResponse {
        $user = $this->getUser();

        if ($user instanceof User && null !== ($response = $this->denyAdminOrganizerMutation($user, $user))) {
            return $response;
        }

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifié.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Accès réservé aux organisateurs ou administrateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = $this->getRequestData($request);

        $categoryId = $data['categoryId'] ?? null;
        $title = trim((string) ($data['title'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $status = strtolower(trim((string) ($data['status'] ?? 'draft')));
        $capacity = $data['capacity'] ?? null;
        $locationAddress = trim((string) ($data['locationAddress'] ?? ''));
        $locationCity = trim((string) ($data['locationCity'] ?? ''));
        $locationPostalCode = trim((string) ($data['locationPostalCode'] ?? ''));
        $locationCountry = trim((string) ($data['locationCountry'] ?? ''));
        $locationLatitude = $this->normalizeOptionalDecimal($data['locationLatitude'] ?? null);
        $locationLongitude = $this->normalizeOptionalDecimal($data['locationLongitude'] ?? null);

        if (
            $categoryId === null ||
            $title === '' ||
            $description === '' ||
            $locationAddress === '' ||
            $locationCity === '' ||
            $locationPostalCode === '' ||
            $locationCountry === ''
        ) {
            return $this->json([
                'message' => 'Les champs categoryId, title, description et les informations de lieu sont obligatoires.',
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
                'message' => 'La capacité doit être un entier positif.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!in_array($status, self::ALLOWED_STATUSES, true)) {
            return $this->json([
                'message' => 'Le statut doit être draft ou published.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (
            null !== $locationLatitude &&
            (!$this->isLatitudeValid($locationLatitude))
        ) {
            return $this->json([
                'message' => 'La latitude doit être comprise entre -90 et 90.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (
            null !== $locationLongitude &&
            (!$this->isLongitudeValid($locationLongitude))
        ) {
            return $this->json([
                'message' => 'La longitude doit être comprise entre -180 et 180.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $startDatetime = $this->parseDateTime($data['startDatetime'] ?? null);
        $endDatetime = $this->parseDateTime($data['endDatetime'] ?? null);

        if (!$startDatetime || !$endDatetime) {
            return $this->json([
                'message' => 'Les dates startDatetime et endDatetime sont obligatoires et doivent être valides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $now = new \DateTimeImmutable();

        if ($startDatetime < $now) {
            return $this->json([
                'message' => 'La date de début ne peut pas être dans le passé.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($endDatetime <= $startDatetime) {
            return $this->json([
                'message' => 'La date de fin doit être postérieure à la date de début.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $this->ensureDefaultCategories($categoryRepository, $entityManager);

        $category = $categoryRepository->find($categoryId);

        if (!$category instanceof Category) {
            return $this->json([
                'message' => 'Catégorie introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        try {
            $thumbnailPath = $this->uploadImage($thumbnailFile);
            $coverPath = $this->uploadImage($coverFile);
        } catch (\Throwable $exception) {
            return $this->json([
                'message' => $exception->getMessage() !== ''
                    ? $exception->getMessage()
                    : 'Impossible de traiter les images envoyées.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $location = new Location();
        $location->setAddress($locationAddress);
        $location->setCity($locationCity);
        $location->setPostalCode($locationPostalCode);
        $location->setCountry($locationCountry);
        $location->setLatitude($locationLatitude);
        $location->setLongitude($locationLongitude);

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
        $event->setWithdrawalFeePercent(
            $withdrawalSettingRepository->getCurrent($entityManager)->getDefaultFeePercent()
        );

        $entityManager->persist($location);
        $entityManager->persist($event);
        $entityManager->flush();

        return $this->json([
            'message' => 'L’évènement a été créé avec succès.',
            'event' => $this->serializeEvent($event),
        ], Response::HTTP_CREATED);
    }

    #[Route('/{eventId}', name: 'api_organizer_event_show', methods: ['GET'])]
    public function show(
        int $eventId,
        EventRepository $eventRepository,
        CheckinRepository $checkinRepository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifié.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Accès réservé aux organisateurs ou administrateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        $event = $this->resolveOrganizerEvent($eventRepository, $eventId, $user);

        if (!$event instanceof Event) {
            return $this->json([
                'message' => 'L’évènement est introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        $salesByEvent = $this->findOrganizerSalesByEvent($user, $entityManager);
        $scansByEvent = $this->findOrganizerScansByEvent($user, $entityManager);

        return $this->json([
            'event' => $this->serializeDashboardEvent(
                $event,
                $salesByEvent,
                $scansByEvent,
                $this->serializeScanStats($checkinRepository->findStaffScanStatsForEvent($event)),
            ),
        ]);
    }

    #[Route('/{eventId}', name: 'api_organizer_event_update', methods: ['POST', 'PATCH'])]
    public function update(
        int $eventId,
        Request $request,
        EventRepository $eventRepository,
        CategoryRepository $categoryRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifié.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Accès réservé aux organisateurs ou administrateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        $event = $this->resolveOrganizerEvent($eventRepository, $eventId, $user);

        if (!$event instanceof Event) {
            return $this->json([
                'message' => 'L’évènement est introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        if (null !== ($response = $this->denyAdminOrganizerMutation($user, $event->getOrganizer()))) {
            return $response;
        }

        $data = $this->getRequestData($request);

        $categoryId = $data['categoryId'] ?? null;
        $title = trim((string) ($data['title'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));
        $status = strtolower(trim((string) ($data['status'] ?? 'draft')));
        $capacity = $data['capacity'] ?? null;
        $locationAddress = trim((string) ($data['locationAddress'] ?? ''));
        $locationCity = trim((string) ($data['locationCity'] ?? ''));
        $locationPostalCode = trim((string) ($data['locationPostalCode'] ?? ''));
        $locationCountry = trim((string) ($data['locationCountry'] ?? ''));
        $locationLatitude = $this->normalizeOptionalDecimal($data['locationLatitude'] ?? null);
        $locationLongitude = $this->normalizeOptionalDecimal($data['locationLongitude'] ?? null);

        if (
            $categoryId === null ||
            $title === '' ||
            $description === '' ||
            $locationAddress === '' ||
            $locationCity === '' ||
            $locationPostalCode === '' ||
            $locationCountry === ''
        ) {
            return $this->json([
                'message' => 'Les champs categoryId, title, description et les informations de lieu sont obligatoires.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!is_numeric($capacity) || (int) $capacity <= 0) {
            return $this->json([
                'message' => 'La capacité doit être un entier positif.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!in_array($status, self::ALLOWED_STATUSES, true)) {
            return $this->json([
                'message' => 'Le statut doit être draft ou published.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (
            null !== $locationLatitude &&
            (!$this->isLatitudeValid($locationLatitude))
        ) {
            return $this->json([
                'message' => 'La latitude doit être comprise entre -90 et 90.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (
            null !== $locationLongitude &&
            (!$this->isLongitudeValid($locationLongitude))
        ) {
            return $this->json([
                'message' => 'La longitude doit être comprise entre -180 et 180.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $startDatetime = $this->parseDateTime($data['startDatetime'] ?? null);
        $endDatetime = $this->parseDateTime($data['endDatetime'] ?? null);

        if (!$startDatetime || !$endDatetime) {
            return $this->json([
                'message' => 'Les dates startDatetime et endDatetime sont obligatoires et doivent être valides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $now = new \DateTimeImmutable();
        $currentStartDatetime = $event->getStartDatetime();

        $isKeepingExistingPastStartDatetime =
            $currentStartDatetime instanceof \DateTimeImmutable
            && $currentStartDatetime->format('Y-m-d H:i:s') === $startDatetime->format('Y-m-d H:i:s');

        if ($startDatetime < $now && !$isKeepingExistingPastStartDatetime) {
            return $this->json([
                'message' => 'La date de début ne peut pas être dans le passé.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($endDatetime <= $startDatetime) {
            return $this->json([
                'message' => 'La date de fin doit être postérieure à la date de début.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $this->ensureDefaultCategories($categoryRepository, $entityManager);

        $category = $categoryRepository->find($categoryId);

        if (!$category instanceof Category) {
            return $this->json([
                'message' => 'Catégorie introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        $allocatedTicketStock = $this->calculateAllocatedTicketStock($event);

        if ($allocatedTicketStock > (int) $capacity) {
            return $this->json([
                'message' => sprintf(
                    'La capacité de l’évènement (%d) ne peut pas être inférieure au stock déjà alloué aux billets (%d).',
                    (int) $capacity,
                    $allocatedTicketStock
                ),
            ], Response::HTTP_BAD_REQUEST);
        }

        $ticketWindowConflictMessage = $this->getTicketWindowConflictMessage(
            $event,
            $startDatetime
        );

        if (null !== $ticketWindowConflictMessage) {
            return $this->json([
                'message' => $ticketWindowConflictMessage,
            ], Response::HTTP_BAD_REQUEST);
        }

        $thumbnailFile = $request->files->get('thumbnailPhoto');
        $coverFile = $request->files->get('coverPhoto');
        $eventVideoFile = $request->files->get('eventVideo');

        if (null !== $thumbnailFile && !$thumbnailFile instanceof UploadedFile) {
            return $this->json([
                'message' => 'La miniature envoyée est invalide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (null !== $coverFile && !$coverFile instanceof UploadedFile) {
            return $this->json([
                'message' => 'La cover envoyée est invalide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (null !== $eventVideoFile && !$eventVideoFile instanceof UploadedFile) {
            return $this->json([
                'message' => 'La vidéo envoyée est invalide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($eventVideoFile instanceof UploadedFile && $endDatetime >= $now) {
            return $this->json([
                'message' => 'La vidéo souvenir peut être ajoutée uniquement quand l’évènement est terminé.',
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            if ($thumbnailFile instanceof UploadedFile) {
                $previousThumbnailPhoto = $event->getThumbnailPhoto();
                $event->setThumbnailPhoto($this->uploadImage($thumbnailFile));
                $this->imageStorage->remove($previousThumbnailPhoto);
            }

            if ($coverFile instanceof UploadedFile) {
                $previousCoverPhoto = $event->getCoverPhoto();
                $event->setCoverPhoto($this->uploadImage($coverFile));
                $this->imageStorage->remove($previousCoverPhoto);
            }

            if ($eventVideoFile instanceof UploadedFile) {
                $previousEventVideo = $event->getEventVideo();
                $event->setEventVideo($this->uploadVideo($eventVideoFile));
                $this->imageStorage->remove($previousEventVideo);
            }
        } catch (\Throwable $exception) {
            return $this->json([
                'message' => $exception->getMessage() !== ''
                    ? $exception->getMessage()
                    : 'Impossible de traiter les images envoyées.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $location = $event->getLocation();

        if (!$location instanceof Location) {
            $location = new Location();
            $event->setLocation($location);
            $entityManager->persist($location);
        }

        $location->setAddress($locationAddress);
        $location->setCity($locationCity);
        $location->setPostalCode($locationPostalCode);
        $location->setCountry($locationCountry);
        $location->setLatitude($locationLatitude);
        $location->setLongitude($locationLongitude);

        $event->setCategory($category);
        $event->setTitle($title);
        $event->setDescription($description);
        $event->setStartDatetime($startDatetime);
        $event->setEndDatetime($endDatetime);
        $event->setCapacity((int) $capacity);
        $event->setStatus($status);

        $entityManager->flush();

        return $this->json([
            'message' => 'La fiche de l’évènement a été mise à jour avec succès.',
            'event' => $this->serializeEvent($event),
        ]);
    }

    #[Route('/{eventId}/status', name: 'api_organizer_event_update_status', methods: ['PATCH'])]
    public function updateStatus(
        int $eventId,
        Request $request,
        EventRepository $eventRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifié.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Accès réservé aux organisateurs ou administrateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        $event = $eventRepository->find($eventId);

        if (!$event instanceof Event) {
            return $this->json([
                'message' => 'L’évènement est introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        if (null !== ($response = $this->denyAdminOrganizerMutation($user, $event->getOrganizer()))) {
            return $response;
        }

        if (
            !$user->isAdminAccount() &&
            $event->getOrganizer()?->getId() !== $user->getId()
        ) {
            return $this->json([
                'message' => 'Tu ne peux modifier que le statut de tes propres évènements.',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = $this->getRequestData($request);
        $status = strtolower(trim((string) ($data['status'] ?? '')));

        if (!in_array($status, self::ALLOWED_STATUSES, true)) {
            return $this->json([
                'message' => 'Le statut doit être draft ou published.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if ($event->getStatus() === $status) {
            return $this->json([
                'message' => 'Le statut de cet évènement est déjà à jour.',
                'event' => $this->serializeEvent($event),
            ]);
        }

        $event->setStatus($status);
        $entityManager->flush();

        return $this->json([
            'message' => 'Le statut de l’évènement a été mis à jour.',
            'event' => $this->serializeEvent($event),
        ]);
    }

    /**
     * @return Category[]
     */
    private function ensureDefaultCategories(
        CategoryRepository $categoryRepository,
        EntityManagerInterface $entityManager
    ): array {
        $categories = $categoryRepository->findBy([], ['name' => 'ASC']);
        $existingNames = [];
        $visibleCategories = [];

        foreach ($categories as $category) {
            $normalizedName = trim((string) $category->getName());

            if ($normalizedName === '') {
                continue;
            }

            $existingNames[mb_strtolower($normalizedName)] = true;
            $visibleCategories[] = $category;
        }

        $hasCreatedCategory = false;

        foreach (self::DEFAULT_CATEGORIES as $defaultCategory) {
            $normalizedName = mb_strtolower($defaultCategory['name']);

            if (isset($existingNames[$normalizedName])) {
                continue;
            }

            $category = new Category();
            $category->setName($defaultCategory['name']);
            $category->setDescription($defaultCategory['description']);
            $entityManager->persist($category);
            $hasCreatedCategory = true;
        }

        if ($hasCreatedCategory) {
            $entityManager->flush();
            $categories = $categoryRepository->findBy([], ['name' => 'ASC']);
            $visibleCategories = array_values(array_filter(
                $categories,
                static fn (Category $category): bool => trim((string) $category->getName()) !== ''
            ));
        }

        return $visibleCategories;
    }

    private function isOrganizerOrAdmin(User $user): bool
    {
        $roles = $user->getRoles();

        return in_array(User::ROLE_ORGANIZER, $roles, true)
            || $user->isAdminAccount();
    }

    private function resolveOrganizerEvent(
        EventRepository $eventRepository,
        int $eventId,
        User $user
    ): ?Event {
        $event = $eventRepository->find($eventId);

        if (!$event instanceof Event) {
            return null;
        }

        if (
            !$user->isAdminAccount() &&
            $event->getOrganizer()?->getId() !== $user->getId()
        ) {
            return null;
        }

        return $event;
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

        $normalizedValue = trim($value);
        $timezone = new \DateTimeZone(self::ORGANIZER_TIMEZONE);

        try {
            $dateTime = \DateTimeImmutable::createFromFormat('Y-m-d\TH:i', $normalizedValue, $timezone)
                ?: \DateTimeImmutable::createFromFormat('Y-m-d\TH:i:s', $normalizedValue, $timezone);

            if ($dateTime instanceof \DateTimeImmutable) {
                return $dateTime;
            }

            return new \DateTimeImmutable($normalizedValue, $timezone);
        } catch (\Throwable) {
            return null;
        }
    }

    private function uploadImage(UploadedFile $file): string
    {
        return $this->imageStorage->storeUploadedImage($file, 'events', 'event');

        if (!$file->isValid()) {
            throw new \RuntimeException($this->getUploadErrorMessage($file->getError()));
        }

        $mimeType = $file->getClientMimeType() ?? '';

        if (!str_starts_with($mimeType, 'image/')) {
            throw new \RuntimeException('Le fichier envoyé doit être une image.');
        }

        $uploadDir = $this->getParameter('kernel.project_dir').'/public/uploads/events';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = preg_replace('/[^A-Za-z0-9_-]/', '-', $originalName) ?: 'image';
        $extension = pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION);

        if ('' === $extension) {
            $extension = 'bin';
        }

        $filename = uniqid('event_', true).'-'.$safeName.'.'.$extension;

        try {
            $file->move($uploadDir, $filename);
        } catch (FileException $exception) {
            throw new \RuntimeException(
                "Impossible d'enregistrer l’image envoyée pour le moment."
            );
        }

        return '/uploads/events/'.$filename;
    }

    private function uploadVideo(UploadedFile $file): string
    {
        return $this->imageStorage->storeUploadedVideo($file, 'events/videos', 'event_video');

        if (!$file->isValid()) {
            throw new \RuntimeException('La vidéo envoyée est invalide ou trop lourde.');
        }

        $mimeType = $file->getClientMimeType() ?? '';

        if (!str_starts_with($mimeType, 'video/')) {
            throw new \RuntimeException('Le fichier envoyé doit être une vidéo.');
        }

        $uploadDir = $this->getParameter('kernel.project_dir').'/public/uploads/events/videos';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = preg_replace('/[^A-Za-z0-9_-]/', '-', $originalName) ?: 'video';
        $extension = strtolower(pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION));

        if ('' === $extension) {
            $extension = 'mp4';
        }

        $filename = uniqid('event_video_', true).'-'.$safeName.'.'.$extension;

        try {
            $file->move($uploadDir, $filename);
        } catch (FileException) {
            throw new \RuntimeException(
                "Impossible d'enregistrer la vidéo envoyée pour le moment."
            );
        }

        return '/uploads/events/videos/'.$filename;
    }

    private function getUploadErrorMessage(int $errorCode): string
    {
        return match ($errorCode) {
            \UPLOAD_ERR_INI_SIZE, \UPLOAD_ERR_FORM_SIZE => 'L’image envoyée est trop lourde pour le serveur. Essaie un fichier plus léger.',
            \UPLOAD_ERR_PARTIAL => 'L’image n’a été envoyée que partiellement. Réessaie l’envoi.',
            \UPLOAD_ERR_NO_FILE => 'Aucune image n’a été envoyée. Sélectionne une image puis réessaie.',
            \UPLOAD_ERR_NO_TMP_DIR => 'Le serveur ne trouve pas le dossier temporaire pour recevoir l’image.',
            \UPLOAD_ERR_CANT_WRITE => 'Le serveur n’a pas pu enregistrer l’image envoyée.',
            \UPLOAD_ERR_EXTENSION => 'Une extension du serveur a bloqué l’envoi de l’image.',
            default => 'Le fichier image envoyé est invalide ou incomplet.',
        };
    }

    /**
     * @param array<string, mixed>|null $scanStats
     */
    private function serializeEvent(Event $event, ?array $scanStats = null): array
    {
        $serializedEvent = [
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'description' => $event->getDescription(),
            'startDatetime' => $this->formatDateTimeForFrontend($event->getStartDatetime()),
            'endDatetime' => $this->formatDateTimeForFrontend($event->getEndDatetime()),
            'capacity' => $event->getCapacity(),
            'thumbnailPhoto' => $event->getThumbnailPhoto(),
            'coverPhoto' => $event->getCoverPhoto(),
            'eventVideo' => $event->getEventVideo(),
            'status' => $event->getStatus(),
            'createdAt' => $this->formatDateTimeForFrontend($event->getCreatedAt()),
            'withdrawalFeePercent' => $event->getWithdrawalFeePercent(),
            'ticketTypesCount' => $event->getTicketTypes()->count(),
            'organizer' => [
                'id' => $event->getOrganizer()?->getId(),
                'displayName' => $event->getOrganizer()?->getDisplayName(),
                'email' => $event->getOrganizer()?->getEmail(),
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

        if (null !== $scanStats) {
            $serializedEvent['scanStats'] = $scanStats;
        }

        return $serializedEvent;
    }

    /**
     * @param array<int, array{revenueTotal: string, paidOrders: int, ticketsSold: int, currency: string}> $salesByEvent
     * @param array<int, array{total: int, valid: int, invalid: int, alreadyUsed: int}> $scansByEvent
     * @param array<string, mixed>|null $scanStats
     */
    private function serializeDashboardEvent(
        Event $event,
        array $salesByEvent,
        array $scansByEvent,
        ?array $scanStats = null
    ): array
    {
        $eventId = (int) ($event->getId() ?? 0);
        $serializedEvent = $this->serializeEvent($event, $scanStats);
        $serializedEvent['sales'] = $salesByEvent[$eventId] ?? [
            'revenueTotal' => '0.00',
            'paidOrders' => 0,
            'ticketsSold' => 0,
            'currency' => Order::DEFAULT_CURRENCY,
        ];
        $serializedEvent['scans'] = $scansByEvent[$eventId] ?? [
            'total' => 0,
            'valid' => 0,
            'invalid' => 0,
            'alreadyUsed' => 0,
        ];

        return $serializedEvent;
    }

    /**
     * @return array<int, array{revenueTotal: string, paidOrders: int, ticketsSold: int, currency: string}>
     */
    private function findOrganizerSalesByEvent(User $organizer, EntityManagerInterface $entityManager): array
    {
        $rows = $entityManager->createQueryBuilder()
            ->select('event.id AS eventId')
            ->addSelect('COUNT(DISTINCT customerOrder.id) AS paidOrders')
            ->addSelect('COALESCE(SUM(orderItem.quantity), 0) AS ticketsSold')
            ->addSelect('COALESCE(SUM(orderItem.quantity * orderItem.unitPriceAtPurchase), 0) AS revenueTotal')
            ->from(OrderItem::class, 'orderItem')
            ->innerJoin('orderItem.customerOrder', 'customerOrder')
            ->innerJoin('orderItem.ticketType', 'ticketType')
            ->innerJoin('ticketType.event', 'event')
            ->andWhere('event.organizer = :organizer')
            ->andWhere('customerOrder.status = :paidStatus')
            ->setParameter('organizer', $organizer)
            ->setParameter('paidStatus', Order::STATUS_PAID)
            ->groupBy('event.id')
            ->getQuery()
            ->getArrayResult()
        ;

        $salesByEvent = [];

        foreach ($rows as $row) {
            $eventId = (int) ($row['eventId'] ?? 0);

            if ($eventId <= 0) {
                continue;
            }

            $salesByEvent[$eventId] = [
                'revenueTotal' => number_format((float) ($row['revenueTotal'] ?? 0), 2, '.', ''),
                'paidOrders' => (int) ($row['paidOrders'] ?? 0),
                'ticketsSold' => (int) ($row['ticketsSold'] ?? 0),
                'currency' => Order::DEFAULT_CURRENCY,
            ];
        }

        return $salesByEvent;
    }

    /**
     * @return array{revenueTotal: string, paidOrders: int, ticketsSold: int}
     */
    private function findOrganizerSalesTotals(User $organizer, EntityManagerInterface $entityManager): array
    {
        $row = $entityManager->createQueryBuilder()
            ->select('COUNT(DISTINCT customerOrder.id) AS paidOrders')
            ->addSelect('COALESCE(SUM(orderItem.quantity), 0) AS ticketsSold')
            ->addSelect('COALESCE(SUM(orderItem.quantity * orderItem.unitPriceAtPurchase), 0) AS revenueTotal')
            ->from(OrderItem::class, 'orderItem')
            ->innerJoin('orderItem.customerOrder', 'customerOrder')
            ->innerJoin('orderItem.ticketType', 'ticketType')
            ->innerJoin('ticketType.event', 'event')
            ->andWhere('event.organizer = :organizer')
            ->andWhere('customerOrder.status = :paidStatus')
            ->setParameter('organizer', $organizer)
            ->setParameter('paidStatus', Order::STATUS_PAID)
            ->getQuery()
            ->getSingleResult()
        ;

        return [
            'revenueTotal' => number_format((float) ($row['revenueTotal'] ?? 0), 2, '.', ''),
            'paidOrders' => (int) ($row['paidOrders'] ?? 0),
            'ticketsSold' => (int) ($row['ticketsSold'] ?? 0),
        ];
    }

    /**
     * @return array<int, array{total: int, valid: int, invalid: int, alreadyUsed: int}>
     */
    private function findOrganizerScansByEvent(User $organizer, EntityManagerInterface $entityManager): array
    {
        $rows = $entityManager->createQueryBuilder()
            ->select('event.id AS eventId')
            ->addSelect('COUNT(checkin.id) AS total')
            ->addSelect('SUM(CASE WHEN checkin.result = :validResult THEN 1 ELSE 0 END) AS valid')
            ->addSelect('SUM(CASE WHEN checkin.result = :invalidResult THEN 1 ELSE 0 END) AS invalid')
            ->addSelect('SUM(CASE WHEN checkin.result = :alreadyUsedResult THEN 1 ELSE 0 END) AS alreadyUsed')
            ->from(Checkin::class, 'checkin')
            ->innerJoin('checkin.event', 'event')
            ->andWhere('event.organizer = :organizer')
            ->setParameter('organizer', $organizer)
            ->setParameter('validResult', Checkin::RESULT_VALID)
            ->setParameter('invalidResult', Checkin::RESULT_INVALID)
            ->setParameter('alreadyUsedResult', Checkin::RESULT_ALREADY_USED)
            ->groupBy('event.id')
            ->getQuery()
            ->getArrayResult()
        ;

        $scansByEvent = [];

        foreach ($rows as $row) {
            $eventId = (int) ($row['eventId'] ?? 0);

            if ($eventId <= 0) {
                continue;
            }

            $scansByEvent[$eventId] = [
                'total' => (int) ($row['total'] ?? 0),
                'valid' => (int) ($row['valid'] ?? 0),
                'invalid' => (int) ($row['invalid'] ?? 0),
                'alreadyUsed' => (int) ($row['alreadyUsed'] ?? 0),
            ];
        }

        return $scansByEvent;
    }

    /**
     * @return array{total: int, valid: int, invalid: int, alreadyUsed: int}
     */
    private function findOrganizerScanTotals(User $organizer, EntityManagerInterface $entityManager): array
    {
        $row = $entityManager->createQueryBuilder()
            ->select('COUNT(checkin.id) AS total')
            ->addSelect('SUM(CASE WHEN checkin.result = :validResult THEN 1 ELSE 0 END) AS valid')
            ->addSelect('SUM(CASE WHEN checkin.result = :invalidResult THEN 1 ELSE 0 END) AS invalid')
            ->addSelect('SUM(CASE WHEN checkin.result = :alreadyUsedResult THEN 1 ELSE 0 END) AS alreadyUsed')
            ->from(Checkin::class, 'checkin')
            ->innerJoin('checkin.event', 'event')
            ->andWhere('event.organizer = :organizer')
            ->setParameter('organizer', $organizer)
            ->setParameter('validResult', Checkin::RESULT_VALID)
            ->setParameter('invalidResult', Checkin::RESULT_INVALID)
            ->setParameter('alreadyUsedResult', Checkin::RESULT_ALREADY_USED)
            ->getQuery()
            ->getSingleResult()
        ;

        return [
            'total' => (int) ($row['total'] ?? 0),
            'valid' => (int) ($row['valid'] ?? 0),
            'invalid' => (int) ($row['invalid'] ?? 0),
            'alreadyUsed' => (int) ($row['alreadyUsed'] ?? 0),
        ];
    }

    /**
     * @param list<array{
     *   staffUserId: int|null,
     *   firstName: string|null,
     *   lastName: string|null,
     *   email: string|null,
     *   totalScans: int,
     *   validScans: int,
     *   invalidScans: int,
     *   alreadyUsedScans: int
     * }> $staffRows
     *
     * @return array<string, mixed>
     */
    private function serializeScanStats(array $staffRows): array
    {
        $totalScans = 0;
        $validScans = 0;
        $invalidScans = 0;
        $alreadyUsedScans = 0;
        $staffMembers = [];

        foreach ($staffRows as $row) {
            $staffTotalScans = (int) $row['totalScans'];
            $staffValidScans = (int) $row['validScans'];
            $staffInvalidScans = (int) $row['invalidScans'];
            $staffAlreadyUsedScans = (int) $row['alreadyUsedScans'];
            $displayName = trim(sprintf(
                '%s %s',
                (string) ($row['firstName'] ?? ''),
                (string) ($row['lastName'] ?? ''),
            ));

            if ('' === $displayName) {
                $displayName = (string) ($row['email'] ?? 'Membre du staff');
            }

            $totalScans += $staffTotalScans;
            $validScans += $staffValidScans;
            $invalidScans += $staffInvalidScans;
            $alreadyUsedScans += $staffAlreadyUsedScans;

            $staffMembers[] = [
                'staffUser' => [
                    'id' => $row['staffUserId'],
                    'email' => $row['email'],
                    'firstName' => $row['firstName'],
                    'lastName' => $row['lastName'],
                    'displayName' => $displayName,
                ],
                'totalScans' => $staffTotalScans,
                'validScans' => $staffValidScans,
                'invalidScans' => $staffInvalidScans,
                'alreadyUsedScans' => $staffAlreadyUsedScans,
            ];
        }

        return [
            'totalScans' => $totalScans,
            'validScans' => $validScans,
            'invalidScans' => $invalidScans,
            'alreadyUsedScans' => $alreadyUsedScans,
            'staffMembers' => $staffMembers,
        ];
    }

    private function formatDateTimeForFrontend(?\DateTimeImmutable $dateTime): ?string
    {
        if (!$dateTime instanceof \DateTimeImmutable) {
            return null;
        }

        return $dateTime
            ->setTimezone(new \DateTimeZone(self::ORGANIZER_TIMEZONE))
            ->format(DATE_ATOM);
    }

    private function normalizeOptionalDecimal(mixed $value): ?string
    {
        if (null === $value) {
            return null;
        }

        if (!is_string($value) && !is_numeric($value)) {
            return null;
        }

        $normalizedValue = str_replace(',', '.', trim((string) $value));

        if ($normalizedValue === '') {
            return null;
        }

        if (!is_numeric($normalizedValue)) {
            return null;
        }

        return number_format((float) $normalizedValue, 7, '.', '');
    }

    private function isLatitudeValid(string $latitude): bool
    {
        $value = (float) $latitude;

        return $value >= -90.0 && $value <= 90.0;
    }

    private function isLongitudeValid(string $longitude): bool
    {
        $value = (float) $longitude;

        return $value >= -180.0 && $value <= 180.0;
    }

    private function calculateAllocatedTicketStock(Event $event): int
    {
        $allocatedTicketStock = 0;

        foreach ($event->getTicketTypes() as $ticketType) {
            $allocatedTicketStock += (int) ($ticketType->getStock() ?? 0);
        }

        return $allocatedTicketStock;
    }

    private function getTicketWindowConflictMessage(
        Event $event,
        \DateTimeImmutable $startDatetime
    ): ?string {
        foreach ($event->getTicketTypes() as $ticketType) {
            $ticketSalesStartAt = $ticketType->getSalesStartAt();
            $ticketSalesEndAt = $ticketType->getSalesEndAt();

            if (
                $ticketSalesStartAt instanceof \DateTimeImmutable &&
                $ticketSalesStartAt >= $startDatetime
            ) {
                return sprintf(
                    'Le billet "%s" commence à se vendre après le nouveau début de l’évènement. Ajuste ses dates de vente ou la date de l’évènement.',
                    $ticketType->getName() ?? 'Sans nom'
                );
            }

            if (
                $ticketSalesEndAt instanceof \DateTimeImmutable &&
                $ticketSalesEndAt > $startDatetime
            ) {
                return sprintf(
                    'Le billet "%s" se vend encore après le nouveau début de l’évènement. Ajuste ses dates de vente ou la date de l’évènement.',
                    $ticketType->getName() ?? 'Sans nom'
                );
            }
        }

        return null;
    }
}
