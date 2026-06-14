<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260614200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Backfill paid Booster campaigns as promotion orders with Stripe payments.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("INSERT INTO orders (client_user_id, promotion_campaign_id, reference, status, order_type, total_amount, currency, created_at) SELECT campaign.organizer_user_id, campaign.id_promotion_campaign, CONCAT('BST-', DATE_FORMAT(campaign.paid_at, '%Y%m%d'), '-', LPAD(campaign.id_promotion_campaign, 6, '0')), 'paid', 'promotion', campaign.total_price, campaign.currency, campaign.paid_at FROM promotion_campaigns campaign WHERE campaign.paid_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM orders existing_order WHERE existing_order.promotion_campaign_id = campaign.id_promotion_campaign)");
        $this->addSql("INSERT INTO payments (order_id, provider, provider_payment_id, amount, currency, status, paid_at) SELECT customer_order.id_order, 'stripe', COALESCE(campaign.stripe_session_id, CONCAT('promotion-', campaign.id_promotion_campaign)), customer_order.total_amount, customer_order.currency, 'paid', campaign.paid_at FROM orders customer_order INNER JOIN promotion_campaigns campaign ON campaign.id_promotion_campaign = customer_order.promotion_campaign_id WHERE customer_order.order_type = 'promotion' AND NOT EXISTS (SELECT 1 FROM payments existing_payment WHERE existing_payment.order_id = customer_order.id_order)");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DELETE payment FROM payments payment INNER JOIN orders customer_order ON customer_order.id_order = payment.order_id WHERE customer_order.order_type = 'promotion'");
        $this->addSql("DELETE FROM orders WHERE order_type = 'promotion'");
    }
}
