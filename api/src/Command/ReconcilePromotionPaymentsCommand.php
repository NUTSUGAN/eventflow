<?php

namespace App\Command;

use App\Entity\PromotionCampaign;
use App\Repository\PromotionCampaignRepository;
use App\Service\PromotionCampaignService;
use App\Service\PromotionNotificationService;
use App\Service\StripePaymentService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:promotions:reconcile-payments',
    description: 'Réconcilie les campagnes approuvées avec les paiements Stripe confirmés.',
)]
final class ReconcilePromotionPaymentsCommand extends Command
{
    public function __construct(
        private readonly PromotionCampaignRepository $campaignRepository,
        private readonly PromotionCampaignService $campaignService,
        private readonly PromotionNotificationService $notificationService,
        private readonly StripePaymentService $stripePaymentService,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $campaigns = $this->campaignRepository->findBy([
            'status' => PromotionCampaign::STATUS_APPROVED,
            'paidAt' => null,
        ]);
        $reconciled = 0;

        foreach ($campaigns as $campaign) {
            try {
                $session = $this->stripePaymentService->findPaidPromotionSession($campaign);

                if (null === $session) {
                    continue;
                }

                $this->campaignService->assertLaunchPackAvailable($campaign);
                $this->campaignService->activatePaidCampaign($campaign, (string) $session->id);
                $this->stripePaymentService->recordPromotionOrder($campaign, $session);
                $this->entityManager->flush();
                $this->notificationService->notifyPaymentConfirmed($campaign);
                ++$reconciled;
            } catch (\Throwable $exception) {
                $io->warning(sprintf(
                    'Campagne #%d non réconciliée : %s',
                    (int) $campaign->getId(),
                    $exception->getMessage(),
                ));
            }
        }

        $io->success(sprintf('%d paiement(s) Booster réconcilié(s).', $reconciled));

        return Command::SUCCESS;
    }
}
