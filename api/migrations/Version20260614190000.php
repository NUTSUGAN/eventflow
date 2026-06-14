<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260614190000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Backfill independent Booster metrics for each selected public placement.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DELETE FROM promotion_campaign_metrics');

        $this->addSql("INSERT INTO promotion_campaign_metrics (promotion_campaign_id, placement, impressions, clicks, created_at, updated_at) SELECT id_promotion_campaign, 'detail', 0, 0, NOW(), NOW() FROM promotion_campaigns");
        $this->addSql("INSERT INTO promotion_campaign_metrics (promotion_campaign_id, placement, impressions, clicks, created_at, updated_at) SELECT promotion_campaign_id, 'homepage', SUM(impressions), SUM(clicks), NOW(), NOW() FROM promotion_campaign_channels WHERE channel_code = 'LAUNCH_PACK' GROUP BY promotion_campaign_id");
        $this->addSql("INSERT INTO promotion_campaign_metrics (promotion_campaign_id, placement, impressions, clicks, created_at, updated_at) SELECT promotion_campaign_id, 'explorer', 0, 0, NOW(), NOW() FROM promotion_campaign_channels WHERE channel_code = 'LAUNCH_PACK' GROUP BY promotion_campaign_id");
        $this->addSql("INSERT INTO promotion_campaign_metrics (promotion_campaign_id, placement, impressions, clicks, created_at, updated_at) SELECT promotion_campaign_id, 'newsletter', SUM(impressions), SUM(clicks), NOW(), NOW() FROM promotion_campaign_channels WHERE channel_code = 'NEWSLETTER' GROUP BY promotion_campaign_id");
        $this->addSql("INSERT INTO promotion_campaign_metrics (promotion_campaign_id, placement, impressions, clicks, created_at, updated_at) SELECT promotion_campaign_id, 'social', SUM(impressions), SUM(clicks), NOW(), NOW() FROM promotion_campaign_channels WHERE channel_code = 'SOCIAL_INFLUENCER' GROUP BY promotion_campaign_id");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DELETE FROM promotion_campaign_metrics');
        $this->addSql("INSERT INTO promotion_campaign_metrics (promotion_campaign_id, placement, impressions, clicks, created_at, updated_at) SELECT promotion_campaign_id, 'homepage', SUM(impressions), SUM(clicks), NOW(), NOW() FROM promotion_campaign_channels GROUP BY promotion_campaign_id");
    }
}
