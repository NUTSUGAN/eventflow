<?php

namespace App\Controller;

use App\Entity\Order;
use App\Entity\PromotionCampaign;
use App\Repository\OrderRepository;
use App\Repository\PromotionCampaignRepository;
use App\Service\FedaPayPaymentService;
use App\Service\PromotionCampaignService;
use App\Service\PromotionNotificationService;
use App\Service\TicketFulfillmentService;
use Doctrine\ORM\EntityManagerInterface;
use FedaPay\Error\SignatureVerification;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/fedapay')]
final class FedaPayWebhookController extends AbstractController
{
    #[Route('/webhook', name: 'api_fedapay_webhook', methods: ['POST'])]
    public function webhook(
        Request $request,
        OrderRepository $orderRepository,
        PromotionCampaignRepository $campaignRepository,
        FedaPayPaymentService $paymentService,
        PromotionCampaignService $campaignService,
        PromotionNotificationService $notificationService,
        TicketFulfillmentService $ticketFulfillmentService,
        EntityManagerInterface $entityManager,
        LoggerInterface $logger,
    ): JsonResponse {
        try {
            $event = $paymentService->constructWebhookEvent(
                $request->getContent(),
                $request->headers->get('X-FedaPay-Signature'),
            );
            $webhookTransaction = $paymentService->extractWebhookTransaction($event);
            $transactionId = $webhookTransaction['id'] ?? $event->object_id ?? null;
            if (!is_int($transactionId) && !(is_string($transactionId) && ctype_digit($transactionId))) {
                throw new \UnexpectedValueException('Transaction FedaPay absente du webhook.');
            }
            $transaction = $paymentService->retrieveTransaction((string) $transactionId);
        } catch (\InvalidArgumentException|\UnexpectedValueException|SignatureVerification $exception) {
            return $this->json(['message' => 'Webhook FedaPay invalide.'], Response::HTTP_BAD_REQUEST);
        } catch (\RuntimeException $exception) {
            $logger->error('FedaPay webhook verification failed.', ['message' => $exception->getMessage()]);
            return $this->json(['message' => 'Webhook FedaPay indisponible.'], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        $status = strtolower((string) ($transaction['status'] ?? ''));
        $campaignId = $paymentService->extractPromotionCampaignId($transaction);

        if (null !== $campaignId) {
            $campaign = $campaignRepository->find($campaignId);
            if (!$campaign instanceof PromotionCampaign) {
                return $this->json(['message' => 'Campagne FedaPay introuvable.'], Response::HTTP_NOT_FOUND);
            }

            if (in_array($status, ['approved', 'transferred'], true)) {
                try {
                    $wasPaid = null !== $campaign->getPaidAt();
                    $paymentService->assertPaidPromotionTransaction($transaction, $campaign);
                    $campaignService->assertLaunchPackAvailable($campaign);
                    $campaignService->activatePaidCampaign($campaign, (string) $transaction['id']);
                    $paymentService->recordPromotionOrder($campaign, $transaction);
                    $entityManager->flush();
                    if (!$wasPaid) {
                        $notificationService->notifyPaymentConfirmed($campaign);
                    }
                } catch (\LogicException $exception) {
                    return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
                }
            }

            return $this->json(['received' => true]);
        }

        $orderId = $paymentService->extractOrderId($transaction);
        if (null === $orderId) {
            return $this->json(['message' => 'Commande FedaPay introuvable.'], Response::HTTP_BAD_REQUEST);
        }

        $order = $orderRepository->find($orderId);
        if (!$order instanceof Order) {
            return $this->json(['message' => 'Commande FedaPay introuvable.'], Response::HTTP_NOT_FOUND);
        }

        if (in_array($status, ['approved', 'transferred'], true)) {
            try {
                $paymentService->markOrderAsPaid($order, $transaction);
                $ticketFulfillmentService->fulfillPaidOrder($order);
            } catch (\LogicException $exception) {
                $paymentService->markOrderAsExpired($order);
                $logger->warning('FedaPay payment received after ticket sale closure.', [
                    'orderId' => $orderId,
                    'transactionId' => $transactionId,
                    'message' => $exception->getMessage(),
                ]);
            }
        } elseif (in_array($status, ['expired'], true)) {
            $paymentService->markOrderAsExpired($order);
        }

        return $this->json(['received' => true]);
    }
}
