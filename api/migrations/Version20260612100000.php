<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260612100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add invitation metadata to tickets.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE tickets ADD source VARCHAR(20) DEFAULT 'purchase' NOT NULL, ADD recipient_email VARCHAR(180) DEFAULT NULL, ADD recipient_name VARCHAR(120) DEFAULT NULL, ADD sent_at DATETIME DEFAULT NULL");
        $this->addSql("UPDATE tickets SET source = 'purchase' WHERE source IS NULL OR source = ''");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE tickets DROP source, DROP recipient_email, DROP recipient_name, DROP sent_at');
    }
}
