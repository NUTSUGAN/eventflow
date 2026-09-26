<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926100000 extends AbstractMigration
{
    public function getDescription(): string { return 'Add curated cities, optional postal codes and local bank account references.'; }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE cities (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(120) NOT NULL, active TINYINT(1) DEFAULT 1 NOT NULL, UNIQUE INDEX UNIQ_CITY_NAME (name), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE locations ADD city_id INT DEFAULT NULL, MODIFY postal_code VARCHAR(20) DEFAULT NULL');
        $this->addSql('CREATE INDEX IDX_LOCATION_CITY ON locations (city_id)');
        $this->addSql('ALTER TABLE locations ADD CONSTRAINT FK_LOCATION_CITY FOREIGN KEY (city_id) REFERENCES cities (id)');
        $this->addSql('ALTER TABLE organizer_payout_accounts ADD bank_account_reference VARCHAR(120) DEFAULT NULL');
        $this->addSql('ALTER TABLE withdrawal_requests ADD bank_account_reference VARCHAR(120) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE locations DROP FOREIGN KEY FK_LOCATION_CITY');
        $this->addSql('ALTER TABLE locations DROP city_id');
        $this->addSql("UPDATE locations SET postal_code = '' WHERE postal_code IS NULL");
        $this->addSql('ALTER TABLE locations MODIFY postal_code VARCHAR(20) NOT NULL');
        $this->addSql('DROP TABLE cities');
        $this->addSql('ALTER TABLE organizer_payout_accounts DROP bank_account_reference');
        $this->addSql('ALTER TABLE withdrawal_requests DROP bank_account_reference');
    }
}
