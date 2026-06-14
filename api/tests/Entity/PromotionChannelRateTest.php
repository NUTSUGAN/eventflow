<?php

namespace App\Tests\Entity;

use App\Entity\PromotionCampaign;
use App\Entity\PromotionCampaignChannel;
use App\Entity\PromotionChannelRate;
use PHPUnit\Framework\TestCase;

final class PromotionChannelRateTest extends TestCase
{
    public function testRateNormalizesItsBusinessValues(): void
    {
        $rate = (new PromotionChannelRate())
            ->setChannelCode('newsletter')
            ->setDuration(PromotionCampaign::DURATION_7_DAYS)
            ->setPriceAmount('39,5')
            ->setCurrency('eur')
        ;

        self::assertSame(PromotionCampaignChannel::CHANNEL_NEWSLETTER, $rate->getChannelCode());
        self::assertSame(PromotionCampaign::DURATION_7_DAYS, $rate->getDuration());
        self::assertSame('39.50', $rate->getPriceAmount());
        self::assertSame('EUR', $rate->getCurrency());
        self::assertTrue($rate->isActive());
    }

    public function testRateRejectsUnknownChannel(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        (new PromotionChannelRate())->setChannelCode('TELEVISION');
    }

    public function testRateRejectsNegativePrice(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        (new PromotionChannelRate())->setPriceAmount('-10');
    }
}
