<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260514103000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Make location latitude and longitude optional';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE locations CHANGE latitude latitude NUMERIC(10, 7) DEFAULT NULL, CHANGE longitude longitude NUMERIC(10, 7) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('UPDATE locations SET latitude = 0.0000000 WHERE latitude IS NULL');
        $this->addSql('UPDATE locations SET longitude = 0.0000000 WHERE longitude IS NULL');
        $this->addSql('ALTER TABLE locations CHANGE latitude latitude NUMERIC(10, 7) NOT NULL, CHANGE longitude longitude NUMERIC(10, 7) NOT NULL');
    }
}
