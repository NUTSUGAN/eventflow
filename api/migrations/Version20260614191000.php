<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260614191000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Align the Booster metric campaign index with Doctrine naming.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE promotion_campaign_metrics DROP FOREIGN KEY FK_PROMO_METRIC_CAMPAIGN');
        $this->addSql('DROP INDEX IDX_4E53C0F927C73EAE ON promotion_campaign_metrics');
        $this->addSql('CREATE INDEX IDX_65495A3B27C73EAE ON promotion_campaign_metrics (promotion_campaign_id)');
        $this->addSql('ALTER TABLE promotion_campaign_metrics ADD CONSTRAINT FK_PROMO_METRIC_CAMPAIGN FOREIGN KEY (promotion_campaign_id) REFERENCES promotion_campaigns (id_promotion_campaign) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE promotion_campaign_metrics DROP FOREIGN KEY FK_PROMO_METRIC_CAMPAIGN');
        $this->addSql('DROP INDEX IDX_65495A3B27C73EAE ON promotion_campaign_metrics');
        $this->addSql('CREATE INDEX IDX_4E53C0F927C73EAE ON promotion_campaign_metrics (promotion_campaign_id)');
        $this->addSql('ALTER TABLE promotion_campaign_metrics ADD CONSTRAINT FK_PROMO_METRIC_CAMPAIGN FOREIGN KEY (promotion_campaign_id) REFERENCES promotion_campaigns (id_promotion_campaign) ON DELETE CASCADE');
    }
}
