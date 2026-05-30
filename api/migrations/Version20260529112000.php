<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260529112000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add email change requests table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE email_change_requests (id_email_change_request INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, current_email VARCHAR(180) NOT NULL, new_email VARCHAR(180) NOT NULL, token_hash VARCHAR(64) NOT NULL, requested_at DATETIME NOT NULL, expires_at DATETIME NOT NULL, used_at DATETIME DEFAULT NULL, UNIQUE INDEX UNIQ_34DB7A2F2C8706F2 (token_hash), INDEX IDX_34DB7A2FA76ED395 (user_id), PRIMARY KEY(id_email_change_request)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE email_change_requests ADD CONSTRAINT FK_34DB7A2FA76ED395 FOREIGN KEY (user_id) REFERENCES users (id_user) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE email_change_requests');
    }
}
