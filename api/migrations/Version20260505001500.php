<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260505001500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create organizer applications table for organizer access review workflow';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE organizer_applications (
            id_organizer_application INT AUTO_INCREMENT NOT NULL,
            user_id INT NOT NULL,
            status VARCHAR(20) NOT NULL,
            organization_name VARCHAR(160) NOT NULL,
            city VARCHAR(120) NOT NULL,
            phone VARCHAR(40) DEFAULT NULL,
            website VARCHAR(255) DEFAULT NULL,
            instagram_url VARCHAR(255) DEFAULT NULL,
            tiktok_url VARCHAR(255) DEFAULT NULL,
            linkedin_url VARCHAR(255) DEFAULT NULL,
            other_links LONGTEXT DEFAULT NULL,
            motivation LONGTEXT NOT NULL,
            review_note LONGTEXT DEFAULT NULL,
            submitted_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            reviewed_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            UNIQUE INDEX UNIQ_ORGANIZER_APPLICATION_USER (user_id),
            PRIMARY KEY(id_organizer_application)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE organizer_applications ADD CONSTRAINT FK_ORGANIZER_APPLICATION_USER FOREIGN KEY (user_id) REFERENCES users (id_user) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE organizer_applications DROP FOREIGN KEY FK_ORGANIZER_APPLICATION_USER');
        $this->addSql('DROP TABLE organizer_applications');
    }
}
