<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\Order;
use App\Entity\TicketType;
use App\Entity\User;
use App\Repository\EventRepository;
use App\Repository\OrderItemRepository;
use App\Repository\TicketTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/organizer')]
class OrganizerTicketTypeController extends AbstractController
{
    private const ORGANIZER_TIMEZONE = 'Europe/Paris';

    #[Route('/events/{eventId}/ticket-types', name: 'api_organizer_ticket_type_create', methods: ['POST'])]
    public function create(
        int $eventId,
        Request $request,
        EventRepository $eventRepository,
        TicketTypeRepository $ticketTypeRepository,
        OrderItemRepository $orderItemRepository,
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
                'message' => 'Accès réservé aux organisateurs ou administrateurs.',
            ], 403);
        }

        $event = $eventRepository->find($eventId);

        if (!$event instanceof Event) {
            return $this->json([
                'message' => 'l’évènement introuvable.',
            ], 404);
        }

        if (!$this->canManageEvent($user, $event)) {
            return $this->json([
                'message' => 'Vous ne pouvez gérer que les billets de vos propres évènements.',
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
                'message' => 'Le prix doit être un nombre positif ou nul.',
            ], 400);
        }

        if (!is_numeric($stock) || (int) $stock < 0) {
            return $this->json([
                'message' => 'Le stock doit être un entier positif ou nul.',
            ], 400);
        }

        if ($maxPerOrder !== null && (!is_numeric($maxPerOrder) || (int) $maxPerOrder <= 0)) {
            return $this->json([
                'message' => 'maxPerOrder doit être un entier strictement positif.',
            ], 400);
        }

        $salesStartAt = $this->parseLocalDateTime($salesStartAtRaw);
        $salesEndAt = $this->parseLocalDateTime($salesEndAtRaw);

        if (!$salesStartAt instanceof \DateTimeImmutable || !$salesEndAt instanceof \DateTimeImmutable) {
            return $this->json([
                'message' => 'Format de date invalide pour salesStartAt ou salesEndAt.',
            ], 400);
        }

        if ($salesStartAt >= $salesEndAt) {
            return $this->json([
                'message' => 'La date de début de vente doit être avant la date de fin de vente.',
            ], 400);
        }

        if ($salesStartAt >= $event->getStartDatetime()) {
            return $this->json([
                'message' => 'Le début de vente doit intervenir avant le début de l’l’évènement.',
            ], 400);
        }

        if ($salesEndAt > $event->getStartDatetime()) {
            return $this->json([
                'message' => 'La fin de vente ne peut pas depasser le début de l’l’évènement.',
            ], 400);
        }

        $allocatedStock = $ticketTypeRepository->sumStockForEvent($event);
        $nextEventStock = $allocatedStock + (int) $stock;

        if ($nextEventStock > (int) $event->getCapacity()) {
            return $this->json([
                'message' => sprintf(
                    'Le stock total des billets (%d) depasserait la capacité de l’l’évènement (%d).',
                    $nextEventStock,
                    (int) $event->getCapacity()
                ),
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

        $reservedQuantity = $orderItemRepository->countReservedQuantityForTicketType(
            $ticketType,
            Order::STOCK_CONSUMING_STATUSES
        );

        return $this->json([
            'message' => 'Billet crée avec succès.',
            'ticketType' => $this->serializeTicketType($ticketType, $reservedQuantity),
        ], 201);
    }

    #[Route('/events/{eventId}/ticket-types', name: 'api_organizer_ticket_type_index', methods: ['GET'])]
    public function index(
        int $eventId,
        EventRepository $eventRepository,
        TicketTypeRepository $ticketTypeRepository,
        OrderItemRepository $orderItemRepository
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json([
                'message' => 'Non authentifie.',
            ], 401);
        }

        if (!$this->isOrganizerOrAdmin($user)) {
            return $this->json([
                'message' => 'Accès réservé aux organisateurs ou administrateurs.',
            ], 403);
        }

        $event = $eventRepository->find($eventId);

        if (!$event instanceof Event) {
            return $this->json([
                'message' => 'l’évènement introuvable.',
            ], 404);
        }

        if (!$this->canManageEvent($user, $event)) {
            return $this->json([
                'message' => 'Vous ne pouvez consulter que les billets de vos propres évènements.',
            ], 403);
        }

        $ticketTypes = $ticketTypeRepository->findBy(
            ['event' => $event],
            ['id' => 'DESC']
        );

        $data = array_map(
            fn (TicketType $ticketType) => $this->serializeTicketType(
                $ticketType,
                $orderItemRepository->countReservedQuantityForTicketType($ticketType, Order::STOCK_CONSUMING_STATUSES)
            ),
            $ticketTypes
        );

        return $this->json($data);
    }

    #[Route('/ticket-types/{id}', name: 'api_organizer_ticket_type_update', methods: ['PATCH'])]
    public function update(
        int $id,
        Request $request,
        TicketTypeRepository $ticketTypeRepository,
        OrderItemRepository $orderItemRepository,
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
                'message' => 'Accès réservé aux organisateurs ou administrateurs.',
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
                'message' => 'Vous ne pouvez modifier que les billets de vos propres évènements.',
            ], 403);
        }

        $data = $request->toArray();

        if (array_key_exists('name', $data)) {
            $name = trim((string) $data['name']);

            if ($name === '') {
                return $this->json([
                    'message' => 'Le nom ne peut pas être vide.',
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
                    'message' => 'Le prix doit être un nombre positif ou nul.',
                ], 400);
            }

            $ticketType->setPrice((string) $price);
        }

        if (array_key_exists('stock', $data)) {
            $stock = $data['stock'];

            if (!is_numeric($stock) || (int) $stock < 0) {
                return $this->json([
                    'message' => 'Le stock doit être un entier positif ou nul.',
                ], 400);
            }

            $ticketType->setStock((int) $stock);
        }

        if (array_key_exists('maxPerOrder', $data)) {
            $maxPerOrder = $data['maxPerOrder'];

            if ($maxPerOrder !== null && (!is_numeric($maxPerOrder) || (int) $maxPerOrder <= 0)) {
                return $this->json([
                    'message' => 'maxPerOrder doit être un entier strictement positif.',
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
            $salesStartAt = $this->parseLocalDateTime($data['salesStartAt']);

            if (!$salesStartAt instanceof \DateTimeImmutable) {
                return $this->json([
                    'message' => 'Format invalide pour salesStartAt.',
                ], 400);
            }

            $ticketType->setSalesStartAt($salesStartAt);
        }

        if (array_key_exists('salesEndAt', $data)) {
            $salesEndAt = $this->parseLocalDateTime($data['salesEndAt']);

            if (!$salesEndAt instanceof \DateTimeImmutable) {
                return $this->json([
                    'message' => 'Format invalide pour salesEndAt.',
                ], 400);
            }

            $ticketType->setSalesEndAt($salesEndAt);
        }

        if ($salesStartAt >= $salesEndAt) {
            return $this->json([
                'message' => 'La date de début de vente doit être avant la date de fin de vente.',
            ], 400);
        }

        $event = $ticketType->getEvent();

        if ($event instanceof Event) {
            if ($salesStartAt >= $event->getStartDatetime()) {
                return $this->json([
                    'message' => 'Le début de vente doit intervenir avant le début de l’l’évènement.',
                ], 400);
            }

            if ($salesEndAt > $event->getStartDatetime()) {
                return $this->json([
                    'message' => 'La fin de vente ne peut pas depasser le début de l’l’évènement.',
                ], 400);
            }

            $allocatedStock = $ticketTypeRepository->sumStockForEvent(
                $event,
                $ticketType->getId()
            );
            $nextEventStock = $allocatedStock + (int) ($ticketType->getStock() ?? 0);

            if ($nextEventStock > (int) $event->getCapacity()) {
                return $this->json([
                    'message' => sprintf(
                        'Le stock total des billets (%d) depasserait la capacité de l’l’évènement (%d).',
                        $nextEventStock,
                        (int) $event->getCapacity()
                    ),
                ], 400);
            }
        }

        $entityManager->flush();

        $reservedQuantity = $orderItemRepository->countReservedQuantityForTicketType(
            $ticketType,
            Order::STOCK_CONSUMING_STATUSES
        );

        return $this->json([
            'message' => 'Billet mis à jour avec succès.',
            'ticketType' => $this->serializeTicketType($ticketType, $reservedQuantity),
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
                'message' => 'Accès réservé aux organisateurs ou administrateurs.',
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
                'message' => 'Vous ne pouvez supprimer que les billets de vos propres évènements.',
            ], 403);
        }

        $entityManager->remove($ticketType);
        $entityManager->flush();

        return $this->json([
            'message' => 'Billet supprime avec succès.',
        ]);
    }

    private function serializeTicketType(TicketType $ticketType, int $reservedQuantity = 0): array
    {
        $stock = (int) ($ticketType->getStock() ?? 0);

        return [
            'id' => $ticketType->getId(),
            'name' => $ticketType->getName(),
            'description' => $ticketType->getDescription(),
            'price' => $ticketType->getPrice(),
            'stock' => $stock,
            'reservedQuantity' => $reservedQuantity,
            'availableStock' => max(0, $stock - $reservedQuantity),
            'salesStartAt' => $this->formatDateTimeForFrontend($ticketType->getSalesStartAt()),
            'salesEndAt' => $this->formatDateTimeForFrontend($ticketType->getSalesEndAt()),
            'maxPerOrder' => $ticketType->getMaxPerOrder(),
            'isActive' => $ticketType->isActive(),
            'createdAt' => $this->formatDateTimeForFrontend($ticketType->getCreatedAt()),
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

    private function parseLocalDateTime(mixed $value): ?\DateTimeImmutable
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

    private function formatDateTimeForFrontend(?\DateTimeImmutable $dateTime): ?string
    {
        if (!$dateTime instanceof \DateTimeImmutable) {
            return null;
        }

        return $dateTime
            ->setTimezone(new \DateTimeZone(self::ORGANIZER_TIMEZONE))
            ->format(\DateTimeInterface::ATOM);
    }
}
