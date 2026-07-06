<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\WithdrawalRequest;
use App\Repository\WithdrawalRequestRepository;
use App\Repository\WithdrawalSettingRepository;
use App\Service\WithdrawalNotificationService;
use App\Service\WithdrawalService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/withdrawals')]
#[IsGranted('ROLE_ADMIN_FINANCE')]
final class AdminWithdrawalController extends AbstractController
{
    #[Route('', name: 'api_admin_withdrawal_index', methods: ['GET'])]
    public function index(
        Request $request,
        WithdrawalRequestRepository $withdrawalRepository,
        WithdrawalSettingRepository $settingRepository,
        WithdrawalService $withdrawalService,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $status = strtolower(trim((string) $request->query->get('status', '')));
        $status = '' !== $status ? $status : null;

        if (null !== $status && !in_array($status, WithdrawalRequest::STATUSES, true)) {
            return $this->json(['message' => 'Filtre de statut invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $setting = $settingRepository->getCurrent($entityManager);

        return $this->json([
            'settings' => [
                'defaultFeePercent' => $setting->getDefaultFeePercent(),
                'updatedAt' => $setting->getUpdatedAt()->format(DATE_ATOM),
            ],
            'items' => array_map(
                static fn (WithdrawalRequest $withdrawal): array => $withdrawalService->serialize($withdrawal, true),
                $withdrawalRepository->findForAdmin($status),
            ),
        ]);
    }

    #[Route('/settings', name: 'api_admin_withdrawal_settings_update', methods: ['PATCH'])]
    public function updateSettings(
        Request $request,
        WithdrawalSettingRepository $settingRepository,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $data = $request->toArray();
        $setting = $settingRepository->getCurrent($entityManager);

        try {
            $setting->setDefaultFeePercent((string) ($data['defaultFeePercent'] ?? ''));
            $entityManager->flush();
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return $this->json([
            'message' => 'Taux de retrait par défaut mis à jour.',
            'settings' => [
                'defaultFeePercent' => $setting->getDefaultFeePercent(),
                'updatedAt' => $setting->getUpdatedAt()->format(DATE_ATOM),
            ],
        ]);
    }

    #[Route('/{id<\d+>}', name: 'api_admin_withdrawal_show', methods: ['GET'])]
    public function show(
        WithdrawalRequest $withdrawal,
        WithdrawalService $withdrawalService,
    ): JsonResponse {
        return $this->json([
            'withdrawal' => $withdrawalService->serialize($withdrawal, true),
        ]);
    }

    #[Route('/{id<\d+>}', name: 'api_admin_withdrawal_update', methods: ['PATCH'])]
    public function update(
        WithdrawalRequest $withdrawal,
        Request $request,
        WithdrawalService $withdrawalService,
        WithdrawalNotificationService $withdrawalNotificationService,
        EntityManagerInterface $entityManager,
    ): JsonResponse {
        $data = $request->toArray();
        $status = strtolower(trim((string) ($data['status'] ?? $withdrawal->getStatus())));
        $reviewer = $this->getUser();
        $previousTrackingState = $this->trackingState($withdrawal);

        if (!in_array($status, WithdrawalRequest::STATUSES, true)) {
            return $this->json(['message' => 'Statut de retrait invalide.'], Response::HTTP_BAD_REQUEST);
        }

        if (WithdrawalRequest::STATUS_PAID === $status) {
            $paymentReference = trim((string) ($data['paymentReference'] ?? $withdrawal->getPaymentReference() ?? ''));

            if ('' === $paymentReference) {
                return $this->json(['message' => 'La référence de paiement est obligatoire pour marquer un retrait payé.'], Response::HTTP_BAD_REQUEST);
            }

            $withdrawal->setPaymentReference($paymentReference);

            if (!$withdrawal->getPaidAt() instanceof \DateTimeImmutable) {
                $withdrawal->setPaidAt(new \DateTimeImmutable());
            }
        }

        if (array_key_exists('feePercent', $data)) {
            $withdrawalService->refreshAmounts($withdrawal, (string) $data['feePercent']);
        }

        $withdrawal
            ->setStatus($status)
            ->setAdminNote($data['adminNote'] ?? $withdrawal->getAdminNote())
            ->setPaymentReference($data['paymentReference'] ?? $withdrawal->getPaymentReference())
            ->setReviewedBy($reviewer instanceof User ? $reviewer : null)
            ->setReviewedAt(new \DateTimeImmutable())
            ->touch()
        ;

        if (WithdrawalRequest::STATUS_PAID !== $status) {
            $withdrawal->setPaidAt(null);
        }

        $entityManager->flush();

        if ($this->hasTrackingChanged($withdrawal, $previousTrackingState)) {
            $withdrawalNotificationService->notifyTrackingUpdated($withdrawal);
        }

        return $this->json([
            'message' => 'Retrait mis à jour.',
            'withdrawal' => $withdrawalService->serialize($withdrawal, true),
        ]);
    }

    /**
     * @return array{
     *   status: string,
     *   grossAmount: string,
     *   feePercent: string,
     *   feeAmount: string,
     *   netAmount: string,
     *   adminNote: string|null,
     *   paymentReference: string|null,
     *   paidAt: string|null
     * }
     */
    private function trackingState(WithdrawalRequest $withdrawal): array
    {
        return [
            'status' => $withdrawal->getStatus(),
            'grossAmount' => $withdrawal->getGrossAmount(),
            'feePercent' => $withdrawal->getFeePercent(),
            'feeAmount' => $withdrawal->getFeeAmount(),
            'netAmount' => $withdrawal->getNetAmount(),
            'adminNote' => $withdrawal->getAdminNote(),
            'paymentReference' => $withdrawal->getPaymentReference(),
            'paidAt' => $withdrawal->getPaidAt()?->format(DATE_ATOM),
        ];
    }

    /**
     * @param array{
     *   status: string,
     *   grossAmount: string,
     *   feePercent: string,
     *   feeAmount: string,
     *   netAmount: string,
     *   adminNote: string|null,
     *   paymentReference: string|null,
     *   paidAt: string|null
     * } $previousTrackingState
     */
    private function hasTrackingChanged(
        WithdrawalRequest $withdrawal,
        array $previousTrackingState
    ): bool {
        return $previousTrackingState !== $this->trackingState($withdrawal);
    }
}
