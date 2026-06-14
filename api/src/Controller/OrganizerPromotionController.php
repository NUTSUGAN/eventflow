<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\PromotionCampaign;
use App\Entity\PromotionCampaignChannel;
use App\Entity\User;
use App\Repository\EventRepository;
use App\Repository\PromotionCampaignRepository;
use App\Service\PromotionCampaignService;
use App\Service\PromotionNotificationService;
use App\Service\PromotionPricingService;
use App\Service\StripePaymentService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/organizer')]
final class OrganizerPromotionController extends AbstractController
{
    #[Route('/events/{eventId<\d+>}/promotions/options', name: 'api_organizer_promotion_options', methods: ['GET'])]
    public function options(
        int $eventId,
        Request $request,
        EventRepository $eventRepository,
        PromotionPricingService $pricingService,
        PromotionCampaignService $campaignService,
    ): JsonResponse {
        $access = $this->resolveEventAccess($eventRepository, $eventId);

        if ($access instanceof JsonResponse) {
            return $access;
        }

        $duration = strtolower((string) $request->query->get('duration', PromotionCampaign::DURATION_7_DAYS));

        if (!in_array($duration, PromotionCampaign::DURATIONS, true)) {
            return $this->json(['message' => 'Duree de promotion invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $startsAt = new \DateTimeImmutable();
        $endsAt = $campaignService->calculateEnd($startsAt, $duration);

        return $this->json([
            'durations' => PromotionCampaign::DURATIONS,
            'channels' => PromotionCampaignChannel::CHANNELS,
            'rates' => $pricingService->getCatalog(),
            'launchPack' => [
                'capacity' => PromotionCampaignService::LAUNCH_PACK_CAPACITY,
                'available' => $campaignService->isLaunchPackAvailable($startsAt, $endsAt),
            ],
        ]);
    }

    #[Route('/events/{eventId<\d+>}/promotions', name: 'api_organizer_promotion_create', methods: ['POST'])]
    public function create(
        int $eventId,
        Request $request,
        EventRepository $eventRepository,
        PromotionPricingService $pricingService,
        PromotionCampaignService $campaignService,
        PromotionNotificationService $notificationService,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $access = $this->resolveEventAccess($eventRepository, $eventId);

        if ($access instanceof JsonResponse) {
            return $access;
        }

        [$event, $user] = $access;

        if ('published' !== strtolower((string) $event->getStatus())) {
            return $this->json([
                'message' => 'Publie cet evenement avant de demander une promotion.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $data = $request->toArray();
            $rawChannels = $data['channels'] ?? [];

            if (!is_array($rawChannels) || !array_is_list($rawChannels)) {
                throw new \InvalidArgumentException('La liste des canaux est invalide.');
            }

            $channels = array_map(static fn (mixed $channel): string => (string) $channel, $rawChannels);
            $pricing = $pricingService->calculate((string) ($data['duration'] ?? ''), $channels);
            $startsAt = new \DateTimeImmutable();
            $endsAt = $campaignService->calculateEnd($startsAt, $pricing['duration']);
            $campaign = (new PromotionCampaign())
                ->setEvent($event)
                ->setOrganizer($user)
                ->setDuration($pricing['duration'])
                ->setStartsAt($startsAt)
                ->setEndsAt($endsAt)
                ->setTotalPrice($pricing['totalPrice'])
                ->setCurrency($pricing['currency'])
            ;

            foreach ($pricing['channels'] as $pricedChannel) {
                $campaign->addChannel(
                    (new PromotionCampaignChannel())
                        ->setChannelCode($pricedChannel['channelCode'])
                        ->setPriceAmount($pricedChannel['priceAmount'])
                );
            }

            $campaignService->assertLaunchPackAvailable($campaign);
            $entityManager->persist($campaign);
            $entityManager->flush();
            $notificationService->notifyNewRequest($campaign);
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\LogicException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        }

        return $this->json([
            'message' => 'La demande de promotion a ete envoyee a EventFlow.',
            'campaign' => $campaignService->serialize($campaign),
        ], Response::HTTP_CREATED);
    }

    #[Route('/promotions', name: 'api_organizer_promotion_index', methods: ['GET'])]
    public function index(
        Request $request,
        PromotionCampaignRepository $campaignRepository,
        PromotionCampaignService $campaignService,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Non authentifie.'], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->isOrganizerOrAdmin()) {
            return $this->json(['message' => 'Acces reserve aux organisateurs.'], Response::HTTP_FORBIDDEN);
        }

        $page = max(1, (int) $request->query->get('page', 1));
        $pageSize = max(1, min(50, (int) $request->query->get('pageSize', 10)));
        $total = $campaignRepository->countForOrganizer((int) $user->getId());
        $campaigns = $campaignRepository->findForOrganizer((int) $user->getId(), $pageSize, ($page - 1) * $pageSize);

        return $this->json($this->paginated($campaigns, $campaignService, $page, $pageSize, $total));
    }

    #[Route('/promotions/{id<\d+>}', name: 'api_organizer_promotion_show', methods: ['GET'])]
    public function show(
        PromotionCampaign $campaign,
        PromotionCampaignService $campaignService,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Non authentifie.'], Response::HTTP_UNAUTHORIZED);
        }

        if (User::ROLE_ADMIN !== $user->getBaseRole() && $campaign->getOrganizer()?->getId() !== $user->getId()) {
            return $this->json(['message' => 'Cette campagne ne vous appartient pas.'], Response::HTTP_FORBIDDEN);
        }

        if (null === $campaign->getPaidAt()) {
            return $this->json([
                'message' => 'Le suivi sera disponible apres validation et paiement de la campagne.',
            ], Response::HTTP_CONFLICT);
        }

        return $this->json($campaignService->serialize($campaign));
    }

    #[Route('/promotions/{id<\d+>}/checkout', name: 'api_organizer_promotion_checkout', methods: ['POST'])]
    public function checkout(
        PromotionCampaign $campaign,
        PromotionCampaignService $campaignService,
        StripePaymentService $stripePaymentService,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Non authentifie.'], Response::HTTP_UNAUTHORIZED);
        }

        if (User::ROLE_ADMIN !== $user->getBaseRole() && $campaign->getOrganizer()?->getId() !== $user->getId()) {
            return $this->json(['message' => 'Cette campagne ne vous appartient pas.'], Response::HTTP_FORBIDDEN);
        }

        try {
            $campaignService->assertLaunchPackAvailable($campaign);
            $session = $stripePaymentService->createPromotionCheckoutSession($campaign);
            $campaign
                ->setStripeSessionId((string) $session->id)
                ->setUpdatedAt(new \DateTimeImmutable())
            ;
            $entityManager->flush();
        } catch (\LogicException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        } catch (\RuntimeException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return $this->json([
            'checkoutUrl' => $session->url,
            'sessionId' => $session->id,
        ]);
    }

    #[Route('/promotions/{id<\d+>}/confirm-payment', name: 'api_organizer_promotion_payment_confirm', methods: ['POST'])]
    public function confirmPayment(
        PromotionCampaign $campaign,
        Request $request,
        PromotionCampaignService $campaignService,
        PromotionNotificationService $notificationService,
        StripePaymentService $stripePaymentService,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Non authentifie.'], Response::HTTP_UNAUTHORIZED);
        }

        if (User::ROLE_ADMIN !== $user->getBaseRole() && $campaign->getOrganizer()?->getId() !== $user->getId()) {
            return $this->json(['message' => 'Cette campagne ne vous appartient pas.'], Response::HTTP_FORBIDDEN);
        }

        if (PromotionCampaign::STATUS_ACTIVE === $campaign->getStatus() && null !== $campaign->getPaidAt()) {
            return $this->json([
                'message' => 'Le paiement est deja confirme.',
                'campaign' => $campaignService->serialize($campaign),
            ]);
        }

        try {
            $data = $request->toArray();
            $session = $stripePaymentService->retrievePromotionCheckoutSession((string) ($data['sessionId'] ?? ''));
            $stripePaymentService->assertPaidPromotionSession($session, $campaign);
            $campaignService->assertLaunchPackAvailable($campaign);
            $campaignService->activatePaidCampaign($campaign, (string) $session->id);
            $stripePaymentService->recordPromotionOrder($campaign, $session);
            $entityManager->flush();
            $notificationService->notifyPaymentConfirmed($campaign);
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\LogicException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        } catch (\Throwable) {
            return $this->json([
                'message' => 'Impossible de verifier le paiement aupres de Stripe pour le moment.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        return $this->json([
            'message' => 'Paiement confirme. La campagne est maintenant en suivi.',
            'campaign' => $campaignService->serialize($campaign),
        ]);
    }

    /**
     * @return array{Event, User}|JsonResponse
     */
    private function resolveEventAccess(EventRepository $eventRepository, int $eventId): array|JsonResponse
    {
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['message' => 'Non authentifie.'], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->isOrganizerOrAdmin()) {
            return $this->json(['message' => 'Acces reserve aux organisateurs.'], Response::HTTP_FORBIDDEN);
        }

        $event = $eventRepository->find($eventId);

        if (!$event instanceof Event) {
            return $this->json(['message' => 'Evenement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if (User::ROLE_ADMIN !== $user->getBaseRole() && $event->getOrganizer()?->getId() !== $user->getId()) {
            return $this->json(['message' => 'Vous ne pouvez promouvoir que vos evenements.'], Response::HTTP_FORBIDDEN);
        }

        return [$event, $user];
    }

    /**
     * @param list<PromotionCampaign> $campaigns
     *
     * @return array<string, mixed>
     */
    private function paginated(
        array $campaigns,
        PromotionCampaignService $campaignService,
        int $page,
        int $pageSize,
        int $total,
    ): array {
        $totalPages = max(1, (int) ceil($total / $pageSize));

        return [
            'items' => array_map($campaignService->serialize(...), $campaigns),
            'page' => $page,
            'pageSize' => $pageSize,
            'total' => $total,
            'totalPages' => $totalPages,
            'hasPreviousPage' => $page > 1,
            'hasNextPage' => $page < $totalPages,
        ];
    }
}
