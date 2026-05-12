<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260502113000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add policy consent fields, newsletter subscriptions, and user OAuth accounts';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE users ADD terms_accepted_at DATETIME DEFAULT NULL AFTER profile_photo, ADD privacy_accepted_at DATETIME DEFAULT NULL AFTER terms_accepted_at');
        $this->addSql('CREATE TABLE newsletter_subscriptions (id_newsletter_subscription INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, email VARCHAR(180) NOT NULL, status VARCHAR(20) NOT NULL, source VARCHAR(40) NOT NULL, consented_at DATETIME NOT NULL, unsubscribed_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX uq_newsletter_email (email), INDEX IDX_4B7E7883A76ED395 (user_id), PRIMARY KEY (id_newsletter_subscription)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE user_oauth_accounts (id_user_oauth_account INT AUTO_INCREMENT NOT NULL, user_id INT NOT NULL, provider VARCHAR(40) NOT NULL, provider_user_id VARCHAR(190) NOT NULL, provider_email VARCHAR(180) DEFAULT NULL, created_at DATETIME NOT NULL, INDEX IDX_82ED7777A76ED395 (user_id), UNIQUE INDEX uq_user_oauth_provider_identity (provider, provider_user_id), PRIMARY KEY (id_user_oauth_account)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('ALTER TABLE newsletter_subscriptions ADD CONSTRAINT FK_4B7E7883A76ED395 FOREIGN KEY (user_id) REFERENCES users (id_user) ON DELETE SET NULL');
        $this->addSql('ALTER TABLE user_oauth_accounts ADD CONSTRAINT FK_82ED7777A76ED395 FOREIGN KEY (user_id) REFERENCES users (id_user) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE newsletter_subscriptions DROP FOREIGN KEY FK_4B7E7883A76ED395');
        $this->addSql('ALTER TABLE user_oauth_accounts DROP FOREIGN KEY FK_82ED7777A76ED395');
        $this->addSql('DROP TABLE newsletter_subscriptions');
        $this->addSql('DROP TABLE user_oauth_accounts');
        $this->addSql('ALTER TABLE users DROP terms_accepted_at, DROP privacy_accepted_at');
    }
}
