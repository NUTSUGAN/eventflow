<?php

namespace App\Controller;

use App\Entity\Order;
use App\Entity\PromotionCampaign;
use App\Repository\OrderRepository;
use App\Repository\PromotionCampaignRepository;
use App\Service\PromotionCampaignService;
use App\Service\PromotionNotificationService;
use App\Service\StripePaymentService;
use App\Service\TicketFulfillmentService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Stripe\Checkout\Session;
use Stripe\Exception\SignatureVerificationException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/stripe')]
final class StripeWebhookController extends AbstractController
{
    #[Route('/webhook', name: 'api_stripe_webhook', methods: ['POST'])]
    public function webhook(
        Request $request,
        OrderRepository $orderRepository,
        PromotionCampaignRepository $promotionCampaignRepository,
        StripePaymentService $stripePaymentService,
        PromotionCampaignService $promotionCampaignService,
        PromotionNotificationService $promotionNotificationService,
        EntityManagerInterface $entityManager,
        TicketFulfillmentService $ticketFulfillmentService,
        LoggerInterface $logger,
    ): JsonResponse {
        $payload = $request->getContent();
        $signatureHeader = $request->headers->get('Stripe-Signature');

        try {
            $event = $stripePaymentService->constructWebhookEvent($payload, $signatureHeader);
            $session = $stripePaymentService->hydrateCheckoutSession($event->data->object);
        } catch (\InvalidArgumentException|\UnexpectedValueException|SignatureVerificationException $exception) {
            return $this->json([
                'message' => 'Webhook Stripe invalide.',
            ], Response::HTTP_BAD_REQUEST);
        } catch (\RuntimeException $exception) {
            $logger->error('Stripe webhook configuration error.', [
                'message' => $exception->getMessage(),
            ]);

            return $this->json([
                'message' => 'Webhook Stripe indisponible.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        if (!$session instanceof Session) {
            return $this->json([
                'message' => 'Objet de session Stripe invalide.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $promotionCampaignId = $stripePaymentService->extractPromotionCampaignIdFromSession($session);

        if (null !== $promotionCampaignId) {
            $campaign = $promotionCampaignRepository->find($promotionCampaignId);

            if (!$campaign instanceof PromotionCampaign) {
                return $this->json(['message' => 'Campagne Stripe introuvable.'], Response::HTTP_NOT_FOUND);
            }

            if (in_array($event->type, ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)
                && 'paid' === (string) $session->payment_status
            ) {
                try {
                    $wasAlreadyPaid = null !== $campaign->getPaidAt();
                    $stripePaymentService->assertPaidPromotionSession($session, $campaign);
                    $promotionCampaignService->assertLaunchPackAvailable($campaign);
                    $promotionCampaignService->activatePaidCampaign($campaign, (string) $session->id);
                    $stripePaymentService->recordPromotionOrder($campaign, $session);
                    $entityManager->flush();

                    if (!$wasAlreadyPaid) {
                        $promotionNotificationService->notifyPaymentConfirmed($campaign);
                    }
                } catch (\LogicException $exception) {
                    $logger->error('Promotion payment could not activate campaign.', [
                        'campaignId' => $promotionCampaignId,
                        'message' => $exception->getMessage(),
                    ]);

                    return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
                }
            }

            return $this->json(['received' => true]);
        }

        $orderId = $stripePaymentService->extractOrderIdFromSession($session);

        if (null === $orderId) {
            $logger->warning('Stripe webhook received without order id.', [
                'eventType' => $event->type,
                'sessionId' => $session->id,
            ]);

            return $this->json([
                'message' => 'Commande Stripe introuvable.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $order = $orderRepository->find($orderId);

        if (!$order instanceof Order) {
            $logger->warning('Stripe webhook references unknown order.', [
                'eventType' => $event->type,
                'orderId' => $orderId,
                'sessionId' => $session->id,
            ]);

            return $this->json([
                'message' => 'Commande Stripe introuvable.',
            ], Response::HTTP_NOT_FOUND);
        }

        switch ($event->type) {
            case 'checkout.session.completed':
            case 'checkout.session.async_payment_succeeded':
                if ('paid' === (string) $session->payment_status) {
                    $stripePaymentService->markOrderAsPaid($order, $session);
                    $ticketFulfillmentService->fulfillPaidOrder($order);
                }
                break;

            case 'checkout.session.async_payment_failed':
                $stripePaymentService->markOrderAsExpired($order);
                break;
        }

        return $this->json([
            'received' => true,
        ]);
    }
}
