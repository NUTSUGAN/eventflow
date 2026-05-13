<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260429124500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove technical type field from ticket types';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ticket_types DROP type');
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE ticket_types ADD type VARCHAR(30) NOT NULL DEFAULT 'standard'");
    }
}
