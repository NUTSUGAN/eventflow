<?php

namespace App\Controller;

use App\Entity\City;
use App\Entity\Location;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final class CityController extends AbstractController
{
    #[Route('/api/cities', methods: ['GET'])]
    public function publicList(EntityManagerInterface $em): JsonResponse
    {
        return $this->json(array_map(fn (City $city) => $city->toArray(), $em->getRepository(City::class)->findBy(['active' => true], ['name' => 'ASC'])));
    }

    #[Route('/api/admin/cities', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN_SUPPORT')]
    public function index(EntityManagerInterface $em): JsonResponse
    {
        return $this->json(array_map(fn (City $city) => $city->toArray(), $em->getRepository(City::class)->findBy([], ['name' => 'ASC'])));
    }

    #[Route('/api/admin/cities', methods: ['POST'])]
    #[Route('/api/admin/cities/{id<\d+>}', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN_SUPPORT')]
    public function save(Request $request, EntityManagerInterface $em, ?int $id = null): JsonResponse
    {
        $city = null === $id ? new City() : $em->find(City::class, $id);
        if (!$city instanceof City) { return $this->json(['message' => 'Ville introuvable.'], 404); }
        $data = $request->toArray();
        try {
            $city->setName((string) ($data['name'] ?? $city->getName()));
            if (array_key_exists('active', $data)) {
                if (!is_bool($data['active'])) { throw new \InvalidArgumentException('Le statut doit être un booléen.'); }
                $city->setActive($data['active']);
            }
            $em->persist($city);
            $em->flush();
        } catch (\InvalidArgumentException $e) {
            return $this->json(['message' => $e->getMessage()], 400);
        } catch (UniqueConstraintViolationException) {
            return $this->json(['message' => 'Cette ville existe déjà.'], 409);
        }
        return $this->json($city->toArray(), null === $id ? 201 : 200);
    }

    #[Route('/api/admin/cities/{id<\d+>}', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN_SUPPORT')]
    public function delete(int $id, EntityManagerInterface $em): JsonResponse
    {
        $city = $em->find(City::class, $id);
        if (!$city instanceof City) { return $this->json(['message' => 'Ville introuvable.'], 404); }
        if ($em->getRepository(Location::class)->count(['managedCity' => $city]) > 0) {
            return $this->json(['message' => 'Cette ville est liée à des lieux. Désactive-la si elle ne doit plus être proposée.'], 409);
        }
        $em->remove($city);
        $em->flush();
        return new JsonResponse(null, 204);
    }

    #[Route('/api/admin/city-locations', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN_SUPPORT')]
    public function locations(EntityManagerInterface $em): JsonResponse
    {
        $locations = $em->getRepository(Location::class)->findBy(['managedCity' => null], ['city' => 'ASC']);
        return $this->json(array_map(fn (Location $location) => [
            'id' => $location->getId(), 'name' => $location->getCity(), 'address' => $location->getAddress(),
            'country' => $location->getCountry(), 'eventCount' => $location->getEvents()->count(),
        ], $locations));
    }

    #[Route('/api/admin/city-locations/{id<\d+>}', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN_SUPPORT')]
    public function assign(int $id, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $location = $em->find(Location::class, $id);
        $cityId = $request->toArray()['cityId'] ?? null;
        $city = is_numeric($cityId) ? $em->find(City::class, (int) $cityId) : null;
        if (!$location instanceof Location) { return $this->json(['message' => 'Lieu introuvable.'], 404); }
        if (!$city instanceof City || !$city->isActive()) { return $this->json(['message' => 'Choisis une ville active.'], 400); }
        $location->setManagedCity($city);
        $em->flush();
        return $this->json(['message' => 'Lieu rattaché à la ville.']);
    }
}
