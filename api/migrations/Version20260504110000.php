<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260504110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add password reset requests table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE password_reset_requests (id_password_reset_request INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, token_hash VARCHAR(64) NOT NULL, requested_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', expires_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', used_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', UNIQUE INDEX UNIQ_6E234B4BA76ED395 (token_hash), INDEX IDX_6E234B4BA76ED395 (user_id), PRIMARY KEY(id_password_reset_request)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE password_reset_requests ADD CONSTRAINT FK_6E234B4BA76ED395 FOREIGN KEY (user_id) REFERENCES users (id_user) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE password_reset_requests');
    }
}
