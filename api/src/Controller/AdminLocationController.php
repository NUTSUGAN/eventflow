<?php

namespace App\Controller;

use App\Entity\Location;
use App\Repository\LocationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/locations')]
#[IsGranted('ROLE_ADMIN_SUPPORT')]
class AdminLocationController extends AbstractController
{
    #[Route('', name: 'api_admin_location_index', methods: ['GET'])]
    public function index(LocationRepository $locationRepository): JsonResponse
    {
        $locations = $locationRepository->findBy([], ['id' => 'DESC']);

        $data = array_map(
            fn (Location $location) => $this->serializeLocation($location),
            $locations
        );

        return $this->json($data);
    }

    #[Route('/{id}', name: 'api_admin_location_show', methods: ['GET'])]
    public function show(Location $location): JsonResponse
    {
        return $this->json($this->serializeLocation($location));
    }

    #[Route('', name: 'api_admin_location_create', methods: ['POST'])]
    public function create(
        Request $request,
        LocationRepository $locationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $data = $request->toArray();

        $address = trim((string) ($data['address'] ?? ''));
        $city = trim((string) ($data['city'] ?? ''));
        $postalCode = trim((string) ($data['postalCode'] ?? ''));
        $country = trim((string) ($data['country'] ?? ''));
        $latitude = trim((string) ($data['latitude'] ?? ''));
        $longitude = trim((string) ($data['longitude'] ?? ''));

        if (
            $address === '' ||
            $city === '' ||
            $postalCode === '' ||
            $country === '' ||
            $latitude === '' ||
            $longitude === ''
        ) {
            return $this->json([
                'message' => 'Tous les champs sont obligatoires.'
            ], 400);
        }

        if (!is_numeric($latitude) || !is_numeric($longitude)) {
            return $this->json([
                'message' => 'La latitude et la longitude doivent être numériques.'
            ], 400);
        }

        $existingLocation = $locationRepository->findOneBy([
            'address' => $address,
            'city' => $city,
            'postalCode' => $postalCode,
            'country' => $country,
        ]);

        if ($existingLocation) {
            return $this->json([
                'message' => 'Un lieu avec ces informations existe déjà.'
            ], 409);
        }

        $location = new Location();
        $location->setAddress($address);
        $location->setCity($city);
        $location->setPostalCode($postalCode);
        $location->setCountry($country);
        $location->setLatitude($latitude);
        $location->setLongitude($longitude);

        $entityManager->persist($location);
        $entityManager->flush();

        return $this->json([
            'message' => 'Lieu créé avec succès.',
            'location' => $this->serializeLocation($location)
        ], 201);
    }

    #[Route('/{id}', name: 'api_admin_location_update', methods: ['PATCH'])]
    public function update(
        Location $location,
        Request $request,
        LocationRepository $locationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $data = $request->toArray();

        $address = $location->getAddress();
        $city = $location->getCity();
        $postalCode = $location->getPostalCode();
        $country = $location->getCountry();

        if (array_key_exists('address', $data)) {
            $newAddress = trim((string) $data['address']);

            if ($newAddress === '') {
                return $this->json([
                    'message' => 'L’adresse ne peut pas être vide.'
                ], 400);
            }

            $location->setAddress($newAddress);
            $address = $newAddress;
        }

        if (array_key_exists('city', $data)) {
            $newCity = trim((string) $data['city']);

            if ($newCity === '') {
                return $this->json([
                    'message' => 'La ville ne peut pas être vide.'
                ], 400);
            }

            $location->setCity($newCity);
            $city = $newCity;
        }

        if (array_key_exists('postalCode', $data)) {
            $newPostalCode = trim((string) $data['postalCode']);

            if ($newPostalCode === '') {
                return $this->json([
                    'message' => 'Le code postal ne peut pas être vide.'
                ], 400);
            }

            $location->setPostalCode($newPostalCode);
            $postalCode = $newPostalCode;
        }

        if (array_key_exists('country', $data)) {
            $newCountry = trim((string) $data['country']);

            if ($newCountry === '') {
                return $this->json([
                    'message' => 'Le pays ne peut pas être vide.'
                ], 400);
            }

            $location->setCountry($newCountry);
            $country = $newCountry;
        }

        if (array_key_exists('latitude', $data)) {
            $newLatitude = trim((string) $data['latitude']);

            if ($newLatitude === '' || !is_numeric($newLatitude)) {
                return $this->json([
                    'message' => 'La latitude doit être une valeur numérique non vide.'
                ], 400);
            }

            $location->setLatitude($newLatitude);
        }

        if (array_key_exists('longitude', $data)) {
            $newLongitude = trim((string) $data['longitude']);

            if ($newLongitude === '' || !is_numeric($newLongitude)) {
                return $this->json([
                    'message' => 'La longitude doit être une valeur numérique non vide.'
                ], 400);
            }

            $location->setLongitude($newLongitude);
        }

        $existingLocation = $locationRepository->findOneBy([
            'address' => $address,
            'city' => $city,
            'postalCode' => $postalCode,
            'country' => $country,
        ]);

        if ($existingLocation && $existingLocation->getId() !== $location->getId()) {
            return $this->json([
                'message' => 'Un lieu avec ces informations existe déjà.'
            ], 409);
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Lieu mis à jour avec succès.',
            'location' => $this->serializeLocation($location)
        ]);
    }

    #[Route('/{id}', name: 'api_admin_location_delete', methods: ['DELETE'])]
    public function delete(
        Location $location,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        if (!$location->getEvents()->isEmpty()) {
            return $this->json([
                'message' => 'Impossible de supprimer un lieu déjà lié à des événements.'
            ], 409);
        }

        $entityManager->remove($location);
        $entityManager->flush();

        return $this->json([
            'message' => 'Lieu supprimé avec succès.'
        ]);
    }

    private function serializeLocation(Location $location): array
    {
        return [
            'id' => $location->getId(),
            'address' => $location->getAddress(),
            'city' => $location->getCity(),
            'postalCode' => $location->getPostalCode(),
            'country' => $location->getCountry(),
            'latitude' => $location->getLatitude(),
            'longitude' => $location->getLongitude(),
        ];
    }
}
