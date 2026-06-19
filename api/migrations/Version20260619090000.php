<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260619090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add organizer withdrawal requests, withdrawal settings, and frozen event withdrawal fees.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE events ADD withdrawal_fee_percent NUMERIC(5, 2) DEFAULT '0.00' NOT NULL");
        $this->addSql("CREATE TABLE withdrawal_settings (id_withdrawal_setting INT AUTO_INCREMENT NOT NULL, default_fee_percent NUMERIC(5, 2) DEFAULT '0.00' NOT NULL, updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', PRIMARY KEY(id_withdrawal_setting)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql("INSERT INTO withdrawal_settings (default_fee_percent, updated_at) VALUES ('0.00', NOW())");
        $this->addSql("CREATE TABLE withdrawal_requests (id_withdrawal_request INT AUTO_INCREMENT NOT NULL, event_id INT NOT NULL, organizer_user_id INT NOT NULL, reviewed_by_user_id INT DEFAULT NULL, status VARCHAR(20) DEFAULT 'pending' NOT NULL, gross_amount NUMERIC(15, 2) NOT NULL, fee_percent NUMERIC(5, 2) NOT NULL, fee_amount NUMERIC(15, 2) NOT NULL, net_amount NUMERIC(15, 2) NOT NULL, currency VARCHAR(3) DEFAULT 'EUR' NOT NULL, admin_note LONGTEXT DEFAULT NULL, payment_reference VARCHAR(120) DEFAULT NULL, requested_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', reviewed_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', paid_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', updated_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_7B7AA1F571F7E88B (event_id), INDEX IDX_7B7AA1F59C79A41D (organizer_user_id), INDEX IDX_7B7AA1F5B759E10F (reviewed_by_user_id), INDEX idx_withdrawal_status (status), PRIMARY KEY(id_withdrawal_request)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql("ALTER TABLE withdrawal_requests ADD CONSTRAINT FK_7B7AA1F571F7E88B FOREIGN KEY (event_id) REFERENCES events (id_event) ON DELETE CASCADE");
        $this->addSql("ALTER TABLE withdrawal_requests ADD CONSTRAINT FK_7B7AA1F59C79A41D FOREIGN KEY (organizer_user_id) REFERENCES users (id_user) ON DELETE CASCADE");
        $this->addSql("ALTER TABLE withdrawal_requests ADD CONSTRAINT FK_7B7AA1F5B759E10F FOREIGN KEY (reviewed_by_user_id) REFERENCES users (id_user) ON DELETE SET NULL");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE withdrawal_requests DROP FOREIGN KEY FK_7B7AA1F571F7E88B');
        $this->addSql('ALTER TABLE withdrawal_requests DROP FOREIGN KEY FK_7B7AA1F59C79A41D');
        $this->addSql('ALTER TABLE withdrawal_requests DROP FOREIGN KEY FK_7B7AA1F5B759E10F');
        $this->addSql('DROP TABLE withdrawal_requests');
        $this->addSql('DROP TABLE withdrawal_settings');
        $this->addSql('ALTER TABLE events DROP withdrawal_fee_percent');
    }
}
