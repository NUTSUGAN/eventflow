<?php

namespace App\Service;

use App\Entity\PromotionCampaign;
use App\Entity\PromotionCampaignChannel;
use App\Entity\PromotionChannelRate;
use App\Repository\PromotionChannelRateRepository;

final class PromotionPricingService
{
    public function __construct(
        private readonly PromotionChannelRateRepository $rateRepository,
    ) {
    }

    /**
     * @param list<string> $channels
     *
     * @return array{duration: string, currency: string, totalPrice: string, channels: list<array{channelCode: string, priceAmount: string}>}
     */
    public function calculate(string $duration, array $channels): array
    {
        $duration = strtolower(trim($duration));

        if (!in_array($duration, PromotionCampaign::DURATIONS, true)) {
            throw new \InvalidArgumentException('Choisis une durée de promotion valide.');
        }

        $normalizedChannels = array_values(array_unique(array_map(
            static fn (string $channel): string => strtoupper(trim($channel)),
            $channels,
        )));

        if ([] === $normalizedChannels) {
            throw new \InvalidArgumentException('Choisis au moins un canal de promotion.');
        }

        $pricedChannels = [];
        $totalCents = 0;
        $currency = PromotionCampaign::DEFAULT_CURRENCY;

        foreach ($normalizedChannels as $channelCode) {
            if (!in_array($channelCode, PromotionCampaignChannel::CHANNELS, true)) {
                throw new \InvalidArgumentException(sprintf('Le canal %s est invalide.', $channelCode));
            }

            $rate = $this->rateRepository->findActiveRate($channelCode, $duration);

            if (!$rate instanceof PromotionChannelRate) {
                throw new \LogicException(sprintf('Aucun tarif actif pour %s sur %s.', $channelCode, $duration));
            }

            if ([] !== $pricedChannels && $rate->getCurrency() !== $currency) {
                throw new \LogicException('Les tarifs sélectionnés utilisent plusieurs devises.');
            }

            $currency = $rate->getCurrency();
            $totalCents += $this->moneyToCents($rate->getPriceAmount());
            $pricedChannels[] = [
                'channelCode' => $channelCode,
                'priceAmount' => $rate->getPriceAmount(),
            ];
        }

        return [
            'duration' => $duration,
            'currency' => $currency,
            'totalPrice' => $this->centsToMoney($totalCents),
            'channels' => $pricedChannels,
        ];
    }

    /**
     * @return list<array{id: int|null, channelCode: string|null, duration: string|null, priceAmount: string, currency: string, isActive: bool, updatedAt: string}>
     */
    public function getCatalog(): array
    {
        return array_map(
            static fn (PromotionChannelRate $rate): array => [
                'id' => $rate->getId(),
                'channelCode' => $rate->getChannelCode(),
                'duration' => $rate->getDuration(),
                'priceAmount' => $rate->getPriceAmount(),
                'currency' => $rate->getCurrency(),
                'isActive' => $rate->isActive(),
                'updatedAt' => $rate->getUpdatedAt()->format(DATE_ATOM),
            ],
            $this->rateRepository->findActiveCatalog(),
        );
    }

    private function moneyToCents(string $amount): int
    {
        [$whole, $decimal] = array_pad(explode('.', $amount, 2), 2, '0');

        return ((int) $whole * 100) + (int) str_pad(substr($decimal, 0, 2), 2, '0');
    }

    private function centsToMoney(int $cents): string
    {
        return sprintf('%d.%02d', intdiv($cents, 100), $cents % 100);
    }
}
