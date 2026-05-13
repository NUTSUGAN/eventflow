<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\TicketType;
use App\Entity\User;
use App\Repository\EventRepository;
use App\Repository\TicketTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/organizer')]
class OrganizerTicketTypeController extends AbstractController
{
    #[Route('/events/{eventId}/ticket-types', name: 'api_organizer_ticket_type_create', methods: ['POST'])]
    public function create(
        int $eventId,
        Request $request,
        EventRepository $eventRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], 401);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Acces reserve aux organisateurs ou administrateurs.',
            ], 403);
        }

        $event = $eventRepository->find($eventId);

        if (!$event instanceof Event) {
            return $this->json([
                'message' => 'Evenement introuvable.',
            ], 404);
        }

        if (!$this->canManageEvent($user, $event)) {
            return $this->json([
                'message' => 'Vous ne pouvez gerer que les billets de vos propres evenements.',
            ], 403);
        }

        $data = $request->toArray();

        $name = trim((string) ($data['name'] ?? ''));
        $description = array_key_exists('description', $data) ? trim((string) $data['description']) : null;
        $price = $data['price'] ?? null;
        $stock = $data['stock'] ?? null;
        $salesStartAtRaw = $data['salesStartAt'] ?? null;
        $salesEndAtRaw = $data['salesEndAt'] ?? null;
        $maxPerOrder = $data['maxPerOrder'] ?? null;
        $isActive = array_key_exists('isActive', $data) ? (bool) $data['isActive'] : true;

        if ($name === '' || $price === null || $stock === null || $salesStartAtRaw === null || $salesEndAtRaw === null) {
            return $this->json([
                'message' => 'Les champs name, price, stock, salesStartAt et salesEndAt sont obligatoires.',
            ], 400);
        }

        if (!is_numeric($price) || (float) $price < 0) {
            return $this->json([
                'message' => 'Le prix doit etre un nombre positif ou nul.',
            ], 400);
        }

        if (!is_numeric($stock) || (int) $stock < 0) {
            return $this->json([
                'message' => 'Le stock doit etre un entier positif ou nul.',
            ], 400);
        }

        if ($maxPerOrder !== null && (!is_numeric($maxPerOrder) || (int) $maxPerOrder <= 0)) {
            return $this->json([
                'message' => 'maxPerOrder doit etre un entier strictement positif.',
            ], 400);
        }

        try {
            $salesStartAt = new \DateTimeImmutable((string) $salesStartAtRaw);
            $salesEndAt = new \DateTimeImmutable((string) $salesEndAtRaw);
        } catch (\Throwable) {
            return $this->json([
                'message' => 'Format de date invalide pour salesStartAt ou salesEndAt.',
            ], 400);
        }

        if ($salesStartAt >= $salesEndAt) {
            return $this->json([
                'message' => 'La date de debut de vente doit etre avant la date de fin de vente.',
            ], 400);
        }

        $ticketType = new TicketType();
        $ticketType->setEvent($event);
        $ticketType->setName($name);
        $ticketType->setDescription($description !== '' ? $description : null);
        $ticketType->setPrice((string) $price);
        $ticketType->setStock((int) $stock);
        $ticketType->setSalesStartAt($salesStartAt);
        $ticketType->setSalesEndAt($salesEndAt);
        $ticketType->setIsActive($isActive);
        $ticketType->setCreatedAt(new \DateTimeImmutable());

        if ($maxPerOrder !== null) {
            $ticketType->setMaxPerOrder((int) $maxPerOrder);
        }

        $entityManager->persist($ticketType);
        $entityManager->flush();

        return $this->json([
            'message' => 'Billet cree avec succes.',
            'ticketType' => $this->serializeTicketType($ticketType),
        ], 201);
    }

    #[Route('/events/{eventId}/ticket-types', name: 'api_organizer_ticket_type_index', methods: ['GET'])]
    public function index(
        int $eventId,
        EventRepository $eventRepository,
        TicketTypeRepository $ticketTypeRepository
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], 401);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Acces reserve aux organisateurs ou administrateurs.',
            ], 403);
        }

        $event = $eventRepository->find($eventId);

        if (!$event instanceof Event) {
            return $this->json([
                'message' => 'Evenement introuvable.',
            ], 404);
        }

        if (!$this->canManageEvent($user, $event)) {
            return $this->json([
                'message' => 'Vous ne pouvez consulter que les billets de vos propres evenements.',
            ], 403);
        }

        $ticketTypes = $ticketTypeRepository->findBy(
            ['event' => $event],
            ['id' => 'DESC']
        );

        $data = array_map(
            fn (TicketType $ticketType) => $this->serializeTicketType($ticketType),
            $ticketTypes
        );

        return $this->json($data);
    }

    #[Route('/ticket-types/{id}', name: 'api_organizer_ticket_type_update', methods: ['PATCH'])]
    public function update(
        int $id,
        Request $request,
        TicketTypeRepository $ticketTypeRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], 401);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Acces reserve aux organisateurs ou administrateurs.',
            ], 403);
        }

        $ticketType = $ticketTypeRepository->find($id);

        if (!$ticketType instanceof TicketType) {
            return $this->json([
                'message' => 'Billet introuvable.',
            ], 404);
        }

        if (!$this->canManageTicketType($user, $ticketType)) {
            return $this->json([
                'message' => 'Vous ne pouvez modifier que les billets de vos propres evenements.',
            ], 403);
        }

        $data = $request->toArray();

        if (array_key_exists('name', $data)) {
            $name = trim((string) $data['name']);

            if ($name === '') {
                return $this->json([
                    'message' => 'Le nom ne peut pas etre vide.',
                ], 400);
            }

            $ticketType->setName($name);
        }

        if (array_key_exists('description', $data)) {
            $description = trim((string) $data['description']);
            $ticketType->setDescription($description !== '' ? $description : null);
        }

        if (array_key_exists('price', $data)) {
            $price = $data['price'];

            if (!is_numeric($price) || (float) $price < 0) {
                return $this->json([
                    'message' => 'Le prix doit etre un nombre positif ou nul.',
                ], 400);
            }

            $ticketType->setPrice((string) $price);
        }

        if (array_key_exists('stock', $data)) {
            $stock = $data['stock'];

            if (!is_numeric($stock) || (int) $stock < 0) {
                return $this->json([
                    'message' => 'Le stock doit etre un entier positif ou nul.',
                ], 400);
            }

            $ticketType->setStock((int) $stock);
        }

        if (array_key_exists('maxPerOrder', $data)) {
            $maxPerOrder = $data['maxPerOrder'];

            if ($maxPerOrder !== null && (!is_numeric($maxPerOrder) || (int) $maxPerOrder <= 0)) {
                return $this->json([
                    'message' => 'maxPerOrder doit etre un entier strictement positif.',
                ], 400);
            }

            $ticketType->setMaxPerOrder($maxPerOrder !== null ? (int) $maxPerOrder : null);
        }

        if (array_key_exists('isActive', $data)) {
            $ticketType->setIsActive((bool) $data['isActive']);
        }

        $salesStartAt = $ticketType->getSalesStartAt();
        $salesEndAt = $ticketType->getSalesEndAt();

        if (array_key_exists('salesStartAt', $data)) {
            try {
                $salesStartAt = new \DateTimeImmutable((string) $data['salesStartAt']);
            } catch (\Throwable) {
                return $this->json([
                    'message' => 'Format invalide pour salesStartAt.',
                ], 400);
            }

            $ticketType->setSalesStartAt($salesStartAt);
        }

        if (array_key_exists('salesEndAt', $data)) {
            try {
                $salesEndAt = new \DateTimeImmutable((string) $data['salesEndAt']);
            } catch (\Throwable) {
                return $this->json([
                    'message' => 'Format invalide pour salesEndAt.',
                ], 400);
            }

            $ticketType->setSalesEndAt($salesEndAt);
        }

        if ($salesStartAt >= $salesEndAt) {
            return $this->json([
                'message' => 'La date de debut de vente doit etre avant la date de fin de vente.',
            ], 400);
        }

        $entityManager->flush();

        return $this->json([
            'message' => 'Billet mis a jour avec succes.',
            'ticketType' => $this->serializeTicketType($ticketType),
        ]);
    }

    #[Route('/ticket-types/{id}', name: 'api_organizer_ticket_type_delete', methods: ['DELETE'])]
    public function delete(
        int $id,
        TicketTypeRepository $ticketTypeRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], 401);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Acces reserve aux organisateurs ou administrateurs.',
            ], 403);
        }

        $ticketType = $ticketTypeRepository->find($id);

        if (!$ticketType instanceof TicketType) {
            return $this->json([
                'message' => 'Billet introuvable.',
            ], 404);
        }

        if (!$this->canManageTicketType($user, $ticketType)) {
            return $this->json([
                'message' => 'Vous ne pouvez supprimer que les billets de vos propres evenements.',
            ], 403);
        }

        $entityManager->remove($ticketType);
        $entityManager->flush();

        return $this->json([
            'message' => 'Billet supprime avec succes.',
        ]);
    }

    private function serializeTicketType(TicketType $ticketType): array
    {
        return [
            'id' => $ticketType->getId(),
            'name' => $ticketType->getName(),
            'description' => $ticketType->getDescription(),
            'price' => $ticketType->getPrice(),
            'stock' => $ticketType->getStock(),
            'salesStartAt' => $ticketType->getSalesStartAt()?->format(\DateTimeInterface::ATOM),
            'salesEndAt' => $ticketType->getSalesEndAt()?->format(\DateTimeInterface::ATOM),
            'maxPerOrder' => $ticketType->getMaxPerOrder(),
            'isActive' => $ticketType->isActive(),
            'createdAt' => $ticketType->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'event' => [
                'id' => $ticketType->getEvent()?->getId(),
                'title' => $ticketType->getEvent()?->getTitle(),
            ],
        ];
    }

    private function isAdmin(User $user): bool
    {
        return in_array(User::ROLE_ADMIN, $user->getRoles(), true);
    }

    private function isOrganizer(User $user): bool
    {
        return in_array(User::ROLE_ORGANIZER, $user->getRoles(), true);
    }

    private function isOrganizerOrAdmin(User $user): bool
    {
        return $this->isOrganizer($user) || $this->isAdmin($user);
    }

    private function canManageEvent(User $user, Event $event): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $this->isOrganizer($user)
            && $event->getOrganizer()?->getId() === $user->getId();
    }

    private function canManageTicketType(User $user, TicketType $ticketType): bool
    {
        $event = $ticketType->getEvent();

        if (!$event instanceof Event) {
            return false;
        }

        return $this->canManageEvent($user, $event);
    }
}
