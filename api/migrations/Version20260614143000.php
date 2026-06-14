<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260614143000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Replace the legacy promotion table with campaigns and independent channel rows.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE promotion_campaigns (id_promotion_campaign INT AUTO_INCREMENT NOT NULL, event_id INT NOT NULL, organizer_user_id INT NOT NULL, reviewed_by_user_id INT DEFAULT NULL, status VARCHAR(20) DEFAULT 'pending' NOT NULL, duration VARCHAR(20) NOT NULL, starts_at DATETIME NOT NULL, ends_at DATETIME NOT NULL, total_price NUMERIC(15, 2) NOT NULL, currency VARCHAR(3) DEFAULT 'EUR' NOT NULL, admin_comment LONGTEXT DEFAULT NULL, approved_at DATETIME DEFAULT NULL, rejected_at DATETIME DEFAULT NULL, cancelled_at DATETIME DEFAULT NULL, paid_at DATETIME DEFAULT NULL, stripe_session_id VARCHAR(255) DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, INDEX IDX_9204A55D71F7E88B (event_id), INDEX IDX_9204A55DEE5F645C (organizer_user_id), INDEX IDX_9204A55DE03A844A (reviewed_by_user_id), INDEX idx_promotion_campaign_status_dates (status, starts_at, ends_at), UNIQUE INDEX UNIQ_9204A55D1A314A57 (stripe_session_id), PRIMARY KEY (id_promotion_campaign)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`");
        $this->addSql("CREATE TABLE promotion_campaign_channels (id_promotion_campaign_channel INT AUTO_INCREMENT NOT NULL, promotion_campaign_id INT NOT NULL, channel_code VARCHAR(40) NOT NULL, price_amount NUMERIC(15, 2) NOT NULL, delivery_status VARCHAR(20) DEFAULT 'pending' NOT NULL, admin_brief LONGTEXT DEFAULT NULL, scheduled_at DATETIME DEFAULT NULL, delivered_at DATETIME DEFAULT NULL, impressions INT DEFAULT 0 NOT NULL, clicks INT DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, INDEX IDX_7C36BFB927C73EAE (promotion_campaign_id), INDEX idx_promotion_channel_delivery (channel_code, delivery_status), UNIQUE INDEX uniq_campaign_channel (promotion_campaign_id, channel_code), PRIMARY KEY (id_promotion_campaign_channel)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`");

        $this->addSql('ALTER TABLE promotion_campaigns ADD CONSTRAINT FK_PROMO_CAMPAIGN_EVENT FOREIGN KEY (event_id) REFERENCES events (id_event) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE promotion_campaigns ADD CONSTRAINT FK_PROMO_CAMPAIGN_ORGANIZER FOREIGN KEY (organizer_user_id) REFERENCES users (id_user)');
        $this->addSql('ALTER TABLE promotion_campaigns ADD CONSTRAINT FK_PROMO_CAMPAIGN_REVIEWER FOREIGN KEY (reviewed_by_user_id) REFERENCES users (id_user) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE promotion_campaign_channels ADD CONSTRAINT FK_PROMO_CHANNEL_CAMPAIGN FOREIGN KEY (promotion_campaign_id) REFERENCES promotion_campaigns (id_promotion_campaign) ON DELETE CASCADE');

        $this->addSql("INSERT INTO promotion_campaigns (id_promotion_campaign, event_id, organizer_user_id, reviewed_by_user_id, status, duration, starts_at, ends_at, total_price, currency, admin_comment, approved_at, rejected_at, cancelled_at, paid_at, stripe_session_id, created_at, updated_at) SELECT promotion.id_promotion, promotion.event_id, event.organizer_user_id, NULL, CASE WHEN LOWER(promotion.status) IN ('pending', 'approved', 'active', 'expired', 'rejected', 'cancelled') THEN LOWER(promotion.status) ELSE 'pending' END, CASE WHEN DATEDIFF(promotion.end_at, promotion.start_at) <= 7 THEN '7_days' WHEN DATEDIFF(promotion.end_at, promotion.start_at) <= 14 THEN '14_days' ELSE '30_days' END, promotion.start_at, promotion.end_at, promotion.price_amount, 'EUR', NULL, NULL, NULL, NULL, NULL, NULL, promotion.created_at, promotion.created_at FROM promotions promotion INNER JOIN events event ON event.id_event = promotion.event_id");
        $this->addSql("INSERT INTO promotion_campaign_channels (promotion_campaign_id, channel_code, price_amount, delivery_status, admin_brief, scheduled_at, delivered_at, impressions, clicks, created_at, updated_at) SELECT promotion.id_promotion, CASE WHEN UPPER(promotion.type) IN ('LAUNCH_PACK', 'PACK_LANCEMENT', 'LAUNCH') THEN 'LAUNCH_PACK' WHEN UPPER(promotion.type) IN ('SOCIAL_INFLUENCER', 'SOCIAL', 'INFLUENCER') THEN 'SOCIAL_INFLUENCER' WHEN UPPER(promotion.type) = 'NEWSLETTER' THEN 'NEWSLETTER' ELSE 'LAUNCH_PACK' END, promotion.price_amount, CASE WHEN LOWER(promotion.status) = 'active' THEN 'active' WHEN LOWER(promotion.status) = 'expired' THEN 'delivered' WHEN LOWER(promotion.status) = 'cancelled' THEN 'cancelled' ELSE 'pending' END, NULL, NULL, CASE WHEN LOWER(promotion.status) = 'expired' THEN promotion.end_at ELSE NULL END, 0, 0, promotion.created_at, promotion.created_at FROM promotions promotion");

        $this->addSql('ALTER TABLE orders DROP FOREIGN KEY FK_E52FFDEE139DF194');
        $this->addSql('DROP INDEX IDX_E52FFDEE139DF194 ON orders');
        $this->addSql('ALTER TABLE orders CHANGE promotion_id promotion_campaign_id INT DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_E52FFDEE27C73EAE ON orders (promotion_campaign_id)');
        $this->addSql('ALTER TABLE orders ADD CONSTRAINT FK_ORDER_PROMOTION_CAMPAIGN FOREIGN KEY (promotion_campaign_id) REFERENCES promotion_campaigns (id_promotion_campaign) ON DELETE SET NULL');

        $this->addSql('ALTER TABLE promotions DROP FOREIGN KEY FK_EA1B303471F7E88B');
        $this->addSql('DROP TABLE promotions');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE TABLE promotions (id_promotion INT AUTO_INCREMENT NOT NULL, event_id INT NOT NULL, type VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL, start_at DATETIME NOT NULL, end_at DATETIME NOT NULL, price_amount NUMERIC(15, 2) NOT NULL, created_at DATETIME NOT NULL, INDEX IDX_EA1B303471F7E88B (event_id), PRIMARY KEY (id_promotion)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('ALTER TABLE promotions ADD CONSTRAINT FK_EA1B303471F7E88B FOREIGN KEY (event_id) REFERENCES events (id_event)');
        $this->addSql("INSERT INTO promotions (id_promotion, event_id, type, status, start_at, end_at, price_amount, created_at) SELECT campaign.id_promotion_campaign, campaign.event_id, CASE COALESCE(MIN(channel.channel_code), 'LAUNCH_PACK') WHEN 'SOCIAL_INFLUENCER' THEN 'SOCIAL' ELSE COALESCE(MIN(channel.channel_code), 'LAUNCH_PACK') END, campaign.status, campaign.starts_at, campaign.ends_at, campaign.total_price, campaign.created_at FROM promotion_campaigns campaign LEFT JOIN promotion_campaign_channels channel ON channel.promotion_campaign_id = campaign.id_promotion_campaign GROUP BY campaign.id_promotion_campaign, campaign.event_id, campaign.status, campaign.starts_at, campaign.ends_at, campaign.total_price, campaign.created_at");

        $this->addSql('ALTER TABLE orders DROP FOREIGN KEY FK_ORDER_PROMOTION_CAMPAIGN');
        $this->addSql('DROP INDEX IDX_E52FFDEE27C73EAE ON orders');
        $this->addSql('ALTER TABLE orders CHANGE promotion_campaign_id promotion_id INT DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_E52FFDEE139DF194 ON orders (promotion_id)');
        $this->addSql('ALTER TABLE orders ADD CONSTRAINT FK_E52FFDEE139DF194 FOREIGN KEY (promotion_id) REFERENCES promotions (id_promotion)');

        $this->addSql('ALTER TABLE promotion_campaign_channels DROP FOREIGN KEY FK_PROMO_CHANNEL_CAMPAIGN');
        $this->addSql('ALTER TABLE promotion_campaigns DROP FOREIGN KEY FK_PROMO_CAMPAIGN_EVENT');
        $this->addSql('ALTER TABLE promotion_campaigns DROP FOREIGN KEY FK_PROMO_CAMPAIGN_ORGANIZER');
        $this->addSql('ALTER TABLE promotion_campaigns DROP FOREIGN KEY FK_PROMO_CAMPAIGN_REVIEWER');
        $this->addSql('DROP TABLE promotion_campaign_channels');
        $this->addSql('DROP TABLE promotion_campaigns');
    }
}
