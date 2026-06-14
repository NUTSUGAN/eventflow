<?php

namespace App\Controller;

use App\Entity\PromotionCampaign;
use App\Entity\PromotionCampaignMetric;
use App\Repository\PromotionCampaignMetricRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class PromotionMetricController extends AbstractController
{
    #[Route('/api/promotions/{id<\d+>}/metrics', name: 'api_promotion_metric_create', methods: ['POST'])]
    public function create(
        PromotionCampaign $campaign,
        Request $request,
        PromotionCampaignMetricRepository $metricRepository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        if (!$campaign->isActiveAt(new \DateTimeImmutable())) {
            return $this->json(['recorded' => false], Response::HTTP_ACCEPTED);
        }

        $data = $request->toArray();
        $metric = strtolower(trim((string) ($data['metric'] ?? '')));
        $placement = strtolower(trim((string) ($data['placement'] ?? PromotionCampaignMetric::PLACEMENT_HOMEPAGE)));

        if (!in_array($placement, PromotionCampaignMetric::PLACEMENTS, true)) {
            return $this->json(['message' => 'Emplacement de statistique invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $campaignMetric = $metricRepository->findOneForCampaignAndPlacement($campaign, $placement)
            ?? (new PromotionCampaignMetric())
                ->setCampaign($campaign)
                ->setPlacement($placement)
        ;

        if ('impression' === $metric) {
            $campaignMetric->incrementImpressions();
        } elseif ('click' === $metric) {
            $campaignMetric->incrementClicks();
        } else {
            return $this->json(['message' => 'Metrique invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $entityManager->persist($campaignMetric);
        $entityManager->flush();

        return $this->json(['recorded' => true], Response::HTTP_ACCEPTED);
    }
}
