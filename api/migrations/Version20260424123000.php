<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260424123000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add optional profile photo to users';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD profile_photo VARCHAR(255) DEFAULT NULL AFTER role');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP profile_photo');
    }
}
