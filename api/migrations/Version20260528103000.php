<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260528103000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add account status to users';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE users ADD account_status VARCHAR(20) NOT NULL DEFAULT 'active' AFTER role");
        $this->addSql("UPDATE users SET account_status = 'active' WHERE account_status IS NULL OR account_status = ''");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP COLUMN account_status');
    }
}
