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
    private const TIMEZONE = 'Europe/Paris';
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
            'postalCode' => $locationData['postalCode'],
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
        return [
            [
                'title' => 'Afro Urban Night',
                'category' => 'Soirée',
                'description' => 'Une nuit afro-urbaine portée par des DJ sets, des lives percussifs et une sélection dansehall, amapiano et afrobeat pensée pour lancer la saison en énergie.',
                'startsAt' => '2026-10-03 22:00:00',
                'endsAt' => '2026-10-04 04:00:00',
                'capacity' => 650,
                'location' => [
                    'address' => '19-21 Rue Boyer',
                    'city' => 'Paris',
                    'postalCode' => '75020',
                    'country' => 'France',
                    'latitude' => '48.8683000',
                    'longitude' => '2.3928000',
                ],
                'tickets' => [
                    $this->ticket('Early Bird', 'Tarif limité pour les premiers inscrits.', 19.90, 120, 4),
                    $this->ticket('Standard', 'Accès général à la soirée.', 29.90, 400, 6),
                    $this->ticket('VIP', 'Entrée prioritaire et espace réservé.', 59.90, 80, 4),
                ],
            ],
            [
                'title' => 'Paris Tech Summit',
                'category' => 'Conférence',
                'description' => 'Une journée de conférences et de retours d’expérience autour de l’IA, du produit, de la cybersécurité et des architectures cloud pour les équipes tech.',
                'startsAt' => '2026-10-08 09:00:00',
                'endsAt' => '2026-10-08 18:30:00',
                'capacity' => 1200,
                'location' => [
                    'address' => '5 Parvis Alan Turing',
                    'city' => 'Paris',
                    'postalCode' => '75013',
                    'country' => 'France',
                    'latitude' => '48.8341000',
                    'longitude' => '2.3716000',
                ],
                'tickets' => [
                    $this->ticket('Standard', 'Accès aux conférences et au village partenaires.', 149.00, 750, 6),
                    $this->ticket('Premium', 'Accès conférences, replays et espace networking.', 249.00, 250, 4),
                    $this->ticket('VIP', 'Accès complet avec déjeuner privé et rencontres speakers.', 399.00, 80, 2),
                ],
            ],
            [
                'title' => 'Lyon Food Festival',
                'category' => 'Festival',
                'description' => 'Deux jours autour des cuisines locales, de la street food créative, des démonstrations de chefs et des dégustations dans une ambiance familiale.',
                'startsAt' => '2026-10-10 11:00:00',
                'endsAt' => '2026-10-11 22:00:00',
                'capacity' => 3500,
                'location' => [
                    'address' => '20 Place Docteurs Mérieux',
                    'city' => 'Lyon',
                    'postalCode' => '69007',
                    'country' => 'France',
                    'latitude' => '45.7309000',
                    'longitude' => '4.8230000',
                ],
                'tickets' => [
                    $this->ticket('Pass journée', 'Accès au festival sur une journée au choix.', 25.00, 1600, 8),
                    $this->ticket('Pass 2 jours', 'Accès complet aux deux journées du festival.', 44.00, 1000, 6),
                    $this->ticket('VIP', 'Accès complet avec dégustation réservée.', 89.00, 250, 4),
                ],
            ],
            [
                'title' => 'Marseille Sunset Party',
                'category' => 'Soirée',
                'description' => 'Un rendez-vous coucher de soleil avec DJ house, cocktails, food court méditerranéen et vue urbaine sur les Docks de Marseille.',
                'startsAt' => '2026-10-17 19:00:00',
                'endsAt' => '2026-10-18 02:00:00',
                'capacity' => 500,
                'location' => [
                    'address' => '10 Place de la Joliette',
                    'city' => 'Marseille',
                    'postalCode' => '13002',
                    'country' => 'France',
                    'latitude' => '43.3044000',
                    'longitude' => '5.3677000',
                ],
                'tickets' => [
                    $this->ticket('Early Bird', 'Entrée à tarif réduit avant ouverture générale.', 16.00, 100, 4),
                    $this->ticket('Standard', 'Accès général à la soirée.', 24.00, 280, 6),
                    $this->ticket('VIP', 'Accès prioritaire et zone lounge.', 55.00, 40, 4),
                ],
            ],
            [
                'title' => 'Nantes Digital Meetup',
                'category' => 'Networking',
                'description' => 'Une soirée meetup pour échanger entre développeurs, designers, freelances et porteurs de projets autour des usages numériques responsables.',
                'startsAt' => '2026-10-21 18:30:00',
                'endsAt' => '2026-10-21 22:00:00',
                'capacity' => 220,
                'location' => [
                    'address' => '40 Rue La Tour d’Auvergne',
                    'city' => 'Nantes',
                    'postalCode' => '44200',
                    'country' => 'France',
                    'latitude' => '47.2046000',
                    'longitude' => '-1.5669000',
                ],
                'tickets' => [
                    $this->ticket('Standard', 'Accès meetup et moment networking.', 15.00, 150, 4),
                    $this->ticket('Étudiant', 'Tarif réduit sur justificatif étudiant.', 8.00, 40, 2),
                ],
            ],
            [
                'title' => 'Bordeaux Wine & Jazz',
                'category' => 'Concert',
                'description' => 'Une soirée jazz live accompagnée de dégustations bordelaises, avec trio instrumental, voix soul et sélection de producteurs locaux.',
                'startsAt' => '2026-10-24 20:00:00',
                'endsAt' => '2026-10-24 23:30:00',
                'capacity' => 700,
                'location' => [
                    'address' => '87 Quai des Queyries',
                    'city' => 'Bordeaux',
                    'postalCode' => '33100',
                    'country' => 'France',
                    'latitude' => '44.8498000',
                    'longitude' => '-0.5602000',
                ],
                'tickets' => [
                    $this->ticket('Standard', 'Placement libre et accès concert.', 32.00, 500, 6),
                    $this->ticket('Étudiant', 'Tarif réduit avec justificatif.', 20.00, 60, 2),
                    $this->ticket('VIP', 'Placement premium et dégustation commentée.', 75.00, 80, 4),
                ],
            ],
            [
                'title' => 'Lille E-sport Arena',
                'category' => 'Sport',
                'description' => 'Une journée e-sport avec tournois amateurs, finales sur scène, espaces de test et animations pour les communautés gaming du Nord.',
                'startsAt' => '2026-10-31 10:00:00',
                'endsAt' => '2026-10-31 23:00:00',
                'capacity' => 2000,
                'location' => [
                    'address' => '1 Boulevard des Cités Unies',
                    'city' => 'Lille',
                    'postalCode' => '59777',
                    'country' => 'France',
                    'latitude' => '50.6320000',
                    'longitude' => '3.0758000',
                ],
                'tickets' => [
                    $this->ticket('Participant', 'Inscription joueur et accès au tournoi amateur.', 35.00, 500, 1),
                    $this->ticket('Supporter', 'Accès public aux animations et finales.', 18.00, 900, 8),
                    $this->ticket('VIP', 'Accès premium, file dédiée et rencontre équipes.', 85.00, 120, 4),
                ],
            ],
            [
                'title' => 'Toulouse Startup Night',
                'category' => 'Networking',
                'description' => 'Une soirée pitchs, retours d’expérience et rencontres investisseurs pour connecter les startups régionales aux profils produit, business et tech.',
                'startsAt' => '2026-11-05 18:00:00',
                'endsAt' => '2026-11-05 23:00:00',
                'capacity' => 400,
                'location' => [
                    'address' => '55 Avenue Louis Bréguet',
                    'city' => 'Toulouse',
                    'postalCode' => '31400',
                    'country' => 'France',
                    'latitude' => '43.5683000',
                    'longitude' => '1.4838000',
                ],
                'tickets' => [
                    $this->ticket('Standard', 'Accès aux pitchs et au cocktail networking.', 24.00, 260, 4),
                    $this->ticket('Premium', 'Accès networking prioritaire et espace investisseurs.', 49.00, 80, 2),
                ],
            ],
            [
                'title' => 'Strasbourg Culture Days',
                'category' => 'Culture',
                'description' => 'Un week-end culturel entre visites guidées, performances, conférences courtes et parcours urbains autour du patrimoine européen.',
                'startsAt' => '2026-11-07 10:00:00',
                'endsAt' => '2026-11-08 18:00:00',
                'capacity' => 1200,
                'location' => [
                    'address' => '2 Place du Château',
                    'city' => 'Strasbourg',
                    'postalCode' => '67000',
                    'country' => 'France',
                    'latitude' => '48.5815000',
                    'longitude' => '7.7520000',
                ],
                'tickets' => [
                    $this->ticket('Pass journée', 'Accès à une journée de programmation.', 18.00, 500, 6),
                    $this->ticket('Pass 2 jours', 'Accès complet au week-end culturel.', 32.00, 450, 6),
                    $this->ticket('Étudiant', 'Tarif réduit pour les étudiants.', 12.00, 120, 2),
                ],
            ],
            [
                'title' => 'Nice Beach Fitness',
                'category' => 'Sport',
                'description' => 'Une matinée sportive en bord de mer avec running, mobilité, renforcement, yoga dynamique et coaching collectif accessible à tous niveaux.',
                'startsAt' => '2026-11-14 08:00:00',
                'endsAt' => '2026-11-14 14:00:00',
                'capacity' => 600,
                'location' => [
                    'address' => 'Promenade des Anglais',
                    'city' => 'Nice',
                    'postalCode' => '06000',
                    'country' => 'France',
                    'latitude' => '43.6950000',
                    'longitude' => '7.2657000',
                ],
                'tickets' => [
                    $this->ticket('Participant', 'Accès aux sessions sportives et au kit accueil.', 22.00, 520, 2),
                ],
            ],
            [
                'title' => 'Montpellier Creator Market',
                'category' => 'Atelier',
                'description' => 'Un marché de créateurs avec ateliers courts, démonstrations artisanales, stands indépendants et rencontres avec des marques locales.',
                'startsAt' => '2026-11-15 10:00:00',
                'endsAt' => '2026-11-15 19:00:00',
                'capacity' => 900,
                'location' => [
                    'address' => 'Esplanade Charles-de-Gaulle',
                    'city' => 'Montpellier',
                    'postalCode' => '34000',
                    'country' => 'France',
                    'latitude' => '43.6133000',
                    'longitude' => '3.8820000',
                ],
                'tickets' => [
                    $this->ticket('Standard', 'Accès au marché et aux ateliers ouverts.', 10.00, 700, 8),
                ],
            ],
            [
                'title' => 'Rennes Indie Concert',
                'category' => 'Concert',
                'description' => 'Une affiche indie française et européenne avec première partie locale, set principal et after acoustique dans une salle rennaise emblématique.',
                'startsAt' => '2026-11-20 20:30:00',
                'endsAt' => '2026-11-20 23:30:00',
                'capacity' => 1000,
                'location' => [
                    'address' => '1 Esplanade Charles de Gaulle',
                    'city' => 'Rennes',
                    'postalCode' => '35000',
                    'country' => 'France',
                    'latitude' => '48.1052000',
                    'longitude' => '-1.6768000',
                ],
                'tickets' => [
                    $this->ticket('Fosse', 'Accès debout proche scène.', 28.00, 600, 6),
                    $this->ticket('Gradins', 'Placement assis en gradins.', 35.00, 250, 6),
                    $this->ticket('VIP', 'Placement premium et affiche souvenir.', 70.00, 70, 4),
                ],
            ],
            [
                'title' => 'Paris Gospel Live',
                'category' => 'Concert',
                'description' => 'Un concert gospel vibrant réunissant chœur, solistes et musiciens live pour une soirée chaleureuse entre standards revisités et compositions modernes.',
                'startsAt' => '2026-11-22 17:00:00',
                'endsAt' => '2026-11-22 20:00:00',
                'capacity' => 900,
                'location' => [
                    'address' => '80 Boulevard Marguerite de Rochechouart',
                    'city' => 'Paris',
                    'postalCode' => '75018',
                    'country' => 'France',
                    'latitude' => '48.8828000',
                    'longitude' => '2.3446000',
                ],
                'tickets' => [
                    $this->ticket('Standard', 'Placement libre et accès concert.', 35.00, 720, 6),
                ],
            ],
            [
                'title' => 'Lyon Business Networking',
                'category' => 'Networking',
                'description' => 'Une soirée business autour des usages B2B, de la prospection durable et des partenariats régionaux, avec tables thématiques et cocktail.',
                'startsAt' => '2026-11-26 18:30:00',
                'endsAt' => '2026-11-26 22:30:00',
                'capacity' => 300,
                'location' => [
                    'address' => '70 Quai Perrache',
                    'city' => 'Lyon',
                    'postalCode' => '69002',
                    'country' => 'France',
                    'latitude' => '45.7419000',
                    'longitude' => '4.8174000',
                ],
                'tickets' => [
                    $this->ticket('Standard', 'Accès tables rondes et cocktail.', 29.00, 180, 3),
                    $this->ticket('Premium', 'Accès prioritaire et table matchmaking.', 65.00, 70, 2),
                ],
            ],
            [
                'title' => 'Marseille Comedy Club',
                'category' => 'Culture',
                'description' => 'Une soirée stand-up avec humoristes confirmés, nouveaux talents marseillais et plateau surprise dans un format club intimiste.',
                'startsAt' => '2026-11-28 20:00:00',
                'endsAt' => '2026-11-28 22:30:00',
                'capacity' => 350,
                'location' => [
                    'address' => '125 La Canebière',
                    'city' => 'Marseille',
                    'postalCode' => '13001',
                    'country' => 'France',
                    'latitude' => '43.2974000',
                    'longitude' => '5.3836000',
                ],
                'tickets' => [
                    $this->ticket('Standard', 'Placement libre dans la salle.', 22.00, 250, 6),
                    $this->ticket('VIP', 'Premiers rangs et rencontre artistes.', 45.00, 50, 4),
                ],
            ],
            [
                'title' => 'Lille Design Workshop',
                'category' => 'Atelier',
                'description' => 'Un atelier intensif pour apprendre à cadrer une interface, tester des parcours utilisateurs et construire un prototype clair en équipe.',
                'startsAt' => '2026-12-02 09:00:00',
                'endsAt' => '2026-12-02 17:00:00',
                'capacity' => 180,
                'location' => [
                    'address' => 'Avenue Willy Brandt',
                    'city' => 'Lille',
                    'postalCode' => '59000',
                    'country' => 'France',
                    'latitude' => '50.6369000',
                    'longitude' => '3.0750000',
                ],
                'tickets' => [
                    $this->ticket('Standard', 'Accès atelier, supports et déjeuner.', 75.00, 120, 2),
                    $this->ticket('Étudiant', 'Tarif réduit avec justificatif.', 35.00, 40, 1),
                ],
            ],
            [
                'title' => 'Nantes Electronic Night',
                'category' => 'Soirée',
                'description' => 'Une nuit électronique entre house mélodique, techno solaire et scénographie immersive dans un lieu nantais taillé pour la danse.',
                'startsAt' => '2026-12-05 22:00:00',
                'endsAt' => '2026-12-06 05:00:00',
                'capacity' => 1600,
                'location' => [
                    'address' => '21 Quai des Antilles',
                    'city' => 'Nantes',
                    'postalCode' => '44200',
                    'country' => 'France',
                    'latitude' => '47.2009000',
                    'longitude' => '-1.5738000',
                ],
                'tickets' => [
                    $this->ticket('Early Bird', 'Tarif réduit disponible en quantité limitée.', 25.00, 350, 4),
                    $this->ticket('Standard', 'Accès général à la nuit électronique.', 38.00, 900, 6),
                    $this->ticket('VIP', 'Entrée dédiée, vestiaire inclus et espace lounge.', 85.00, 180, 4),
                ],
            ],
            [
                'title' => 'Bordeaux Art Expo',
                'category' => 'Culture',
                'description' => 'Une exposition contemporaine avec artistes émergents, installations vidéo, parcours guidés et rencontres autour de la création urbaine.',
                'startsAt' => '2026-12-12 10:00:00',
                'endsAt' => '2026-12-13 18:00:00',
                'capacity' => 1100,
                'location' => [
                    'address' => '7 Rue Ferrère',
                    'city' => 'Bordeaux',
                    'postalCode' => '33000',
                    'country' => 'France',
                    'latitude' => '44.8471000',
                    'longitude' => '-0.5710000',
                ],
                'tickets' => [
                    $this->ticket('Standard', 'Accès exposition sur une journée.', 14.00, 700, 6),
                    $this->ticket('Pass complet', 'Accès aux deux jours et aux rencontres artistes.', 24.00, 250, 4),
                ],
            ],
            [
                'title' => 'Toulouse Running Challenge',
                'category' => 'Sport',
                'description' => 'Un challenge running urbain avec parcours chronométré, village sportif, animations clubs et zone récupération ouverte aux accompagnants.',
                'startsAt' => '2026-12-13 08:00:00',
                'endsAt' => '2026-12-13 13:00:00',
                'capacity' => 2500,
                'location' => [
                    'address' => '1 Allée Gabriel Biénès',
                    'city' => 'Toulouse',
                    'postalCode' => '31400',
                    'country' => 'France',
                    'latitude' => '43.5836000',
                    'longitude' => '1.4344000',
                ],
                'tickets' => [
                    $this->ticket('Participant', 'Dossard, ravitaillement et accès village sportif.', 18.00, 1400, 2),
                    $this->ticket('Supporter', 'Accès village sportif et animations.', 5.00, 700, 8),
                    $this->ticket('VIP', 'Dossard premium, zone récupération et pack souvenir.', 55.00, 100, 2),
                ],
            ],
            [
                'title' => 'Strasbourg European Talks',
                'category' => 'Conférence',
                'description' => 'Une journée de talks sur l’Europe, les médias, les transitions économiques et l’engagement citoyen, avec intervenants institutionnels et associatifs.',
                'startsAt' => '2026-12-18 09:00:00',
                'endsAt' => '2026-12-18 18:00:00',
                'capacity' => 900,
                'location' => [
                    'address' => '1 Avenue du Président Robert Schuman',
                    'city' => 'Strasbourg',
                    'postalCode' => '67000',
                    'country' => 'France',
                    'latitude' => '48.5976000',
                    'longitude' => '7.7695000',
                ],
                'tickets' => [
                    $this->ticket('Standard', 'Accès aux conférences et débats.', 95.00, 500, 5),
                    $this->ticket('Premium', 'Accès conférences, replay et déjeuner réseau.', 180.00, 250, 3),
                    $this->ticket('Étudiant', 'Tarif réduit avec justificatif.', 35.00, 100, 1),
                ],
            ],
        ];
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
