<?php

namespace App\Command;

use App\Entity\PromotionCampaign;
use App\Entity\PromotionCampaignChannel;
use App\Repository\PromotionCampaignRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:promotions:expire',
    description: 'Expire les campagnes Booster dont la période est terminée.',
)]
final class ExpirePromotionCampaignsCommand extends Command
{
    public function __construct(
        private readonly PromotionCampaignRepository $campaignRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $now = new \DateTimeImmutable();
        $campaigns = $this->campaignRepository->findActiveCampaignsToExpire($now);

        foreach ($campaigns as $campaign) {
            $campaign
                ->setStatus(PromotionCampaign::STATUS_EXPIRED)
                ->setUpdatedAt($now)
            ;

            foreach ($campaign->getChannels() as $channel) {
                if (PromotionCampaignChannel::DELIVERY_CANCELLED !== $channel->getDeliveryStatus()) {
                    $channel
                        ->setDeliveryStatus(PromotionCampaignChannel::DELIVERY_DELIVERED)
                        ->setDeliveredAt($channel->getDeliveredAt() ?? $now)
                        ->setUpdatedAt($now)
                    ;
                }
            }
        }

        $this->entityManager->flush();
        $io->success(sprintf('%d campagne(s) Booster expirée(s).', count($campaigns)));

        return Command::SUCCESS;
    }
}
