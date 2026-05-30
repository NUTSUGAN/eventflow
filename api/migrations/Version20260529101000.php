<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260529101000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add event reports table';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE event_reports (id_event_report INT AUTO_INCREMENT NOT NULL, event_id INT NOT NULL, reporter_user_id INT NOT NULL, reason VARCHAR(80) NOT NULL, details LONGTEXT DEFAULT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending', created_at DATETIME NOT NULL, INDEX IDX_AE50C91871F7E88B (event_id), INDEX IDX_AE50C918D364C876 (reporter_user_id), PRIMARY KEY(id_event_report)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql('ALTER TABLE event_reports ADD CONSTRAINT FK_AE50C91871F7E88B FOREIGN KEY (event_id) REFERENCES events (id_event) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE event_reports ADD CONSTRAINT FK_AE50C918D364C876 FOREIGN KEY (reporter_user_id) REFERENCES users (id_user) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE event_reports');
    }
}
