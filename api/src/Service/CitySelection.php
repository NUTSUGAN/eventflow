<?php

namespace App\Service;

use App\Entity\City;
use App\Entity\Location;
use Doctrine\ORM\EntityManagerInterface;

final class CitySelection
{
    public function __construct(private readonly EntityManagerInterface $em) {}

    public function resolve(array $data, ?Location $existing = null): ?City
    {
        if (!array_key_exists('locationCityId', $data)) {
            return $existing?->getManagedCity();
        }
        $id = trim((string) ($data['locationCityId'] ?? ''));
        if ('' === $id) { return null; }
        $city = ctype_digit($id) ? $this->em->find(City::class, (int) $id) : null;
        if (!$city instanceof City || (!$city->isActive() && ($existing?->getManagedCity() === null || $existing->getManagedCity()->getId() !== $city->getId()))) {
            throw new \InvalidArgumentException('La ville sélectionnée est indisponible.');
        }
        return $city;
    }
}
