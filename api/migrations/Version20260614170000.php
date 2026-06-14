<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260614170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add an administrable promotion pricing catalog separated from campaign snapshots.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE promotion_channel_rates (id_promotion_channel_rate INT AUTO_INCREMENT NOT NULL, channel_code VARCHAR(40) NOT NULL, duration VARCHAR(20) NOT NULL, price_amount NUMERIC(15, 2) NOT NULL, currency VARCHAR(3) DEFAULT 'EUR' NOT NULL, is_active TINYINT(1) DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX uniq_promotion_rate_channel_duration (channel_code, duration), PRIMARY KEY (id_promotion_channel_rate)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`");
        $this->addSql("INSERT INTO promotion_channel_rates (channel_code, duration, price_amount, currency, is_active, created_at, updated_at) VALUES ('LAUNCH_PACK', '7_days', 49.00, 'EUR', 1, NOW(), NOW()), ('LAUNCH_PACK', '14_days', 89.00, 'EUR', 1, NOW(), NOW()), ('LAUNCH_PACK', '30_days', 159.00, 'EUR', 1, NOW(), NOW()), ('SOCIAL_INFLUENCER', '7_days', 79.00, 'EUR', 1, NOW(), NOW()), ('SOCIAL_INFLUENCER', '14_days', 149.00, 'EUR', 1, NOW(), NOW()), ('SOCIAL_INFLUENCER', '30_days', 279.00, 'EUR', 1, NOW(), NOW()), ('NEWSLETTER', '7_days', 39.00, 'EUR', 1, NOW(), NOW()), ('NEWSLETTER', '14_days', 69.00, 'EUR', 1, NOW(), NOW()), ('NEWSLETTER', '30_days', 119.00, 'EUR', 1, NOW(), NOW())");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE promotion_channel_rates');
    }
}
