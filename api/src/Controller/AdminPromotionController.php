<?php

namespace App\Controller;

use App\Entity\PromotionCampaign;
use App\Entity\PromotionCampaignChannel;
use App\Entity\PromotionChannelRate;
use App\Entity\User;
use App\Repository\PromotionCampaignRepository;
use App\Repository\PromotionChannelRateRepository;
use App\Service\PromotionCampaignService;
use App\Service\PromotionNotificationService;
use App\Service\PromotionPricingService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/promotions')]
final class AdminPromotionController extends AbstractController
{
    #[Route('', name: 'api_admin_promotion_index', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN_SUPPORT')]
    public function index(
        Request $request,
        PromotionCampaignRepository $repository,
        PromotionCampaignService $campaignService,
    ): JsonResponse {
        $status = strtolower(trim((string) $request->query->get('status', '')));
        $status = '' !== $status ? $status : null;

        if (null !== $status && !in_array($status, PromotionCampaign::STATUSES, true)) {
            return $this->json(['message' => 'Filtre de statut invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $page = max(1, (int) $request->query->get('page', 1));
        $pageSize = max(1, min(50, (int) $request->query->get('pageSize', 20)));
        $total = $repository->countForAdmin($status);
        $campaigns = $repository->findForAdmin($status, $pageSize, ($page - 1) * $pageSize);
        $totalPages = max(1, (int) ceil($total / $pageSize));

        return $this->json([
            'items' => array_map($campaignService->serialize(...), $campaigns),
            'page' => $page,
            'pageSize' => $pageSize,
            'total' => $total,
            'totalPages' => $totalPages,
            'hasPreviousPage' => $page > 1,
            'hasNextPage' => $page < $totalPages,
        ]);
    }

    #[Route('/rates', name: 'api_admin_promotion_rates', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN_FINANCE')]
    public function rates(PromotionPricingService $pricingService): JsonResponse
    {
        return $this->json(['items' => $pricingService->getCatalog()]);
    }

    #[Route('/rates/{id<\d+>}', name: 'api_admin_promotion_rate_update', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN_FINANCE')]
    public function updateRate(
        PromotionChannelRate $rate,
        Request $request,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        try {
            $data = $request->toArray();
            $rate->setPriceAmount((string) ($data['priceAmount'] ?? ''));

            if (array_key_exists('isActive', $data)) {
                $rate->setIsActive((bool) $data['isActive']);
            }

            $rate->touch();
            $entityManager->flush();
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return $this->json(['message' => 'Tarif mis à jour.']);
    }

    #[Route('/{id<\d+>}', name: 'api_admin_promotion_show', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN_SUPPORT')]
    public function show(PromotionCampaign $campaign, PromotionCampaignService $campaignService): JsonResponse
    {
        return $this->json($campaignService->serialize($campaign));
    }

    #[Route('/{id<\d+>}/approve', name: 'api_admin_promotion_approve', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN_SUPPORT')]
    public function approve(
        PromotionCampaign $campaign,
        Request $request,
        PromotionCampaignService $campaignService,
        PromotionNotificationService $notificationService,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if (PromotionCampaign::STATUS_PENDING !== $campaign->getStatus()) {
            return $this->json(['message' => 'Seule une campagne en attente peut être approuvée.'], Response::HTTP_CONFLICT);
        }

        if ('published' !== strtolower((string) $campaign->getEvent()?->getStatus())) {
            return $this->json(['message' => 'Cet évènement n’est plus publié.'], Response::HTTP_CONFLICT);
        }

        try {
            $campaignService->assertLaunchPackAvailable($campaign);
            $data = $request->toArray();
            $now = new \DateTimeImmutable();
            $reviewer = $this->getUser();
            $campaign
                ->setStatus(PromotionCampaign::STATUS_APPROVED)
                ->setApprovedAt($now)
                ->setRejectedAt(null)
                ->setAdminComment($this->nullableString($data['adminComment'] ?? null))
                ->setReviewedBy($reviewer instanceof User ? $reviewer : null)
                ->setUpdatedAt($now)
            ;
            $entityManager->flush();
            $notificationService->notifyDecision($campaign, true);
        } catch (\LogicException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        }

        return $this->json([
            'message' => 'La campagne est approuvée et peut maintenant etre payée.',
            'campaign' => $campaignService->serialize($campaign),
        ]);
    }

    #[Route('/{id<\d+>}/reject', name: 'api_admin_promotion_reject', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN_SUPPORT')]
    public function reject(
        PromotionCampaign $campaign,
        Request $request,
        PromotionCampaignService $campaignService,
        PromotionNotificationService $notificationService,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if (PromotionCampaign::STATUS_PENDING !== $campaign->getStatus()) {
            return $this->json(['message' => 'Seule une campagne en attente peut être refusée.'], Response::HTTP_CONFLICT);
        }

        $data = $request->toArray();
        $comment = $this->nullableString($data['adminComment'] ?? null);

        if (null === $comment) {
            return $this->json(['message' => 'Le motif du refus est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        $now = new \DateTimeImmutable();
        $reviewer = $this->getUser();
        $campaign
            ->setStatus(PromotionCampaign::STATUS_REJECTED)
            ->setRejectedAt($now)
            ->setAdminComment($comment)
            ->setReviewedBy($reviewer instanceof User ? $reviewer : null)
            ->setUpdatedAt($now)
        ;

        foreach ($campaign->getChannels() as $channel) {
            $channel->setDeliveryStatus(PromotionCampaignChannel::DELIVERY_CANCELLED)->setUpdatedAt($now);
        }

        $entityManager->flush();
        $notificationService->notifyDecision($campaign, false);

        return $this->json([
            'message' => 'La campagne a été refusée.',
            'campaign' => $campaignService->serialize($campaign),
        ]);
    }

    #[Route('/{id<\d+>}/channels/{channelId<\d+>}', name: 'api_admin_promotion_channel_update', methods: ['PATCH'])]
    #[IsGranted('ROLE_ADMIN_SUPPORT')]
    public function updateChannel(
        PromotionCampaign $campaign,
        int $channelId,
        Request $request,
        PromotionCampaignService $campaignService,
        PromotionNotificationService $notificationService,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $target = null;

        foreach ($campaign->getChannels() as $channel) {
            if ($channel->getId() === $channelId) {
                $target = $channel;
                break;
            }
        }

        if (!$target instanceof PromotionCampaignChannel) {
            return $this->json(['message' => 'Canal de campagne introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if (PromotionCampaign::STATUS_ACTIVE !== $campaign->getStatus()) {
            return $this->json([
                'message' => 'Le suivi operationnel commence apres confirmation du paiement.',
            ], Response::HTTP_CONFLICT);
        }

        try {
            $data = $request->toArray();
            $previousStatus = $target->getDeliveryStatus();
            $previousBrief = $target->getAdminBrief();
            $previousFeatured = $target->isFeatured();
            $status = (string) ($data['deliveryStatus'] ?? $target->getDeliveryStatus());
            $isFeatured = array_key_exists('isFeatured', $data)
                ? (bool) $data['isFeatured']
                : $target->isFeatured();
            $now = new \DateTimeImmutable();

            if ($isFeatured) {
                $campaignService->assertLaunchPackAvailable($campaign);
                $status = PromotionCampaignChannel::DELIVERY_ACTIVE;
            } elseif (
                PromotionCampaignChannel::CHANNEL_LAUNCH_PACK === $target->getChannelCode()
                && PromotionCampaignChannel::DELIVERY_ACTIVE === $status
            ) {
                $status = PromotionCampaignChannel::DELIVERY_SCHEDULED;
            }

            $target
                ->setDeliveryStatus($status)
                ->setIsFeatured($isFeatured)
                ->setAdminBrief($this->nullableString($data['adminBrief'] ?? $target->getAdminBrief()))
                ->setUpdatedAt($now)
            ;

            if (PromotionCampaignChannel::DELIVERY_SCHEDULED === $status) {
                $target->setScheduledAt($now);
            }

            if (PromotionCampaignChannel::DELIVERY_DELIVERED === $status) {
                $target->setDeliveredAt($now);
            }

            $entityManager->flush();
            $trackingChanged = $previousStatus !== $target->getDeliveryStatus()
                || $previousBrief !== $target->getAdminBrief()
                || $previousFeatured !== $target->isFeatured();

            if ($trackingChanged) {
                $notificationService->notifyTrackingUpdated($campaign, $target);
            }
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (\LogicException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        }

        return $this->json([
            'message' => 'Le suivi du canal a été mis à jour.',
            'campaign' => $campaignService->serialize($campaign),
        ]);
    }

    private function nullableString(mixed $value): ?string
    {
        if (!is_scalar($value)) {
            return null;
        }

        $value = trim((string) $value);

        return '' !== $value ? $value : null;
    }
}
