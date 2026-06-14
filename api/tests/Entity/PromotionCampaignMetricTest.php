<?php

namespace App\Tests\Entity;

use App\Entity\PromotionCampaignMetric;
use PHPUnit\Framework\TestCase;

final class PromotionCampaignMetricTest extends TestCase
{
    public function testMetricTracksAnIndependentPlacement(): void
    {
        $metric = (new PromotionCampaignMetric())
            ->setPlacement(PromotionCampaignMetric::PLACEMENT_EXPLORER)
            ->incrementImpressions(250)
            ->incrementClicks(20)
        ;

        self::assertSame(PromotionCampaignMetric::PLACEMENT_EXPLORER, $metric->getPlacement());
        self::assertSame(250, $metric->getImpressions());
        self::assertSame(20, $metric->getClicks());
        self::assertSame(8.0, $metric->getClickThroughRate());
    }

    public function testMetricIgnoresNegativeIncrements(): void
    {
        $metric = (new PromotionCampaignMetric())
            ->setPlacement(PromotionCampaignMetric::PLACEMENT_DETAIL)
            ->incrementImpressions(-10)
            ->incrementClicks(-2)
        ;

        self::assertSame(0, $metric->getImpressions());
        self::assertSame(0, $metric->getClicks());
        self::assertSame(0.0, $metric->getClickThroughRate());
    }

    public function testUnknownPlacementIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        (new PromotionCampaignMetric())->setPlacement('unknown');
    }
}
