<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260531143000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add optional event video for archived events';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE events ADD event_video VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE events DROP event_video');
    }
}
