<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260522093000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add active or out-of-service state to organizer staff memberships';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("ALTER TABLE organizer_staff_members ADD status VARCHAR(30) NOT NULL DEFAULT 'active', ADD status_changed_at DATETIME DEFAULT NULL");
        $this->addSql("UPDATE organizer_staff_members SET status = 'active', status_changed_at = created_at WHERE status_changed_at IS NULL");
        $this->addSql('ALTER TABLE organizer_staff_members CHANGE status status VARCHAR(30) NOT NULL, CHANGE status_changed_at status_changed_at DATETIME NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE organizer_staff_members DROP COLUMN status, DROP COLUMN status_changed_at');
    }
}
