<?php

namespace App\Tests\Service;

use App\Entity\City;
use App\Entity\Location;
use App\Service\CitySelection;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

final class CitySelectionTest extends TestCase
{
    public function testFreeTextNeverAutomaticallyLinksEvenWithIdenticalName(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects(self::never())->method('find');
        self::assertNull((new CitySelection($em))->resolve(['locationCity' => 'Lomé', 'locationCityId' => '']));
    }

    public function testInactiveCityCannotBeNewlySelected(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('find')->willReturn((new City())->setName('Lomé')->setActive(false));
        $this->expectException(\InvalidArgumentException::class);
        (new CitySelection($em))->resolve(['locationCityId' => '1']);
    }

    public function testRenameChangesDisplayWhileUnlinkPreservesOriginalText(): void
    {
        $city = (new City())->setName('Lomé');
        $location = (new Location())->setCity('Ancien nom')->setManagedCity($city)->setPostalCode('');
        $city->setName('Nouveau nom');
        self::assertSame('Nouveau nom', $location->getCity());
        self::assertNull($location->getPostalCode());
        $location->setManagedCity(null);
        self::assertSame('Ancien nom', $location->getCity());
    }
}
