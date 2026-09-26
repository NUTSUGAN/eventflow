<?php

namespace App\Command;

use App\Entity\Category;
use App\Entity\Event;
use App\Entity\Location;
use App\Entity\TicketType;
use App\Entity\User;
use App\Repository\CategoryRepository;
use App\Repository\EventRepository;
use App\Repository\LocationRepository;
use App\Repository\UserRepository;
use App\Service\UploadedImageStorage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AsCommand(
    name: 'app:seed:demo-events',
    description: 'Crée des événements réalistes de démonstration avec médias Supabase.',
)]
final class SeedDemoEventsCommand extends Command
{
    private const TIMEZONE = 'Africa/Lome';
    private const STATUS_PUBLISHED = 'published';
    private const EVENT_MEDIA_FOLDER = 'events';
    private const PICSUM_BASE_URL = 'https://picsum.photos/seed';
    private const MIN_END_DATE = '2026-09-30 23:59:59';

    /**
     * @var array<string, Category>
     */
    private array $categoryCache = [];

    /**
     * @var array<string, Location>
     */
    private array $locationCache = [];

    /**
     * @var array<string, string>
     */
    private const CATEGORY_DESCRIPTIONS = [
        'Atelier' => 'Ateliers pratiques, masterclass et sessions guidées.',
        'Concert' => 'Concerts live, showcases et performances musicales.',
        'Conférence' => 'Conférences, talks et événements professionnels.',
        'Culture' => 'Sorties culturelles, expositions et expériences artistiques.',
        'Festival' => 'Festivals, grands rassemblements et formats multi-jours.',
        'Networking' => 'Rencontres professionnelles, échanges et soirées réseau.',
        'Soirée' => 'Soirées, clubs et événements festifs en direct.',
        'Sport' => 'Rencontres sportives, challenges et événements fitness.',
    ];

    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EventRepository $eventRepository,
        private readonly CategoryRepository $categoryRepository,
        private readonly LocationRepository $locationRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly UploadedImageStorage $imageStorage,
        private readonly HttpClientInterface $httpClient,
        #[Autowire('%env(string:SUPABASE_URL)%')]
        private readonly string $supabaseUrl = '',
        #[Autowire('%env(string:SUPABASE_STORAGE_KEY)%')]
        private readonly string $supabaseStorageKey = '',
        #[Autowire('%env(string:SUPABASE_STORAGE_BUCKET)%')]
        private readonly string $supabaseStorageBucket = 'eventflow-media',
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Simule la création sans écrire en base ni envoyer de médias.')
            ->addOption('force', null, InputOption::VALUE_NONE, 'Met à jour les événements de démonstration déjà existants au lieu de les ignorer.')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');
        $force = (bool) $input->getOption('force');
        $eventSpecs = $this->getDemoEventSpecs();

        $this->assertSpecsAreCoherent($eventSpecs);

        $organizer = $this->findSuperAdminOrganizer();

        if (!$organizer instanceof User) {
            $io->error('Aucun compte administrateur ROLE_ADMIN actif n’a été trouvé. Crée d’abord le compte super administrateur, puis relance la commande.');

            return Command::FAILURE;
        }

        if (!$dryRun && !$this->isSupabaseConfigured()) {
            $io->error('Supabase Storage n’est pas configuré. Renseigne SUPABASE_URL, SUPABASE_STORAGE_KEY et SUPABASE_STORAGE_BUCKET avant de créer les médias de démonstration.');

            return Command::FAILURE;
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $ticketTypesCreated = 0;

        if ($dryRun) {
            $io->note('Mode simulation actif : aucune écriture en base et aucun upload Supabase ne seront effectués.');
        }

        $io->title('Création des événements de démonstration EventFlow');
        $io->text(sprintf(
            'Organisateur utilisé : %s <%s> (%s)',
            $organizer->getDisplayName(),
            $organizer->getEmail(),
            $organizer->getBaseRole()
        ));

        foreach ($eventSpecs as $spec) {
            $title = $spec['title'];
            $existingEvent = $this->eventRepository->findOneBy(['title' => $title]);

            if ($existingEvent instanceof Event && !$force) {
                ++$skipped;
                $io->writeln(sprintf('<comment>Ignoré</comment> %s : déjà présent.', $title));

                continue;
            }

            if ($dryRun) {
                if ($existingEvent instanceof Event) {
                    ++$updated;
                    $io->writeln(sprintf('<info>Simulation</info> %s : serait mis à jour.', $title));
                } else {
                    ++$created;
                    $io->writeln(sprintf('<info>Simulation</info> %s : serait créé.', $title));
                }

                $ticketTypesCreated += count($spec['tickets']);

                continue;
            }

            $event = $existingEvent instanceof Event ? $existingEvent : new Event();
            $category = $this->getOrCreateCategory($spec['category']);
            $location = $this->getOrCreateLocation($spec['location']);
            $slug = $this->slugify($title);
            $thumbnailUrl = $this->downloadAndStorePicsumImage($slug.'-thumbnail', 800, 600, 'event_demo_thumbnail');
            $coverUrl = $this->downloadAndStorePicsumImage($slug.'-cover', 1600, 900, 'event_demo_cover');
            $previousThumbnail = $event->getThumbnailPhoto();
            $previousCover = $event->getCoverPhoto();

            $event
                ->setOrganizer($organizer)
                ->setCategory($category)
                ->setLocation($location)
                ->setTitle($title)
                ->setDescription($spec['description'])
                ->setStartDatetime($this->dateTime($spec['startsAt']))
                ->setEndDatetime($this->dateTime($spec['endsAt']))
                ->setCapacity($spec['capacity'])
                ->setThumbnailPhoto($thumbnailUrl)
                ->setCoverPhoto($coverUrl)
                ->setStatus(self::STATUS_PUBLISHED)
                ->setWithdrawalFeePercent('0.00')
            ;

            if (!$event->getCreatedAt() instanceof \DateTimeImmutable) {
                $event->setCreatedAt(new \DateTimeImmutable('now', $this->timezone()));
            }

            $this->entityManager->persist($event);

            if ($existingEvent instanceof Event) {
                $this->imageStorage->remove($previousThumbnail);
                $this->imageStorage->remove($previousCover);
                ++$updated;
            } else {
                ++$created;
            }

            $createdTicketTypesForEvent = $this->replaceTicketTypes($event, $spec['tickets'], $force);
            $ticketTypesCreated += $createdTicketTypesForEvent;

            $io->writeln(sprintf(
                '<info>%s</info> %s avec %d type(s) de billet créé(s).',
                $existingEvent instanceof Event ? 'Mis à jour' : 'Créé',
                $title,
                $createdTicketTypesForEvent
            ));
        }

        $this->entityManager->flush();

        $ticketSummaryVerb = $dryRun ? 'prévu(s)' : 'créé(s)';

        $io->success(sprintf(
            'Terminé : %d créé(s), %d mis à jour, %d ignoré(s), %d type(s) de billet %s.',
            $created,
            $updated,
            $skipped,
            $ticketTypesCreated,
            $ticketSummaryVerb
        ));

        return Command::SUCCESS;
    }

    private function findSuperAdminOrganizer(): ?User
    {
        foreach (['admin@eventflow.test', 'superadmin@eventflow.test'] as $email) {
            $user = $this->userRepository->findOneByEmailInsensitive($email);

            if ($user instanceof User && $user->canAuthenticate() && $user->isSuperAdminAccount()) {
                return $user;
            }
        }

        /** @var User|null $user */
        $user = $this->userRepository->createQueryBuilder('user')
            ->andWhere('user.role = :role')
            ->andWhere('user.accountStatus = :accountStatus')
            ->setParameter('role', User::ROLE_ADMIN)
            ->setParameter('accountStatus', User::ACCOUNT_STATUS_ACTIVE)
            ->orderBy('user.id', 'ASC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult()
        ;

        return $user;
    }

    private function getOrCreateCategory(string $name): Category
    {
        $normalizedName = mb_strtolower(trim($name));

        if ([] === $this->categoryCache) {
            foreach ($this->categoryRepository->findAll() as $category) {
                $existingName = mb_strtolower(trim((string) $category->getName()));

                if ('' !== $existingName) {
                    $this->categoryCache[$existingName] = $category;
                }
            }
        }

        if (isset($this->categoryCache[$normalizedName])) {
            return $this->categoryCache[$normalizedName];
        }

        $category = new Category();
        $category
            ->setName($name)
            ->setDescription(self::CATEGORY_DESCRIPTIONS[$name] ?? 'Catégorie de démonstration EventFlow.')
        ;

        $this->entityManager->persist($category);
        $this->categoryCache[$normalizedName] = $category;

        return $category;
    }

    /**
     * @param array{address: string, city: string, postalCode: string, country: string, latitude: string, longitude: string} $locationData
     */
    private function getOrCreateLocation(array $locationData): Location
    {
        $locationCacheKey = mb_strtolower(sprintf(
            '%s|%s|%s',
            trim($locationData['address']),
            trim($locationData['postalCode']),
            trim($locationData['city'])
        ));

        if (isset($this->locationCache[$locationCacheKey])) {
            return $this->locationCache[$locationCacheKey];
        }

        $location = $this->locationRepository->findOneBy([
            'address' => $locationData['address'],
            'city' => $locationData['city'],
            'postalCode' => '' === $locationData['postalCode'] ? null : $locationData['postalCode'],
        ]);

        if ($location instanceof Location) {
            $this->locationCache[$locationCacheKey] = $location;

            return $location;
        }

        $location = new Location();
        $location
            ->setAddress($locationData['address'])
            ->setCity($locationData['city'])
            ->setPostalCode($locationData['postalCode'])
            ->setCountry($locationData['country'])
            ->setLatitude($locationData['latitude'])
            ->setLongitude($locationData['longitude'])
        ;

        $this->entityManager->persist($location);
        $this->locationCache[$locationCacheKey] = $location;

        return $location;
    }

    /**
     * @param list<array{name: string, description: string, price: float, stock: int, maxPerOrder: int}> $ticketSpecs
     */
    private function replaceTicketTypes(Event $event, array $ticketSpecs, bool $force): int
    {
        $existingTicketTypes = $event->getTicketTypes()->toArray();

        if ([] !== $existingTicketTypes) {
            if (!$force) {
                return 0;
            }

            foreach ($existingTicketTypes as $ticketType) {
                if (!$ticketType->getOrderItems()->isEmpty() || !$ticketType->getTickets()->isEmpty()) {
                    return 0;
                }
            }

            foreach ($existingTicketTypes as $ticketType) {
                $event->removeTicketType($ticketType);
                $this->entityManager->remove($ticketType);
            }
        }

        $created = 0;
        $startDatetime = $event->getStartDatetime();

        if (!$startDatetime instanceof \DateTimeImmutable) {
            return 0;
        }

        foreach ($ticketSpecs as $ticketSpec) {
            $ticketType = new TicketType();
            $ticketType
                ->setEvent($event)
                ->setName($ticketSpec['name'])
                ->setDescription($ticketSpec['description'])
                ->setPrice(number_format($ticketSpec['price'], 2, '.', ''))
                ->setStock($ticketSpec['stock'])
                ->setSalesStartAt($this->resolveTicketSaleStartAt($startDatetime))
                ->setSalesEndAt($this->resolveTicketSaleEndAt($startDatetime, $ticketSpec['name']))
                ->setMaxPerOrder($ticketSpec['maxPerOrder'])
                ->setIsActive(true)
                ->setCreatedAt(new \DateTimeImmutable('now', $this->timezone()))
            ;

            $this->entityManager->persist($ticketType);
            ++$created;
        }

        return $created;
    }

    private function downloadAndStorePicsumImage(string $seed, int $width, int $height, string $fallbackName): string
    {
        $url = sprintf('%s/%s/%d/%d', self::PICSUM_BASE_URL, rawurlencode($seed), $width, $height);
        $temporaryPath = tempnam(sys_get_temp_dir(), 'eventflow_demo_');

        if (!is_string($temporaryPath)) {
            throw new \RuntimeException('Impossible de créer un fichier temporaire pour télécharger l’image de démonstration.');
        }

        try {
            $response = $this->httpClient->request('GET', $url, [
                'max_redirects' => 5,
                'timeout' => 30,
            ]);

            if ($response->getStatusCode() >= 400) {
                throw new \RuntimeException('Picsum a refusé le téléchargement de l’image de démonstration.');
            }

            $contents = $response->getContent();

            if ('' === $contents || false === file_put_contents($temporaryPath, $contents)) {
                throw new \RuntimeException('Impossible d’écrire l’image de démonstration temporaire.');
            }

            $uploadedFile = new UploadedFile(
                $temporaryPath,
                $seed.'.jpg',
                'image/jpeg',
                null,
                true
            );

            return $this->imageStorage->storeUploadedImage($uploadedFile, self::EVENT_MEDIA_FOLDER, $fallbackName);
        } finally {
            if (is_file($temporaryPath)) {
                unlink($temporaryPath);
            }
        }
    }

    private function resolveTicketSaleStartAt(\DateTimeImmutable $eventStartAt): \DateTimeImmutable
    {
        $saleStartAt = $eventStartAt->modify('-90 days')->setTime(9, 0);
        $now = new \DateTimeImmutable('now', $this->timezone());

        if ($saleStartAt < $now) {
            return $now;
        }

        return $saleStartAt;
    }

    private function resolveTicketSaleEndAt(\DateTimeImmutable $eventStartAt, string $ticketName): \DateTimeImmutable
    {
        if (str_contains(mb_strtolower($ticketName), 'early bird')) {
            return $eventStartAt->modify('-30 days')->setTime(23, 59);
        }

        return $eventStartAt->modify('-2 hours');
    }

    /**
     * @param list<array{
     *     title: string,
     *     category: string,
     *     description: string,
     *     startsAt: string,
     *     endsAt: string,
     *     capacity: int,
     *     location: array{address: string, city: string, postalCode: string, country: string, latitude: string, longitude: string},
     *     tickets: list<array{name: string, description: string, price: float, stock: int, maxPerOrder: int}>
     * }> $eventSpecs
     */
    private function assertSpecsAreCoherent(array $eventSpecs): void
    {
        $minimumEndDate = $this->dateTime(self::MIN_END_DATE);

        foreach ($eventSpecs as $spec) {
            $startAt = $this->dateTime($spec['startsAt']);
            $endAt = $this->dateTime($spec['endsAt']);

            if ($endAt <= $startAt) {
                throw new \LogicException(sprintf('La date de fin de "%s" doit être postérieure à sa date de début.', $spec['title']));
            }

            if ($endAt <= $minimumEndDate) {
                throw new \LogicException(sprintf('La date de fin de "%s" doit être strictement postérieure au 30 septembre 2026.', $spec['title']));
            }

            $stockTotal = 0;

            foreach ($spec['tickets'] as $ticketSpec) {
                if ($ticketSpec['price'] < 0 || $ticketSpec['stock'] < 0) {
                    throw new \LogicException(sprintf('Le billet "%s" de "%s" contient un prix ou un stock invalide.', $ticketSpec['name'], $spec['title']));
                }

                $stockTotal += $ticketSpec['stock'];
            }

            if ($stockTotal > $spec['capacity']) {
                throw new \LogicException(sprintf('Le stock total des billets de "%s" dépasse la capacité de l’événement.', $spec['title']));
            }
        }
    }

    private function isSupabaseConfigured(): bool
    {
        return '' !== trim($this->supabaseUrl)
            && '' !== trim($this->supabaseStorageKey)
            && '' !== trim($this->supabaseStorageBucket);
    }

    private function dateTime(string $value): \DateTimeImmutable
    {
        return new \DateTimeImmutable($value, $this->timezone());
    }

    private function timezone(): \DateTimeZone
    {
        return new \DateTimeZone(self::TIMEZONE);
    }

    private function slugify(string $value): string
    {
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        $slug = preg_replace('/[^A-Za-z0-9]+/', '-', false !== $ascii ? $ascii : $value) ?: 'eventflow-demo';
        $slug = trim(strtolower($slug), '-');

        return '' !== $slug ? $slug : 'eventflow-demo';
    }

    /**
     * @return list<array{
     *     title: string,
     *     category: string,
     *     description: string,
     *     startsAt: string,
     *     endsAt: string,
     *     capacity: int,
     *     location: array{address: string, city: string, postalCode: string, country: string, latitude: string, longitude: string},
     *     tickets: list<array{name: string, description: string, price: float, stock: int, maxPerOrder: int}>
     * }>
     */
    private function getDemoEventSpecs(): array
    {
        $examples = [
            ['Lomé', 'Concert', 'Concert découverte', 5000],
            ['Adidogomé', 'Soirée', 'Soirée des rencontres', 3000],
            ['Kara', 'Culture', 'Rencontres culturelles', 2000],
            ['Kpalimé', 'Atelier', 'Atelier créatif', 2500],
            ['Sokodé', 'Sport', 'Journée sportive', 1000],
            ['Atakpamé', 'Conférence', 'Rencontres numériques', 4000],
        ];
        $base = $this->dateTime('first day of next month')->setTime(18, 0);
        if ($base <= $this->dateTime(self::MIN_END_DATE)) {
            $base = $this->dateTime('2026-10-01 18:00:00');
        }
        return array_map(function (array $example, int $index) use ($base): array {
            [$city, $category, $title, $price] = $example;
            $start = $base->modify('+'.($index * 3 + 2).' days');
            return [
                'title' => '[DÉMO] '.$title.' - '.$city,
                'category' => $category,
                'description' => 'Événement fictif de démonstration EventFlow au Togo. Aucun événement réel ni accès payant ne correspond à cette annonce.',
                'startsAt' => $start->format('Y-m-d H:i:s'),
                'endsAt' => $start->modify('+4 hours')->format('Y-m-d H:i:s'),
                'capacity' => 100,
                'location' => [
                    'address' => 'Lieu fictif de démonstration',
                    'city' => $city, 'postalCode' => '', 'country' => 'Togo',
                    'latitude' => null, 'longitude' => null,
                ],
                'tickets' => [
                    $this->ticket('Standard démo', 'Billet fictif, sans accès à un événement réel.', $price, 80, 4),
                    $this->ticket('Invitation démo', 'Invitation fictive de démonstration.', 0, 20, 1),
                ],
            ];
        }, $examples, array_keys($examples));
    }

    /**
     * @return array{name: string, description: string, price: float, stock: int, maxPerOrder: int}
     */
    private function ticket(string $name, string $description, float $price, int $stock, int $maxPerOrder): array
    {
        return [
            'name' => $name,
            'description' => $description,
            'price' => $price,
            'stock' => $stock,
            'maxPerOrder' => $maxPerOrder,
        ];
    }
}
