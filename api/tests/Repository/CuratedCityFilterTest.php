<?php

namespace App\Tests\Repository;

use App\Entity\{Category, City, Event, Location, User};
use App\Repository\EventRepository;
use Doctrine\DBAL\DriverManager;
use Doctrine\ORM\{EntityManager, ORMSetup};
use Doctrine\ORM\Tools\SchemaTool;
use Doctrine\Persistence\ManagerRegistry;
use PHPUnit\Framework\TestCase;

final class CuratedCityFilterTest extends TestCase
{
    public function testOnlyExplicitLinksAreFilterableByIdOrLegacyName(): void
    {
        $config = ORMSetup::createAttributeMetadataConfiguration([dirname(__DIR__, 2).'/src/Entity'], true);
        $em = new EntityManager(DriverManager::getConnection(['driver' => 'pdo_sqlite', 'memory' => true]), $config);
        (new SchemaTool($em))->createSchema($em->getMetadataFactory()->getAllMetadata());
        $registry = $this->createMock(ManagerRegistry::class);
        $registry->method('getManagerForClass')->willReturn($em);
        $repository = new EventRepository($registry);
        $city = (new City())->setName('Lomé');
        $em->persist($city);
        $user = (new User())->setFirstName('Test')->setLastName('Test')->setEmail('city-test@example.test')->setPasswordHash('unused')->setRole('organizer')->setCreatedAt(new \DateTimeImmutable());
        $category = (new Category())->setName('Test')->setDescription('Test');
        $em->persist($user); $em->persist($category);
        foreach ([true, false] as $linked) {
            $location = (new Location())->setCity('Lomé')->setCountry('Togo')->setAddress('Lieu test')->setPostalCode(null);
            if ($linked) { $location->setManagedCity($city); }
            $em->persist($location);
            $event = (new Event())->setTitle($linked ? 'Officiel' : 'Libre')->setDescription('Test')
                ->setOrganizer($user)->setCategory($category)->setLocation($location)->setStatus('published')
                ->setStartDatetime(new \DateTimeImmutable('+1 day'))->setEndDatetime(new \DateTimeImmutable('+2 days'))
                ->setCapacity(10)->setThumbnailPhoto('test.png')->setCoverPhoto('test.png')->setCreatedAt(new \DateTimeImmutable());
            $em->persist($event);
        }
        $em->flush();
        self::assertSame(1, $repository->countPublicList(city: (string) $city->getId()));
        self::assertSame(1, $repository->countPublicList(city: 'Lomé'));
        self::assertSame(2, $repository->countPublicList(search: 'Lomé'));
        self::assertSame([['id' => $city->getId(), 'name' => 'Lomé']], $repository->findPublicCityFilters());
        $city->setName('Renommée'); $em->flush();
        self::assertSame(1, $repository->countPublicList(city: (string) $city->getId()));
        self::assertSame(1, $repository->countPublicList(search: 'Renommée'));
        $city->setActive(false); $em->flush();
        self::assertSame([], $repository->findPublicCityFilters());
        self::assertSame(0, $repository->countPublicList(city: (string) $city->getId()));
        self::assertSame(2, $repository->countPublicList());
        $em->close();
    }
}
