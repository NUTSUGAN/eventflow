<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260429103000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add description to ticket types';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ticket_types ADD description LONGTEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE ticket_types DROP description');
    }
}
