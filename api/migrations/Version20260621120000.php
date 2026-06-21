<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260621120000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add organizer payout accounts and payout snapshots on withdrawal requests.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE organizer_payout_accounts (id_organizer_payout_account INT AUTO_INCREMENT NOT NULL, organizer_user_id INT NOT NULL, type VARCHAR(30) NOT NULL, label VARCHAR(120) DEFAULT NULL, holder_name VARCHAR(160) DEFAULT NULL, iban VARCHAR(80) DEFAULT NULL, bic VARCHAR(40) DEFAULT NULL, bank_name VARCHAR(120) DEFAULT NULL, mobile_money_name VARCHAR(160) DEFAULT NULL, mobile_money_phone VARCHAR(40) DEFAULT NULL, mobile_money_provider VARCHAR(80) DEFAULT NULL, mobile_money_country VARCHAR(80) DEFAULT NULL, is_active TINYINT(1) DEFAULT 1 NOT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', replaced_at DATETIME DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_E9BDA8C59C79A41D (organizer_user_id), INDEX idx_organizer_payout_active (organizer_user_id, is_active), PRIMARY KEY(id_organizer_payout_account)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql('ALTER TABLE organizer_payout_accounts ADD CONSTRAINT FK_E9BDA8C59C79A41D FOREIGN KEY (organizer_user_id) REFERENCES users (id_user) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE withdrawal_requests ADD payout_type VARCHAR(30) DEFAULT NULL');
        $this->addSql('ALTER TABLE withdrawal_requests ADD payout_label VARCHAR(120) DEFAULT NULL');
        $this->addSql('ALTER TABLE withdrawal_requests ADD bank_holder_name VARCHAR(160) DEFAULT NULL');
        $this->addSql('ALTER TABLE withdrawal_requests ADD bank_iban VARCHAR(80) DEFAULT NULL');
        $this->addSql('ALTER TABLE withdrawal_requests ADD bank_bic VARCHAR(40) DEFAULT NULL');
        $this->addSql('ALTER TABLE withdrawal_requests ADD bank_name VARCHAR(120) DEFAULT NULL');
        $this->addSql('ALTER TABLE withdrawal_requests ADD mobile_money_name VARCHAR(160) DEFAULT NULL');
        $this->addSql('ALTER TABLE withdrawal_requests ADD mobile_money_phone VARCHAR(40) DEFAULT NULL');
        $this->addSql('ALTER TABLE withdrawal_requests ADD mobile_money_provider VARCHAR(80) DEFAULT NULL');
        $this->addSql('ALTER TABLE withdrawal_requests ADD mobile_money_country VARCHAR(80) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE organizer_payout_accounts DROP FOREIGN KEY FK_E9BDA8C59C79A41D');
        $this->addSql('DROP TABLE organizer_payout_accounts');
        $this->addSql('ALTER TABLE withdrawal_requests DROP payout_type');
        $this->addSql('ALTER TABLE withdrawal_requests DROP payout_label');
        $this->addSql('ALTER TABLE withdrawal_requests DROP bank_holder_name');
        $this->addSql('ALTER TABLE withdrawal_requests DROP bank_iban');
        $this->addSql('ALTER TABLE withdrawal_requests DROP bank_bic');
        $this->addSql('ALTER TABLE withdrawal_requests DROP bank_name');
        $this->addSql('ALTER TABLE withdrawal_requests DROP mobile_money_name');
        $this->addSql('ALTER TABLE withdrawal_requests DROP mobile_money_phone');
        $this->addSql('ALTER TABLE withdrawal_requests DROP mobile_money_provider');
        $this->addSql('ALTER TABLE withdrawal_requests DROP mobile_money_country');
    }
}
