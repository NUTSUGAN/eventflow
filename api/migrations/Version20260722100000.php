<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260722100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add failed login tracking for account blocking.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD failed_login_attempts INT DEFAULT 0 NOT NULL AFTER account_status, ADD last_failed_login_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\' AFTER failed_login_attempts');
        $this->addSql('UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users DROP failed_login_attempts, DROP last_failed_login_at');
    }
}
