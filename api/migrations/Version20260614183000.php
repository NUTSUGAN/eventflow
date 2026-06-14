<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260614183000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add manual launch placement activation and metrics grouped by public placement.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE promotion_campaign_channels ADD is_featured TINYINT(1) DEFAULT 0 NOT NULL AFTER delivery_status");
        $this->addSql("CREATE TABLE promotion_campaign_metrics (id_promotion_campaign_metric INT AUTO_INCREMENT NOT NULL, promotion_campaign_id INT NOT NULL, placement VARCHAR(30) NOT NULL, impressions INT DEFAULT 0 NOT NULL, clicks INT DEFAULT 0 NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, INDEX IDX_65495A3B27C73EAE (promotion_campaign_id), UNIQUE INDEX uniq_promotion_metric_placement (promotion_campaign_id, placement), PRIMARY KEY (id_promotion_campaign_metric)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`");
        $this->addSql('ALTER TABLE promotion_campaign_metrics ADD CONSTRAINT FK_PROMO_METRIC_CAMPAIGN FOREIGN KEY (promotion_campaign_id) REFERENCES promotion_campaigns (id_promotion_campaign) ON DELETE CASCADE');
        $this->addSql("INSERT INTO promotion_campaign_metrics (promotion_campaign_id, placement, impressions, clicks, created_at, updated_at) SELECT promotion_campaign_id, 'homepage', SUM(impressions), SUM(clicks), NOW(), NOW() FROM promotion_campaign_channels GROUP BY promotion_campaign_id");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE promotion_campaign_metrics DROP FOREIGN KEY FK_PROMO_METRIC_CAMPAIGN');
        $this->addSql('DROP TABLE promotion_campaign_metrics');
        $this->addSql('ALTER TABLE promotion_campaign_channels DROP is_featured');
    }
}
