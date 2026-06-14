<?php

namespace App\Tests\Entity;

use App\Entity\Event;
use App\Entity\Order;
use App\Entity\PromotionCampaign;
use App\Entity\PromotionCampaignChannel;
use App\Entity\PromotionCampaignMetric;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

class PromotionCampaignTest extends TestCase
{
    public function testCampaignKeepsPricingAndSchedulingSnapshot(): void
    {
        $startsAt = new \DateTimeImmutable('2026-07-01 09:00:00');
        $endsAt = new \DateTimeImmutable('2026-07-08 09:00:00');
        $event = new Event();
        $organizer = new User();

        $campaign = (new PromotionCampaign())
            ->setEvent($event)
            ->setOrganizer($organizer)
            ->setDuration(PromotionCampaign::DURATION_7_DAYS)
            ->setStartsAt($startsAt)
            ->setEndsAt($endsAt)
            ->setTotalPrice('88')
            ->setCurrency('eur');

        self::assertSame(PromotionCampaign::STATUS_PENDING, $campaign->getStatus());
        self::assertSame(PromotionCampaign::DURATION_7_DAYS, $campaign->getDuration());
        self::assertSame('88.00', $campaign->getTotalPrice());
        self::assertSame('EUR', $campaign->getCurrency());
        self::assertTrue($campaign->hasValidSchedule());
    }

    public function testCampaignCanContainSeveralIndependentChannels(): void
    {
        $campaign = new PromotionCampaign();
        $launchPack = (new PromotionCampaignChannel())
            ->setChannelCode(PromotionCampaignChannel::CHANNEL_LAUNCH_PACK)
            ->setPriceAmount('49');
        $newsletter = (new PromotionCampaignChannel())
            ->setChannelCode(PromotionCampaignChannel::CHANNEL_NEWSLETTER)
            ->setPriceAmount('39');

        $campaign
            ->addChannel($launchPack)
            ->addChannel($newsletter);

        self::assertCount(2, $campaign->getChannels());
        self::assertSame($campaign, $launchPack->getCampaign());
        self::assertSame($campaign, $newsletter->getCampaign());
        self::assertTrue($campaign->hasChannel(PromotionCampaignChannel::CHANNEL_LAUNCH_PACK));
        self::assertTrue($campaign->hasChannel(PromotionCampaignChannel::CHANNEL_NEWSLETTER));
    }

    public function testDuplicateChannelIsRejectedBeforeDatabaseFlush(): void
    {
        $campaign = new PromotionCampaign();
        $campaign->addChannel(
            (new PromotionCampaignChannel())
                ->setChannelCode(PromotionCampaignChannel::CHANNEL_NEWSLETTER)
        );

        $this->expectException(\InvalidArgumentException::class);

        $campaign->addChannel(
            (new PromotionCampaignChannel())
                ->setChannelCode(PromotionCampaignChannel::CHANNEL_NEWSLETTER)
        );
    }

    public function testEventOrganizerAndOrderRelationsRemainBidirectional(): void
    {
        $campaign = new PromotionCampaign();
        $event = new Event();
        $organizer = new User();
        $order = new Order();

        $event->addPromotionCampaign($campaign);
        $organizer->addPromotionCampaign($campaign);
        $campaign->addOrder($order);

        self::assertSame($event, $campaign->getEvent());
        self::assertSame($organizer, $campaign->getOrganizer());
        self::assertSame($campaign, $order->getPromotionCampaign());
        self::assertCount(1, $event->getPromotionCampaigns());
        self::assertCount(1, $organizer->getPromotionCampaigns());
    }

    public function testInvalidCampaignStatusAndDurationAreRejected(): void
    {
        $campaign = new PromotionCampaign();

        try {
            $campaign->setStatus('unknown');
            self::fail('An invalid status should be rejected.');
        } catch (\InvalidArgumentException) {
            self::assertSame(PromotionCampaign::STATUS_PENDING, $campaign->getStatus());
        }

        $this->expectException(\InvalidArgumentException::class);
        $campaign->setDuration('90_days');
    }

    public function testChannelTracksIndependentDeliveryAndPerformance(): void
    {
        $channel = (new PromotionCampaignChannel())
            ->setChannelCode(PromotionCampaignChannel::CHANNEL_SOCIAL_INFLUENCER)
            ->setPriceAmount('75')
            ->setDeliveryStatus(PromotionCampaignChannel::DELIVERY_SCHEDULED)
            ->incrementImpressions(200)
            ->incrementClicks(10);

        self::assertSame('75.00', $channel->getPriceAmount());
        self::assertSame(PromotionCampaignChannel::DELIVERY_SCHEDULED, $channel->getDeliveryStatus());
        self::assertSame(200, $channel->getImpressions());
        self::assertSame(10, $channel->getClicks());
        self::assertSame(5.0, $channel->getClickThroughRate());
    }

    public function testCampaignOwnsIndependentMetrics(): void
    {
        $campaign = new PromotionCampaign();
        $metric = (new PromotionCampaignMetric())
            ->setPlacement(PromotionCampaignMetric::PLACEMENT_NEWSLETTER)
        ;

        $campaign->addMetric($metric);

        self::assertCount(1, $campaign->getMetrics());
        self::assertSame($campaign, $metric->getCampaign());

        $campaign->removeMetric($metric);

        self::assertCount(0, $campaign->getMetrics());
        self::assertNull($metric->getCampaign());
    }
}
