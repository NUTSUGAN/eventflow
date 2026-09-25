<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260925120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Replace Stripe references with FedaPay references and convert EUR amounts to XOF.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DROP INDEX UNIQ_9204A55D1A314A57 ON promotion_campaigns');
        $this->addSql('ALTER TABLE promotion_campaigns CHANGE stripe_session_id payment_reference_id VARCHAR(255) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_9204A55D70B569B3 ON promotion_campaigns (payment_reference_id)');
        $this->convertToXof();
    }

    public function down(Schema $schema): void
    {
        $this->convertToEur();
        $this->addSql('DROP INDEX UNIQ_9204A55D70B569B3 ON promotion_campaigns');
        $this->addSql('ALTER TABLE promotion_campaigns CHANGE payment_reference_id stripe_session_id VARCHAR(255) DEFAULT NULL');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_9204A55D1A314A57 ON promotion_campaigns (stripe_session_id)');
    }

    private function convertToXof(): void
    {
        $this->addSql("UPDATE orders SET total_amount = ROUND(total_amount * 655.957, 0), currency = 'XOF' WHERE currency = 'EUR'");
        $this->addSql('UPDATE order_items SET unit_price_at_purchase = ROUND(unit_price_at_purchase * 655.957, 0)');
        $this->addSql('UPDATE ticket_types SET base_price = ROUND(base_price * 655.957, 0)');
        $this->addSql("UPDATE payments SET amount = ROUND(amount * 655.957, 0), currency = 'XOF' WHERE currency = 'EUR'");
        $this->addSql("UPDATE promotion_campaigns SET total_price = ROUND(total_price * 655.957, 0), currency = 'XOF' WHERE currency = 'EUR'");
        $this->addSql("UPDATE promotion_channel_rates SET price_amount = ROUND(price_amount * 655.957, 0), currency = 'XOF' WHERE currency = 'EUR'");
        $this->addSql("UPDATE withdrawal_requests SET gross_amount = ROUND(gross_amount * 655.957, 0), fee_amount = ROUND(fee_amount * 655.957, 0), net_amount = ROUND(net_amount * 655.957, 0), currency = 'XOF' WHERE currency = 'EUR'");
    }

    private function convertToEur(): void
    {
        $this->addSql("UPDATE orders SET total_amount = ROUND(total_amount / 655.957, 2), currency = 'EUR' WHERE currency = 'XOF'");
        $this->addSql('UPDATE order_items SET unit_price_at_purchase = ROUND(unit_price_at_purchase / 655.957, 2)');
        $this->addSql('UPDATE ticket_types SET base_price = ROUND(base_price / 655.957, 2)');
        $this->addSql("UPDATE payments SET amount = ROUND(amount / 655.957, 2), currency = 'EUR' WHERE currency = 'XOF'");
        $this->addSql("UPDATE promotion_campaigns SET total_price = ROUND(total_price / 655.957, 2), currency = 'EUR' WHERE currency = 'XOF'");
        $this->addSql("UPDATE promotion_channel_rates SET price_amount = ROUND(price_amount / 655.957, 2), currency = 'EUR' WHERE currency = 'XOF'");
        $this->addSql("UPDATE withdrawal_requests SET gross_amount = ROUND(gross_amount / 655.957, 2), fee_amount = ROUND(fee_amount / 655.957, 2), net_amount = ROUND(net_amount / 655.957, 2), currency = 'EUR' WHERE currency = 'XOF'");
    }
}
