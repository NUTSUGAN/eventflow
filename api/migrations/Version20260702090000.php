<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260702090000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add persistent admin audit logs.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("CREATE TABLE admin_audit_logs (id_admin_audit_log INT AUTO_INCREMENT NOT NULL, actor_user_id INT DEFAULT NULL, actor_email VARCHAR(180) DEFAULT NULL, actor_role VARCHAR(40) NOT NULL, action VARCHAR(80) NOT NULL, resource_type VARCHAR(80) NOT NULL, resource_id VARCHAR(80) DEFAULT NULL, resource_label VARCHAR(255) DEFAULT NULL, status VARCHAR(20) NOT NULL, metadata JSON NOT NULL COMMENT '(DC2Type:json)', created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', INDEX IDX_60E0E238700E00F (actor_user_id), INDEX idx_admin_audit_created_at (created_at), INDEX idx_admin_audit_action (action), INDEX idx_admin_audit_resource_type (resource_type), INDEX idx_admin_audit_actor_role (actor_role), PRIMARY KEY(id_admin_audit_log)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB");
        $this->addSql('ALTER TABLE admin_audit_logs ADD CONSTRAINT FK_60E0E238700E00F FOREIGN KEY (actor_user_id) REFERENCES users (id_user) ON DELETE SET NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE admin_audit_logs DROP FOREIGN KEY FK_60E0E238700E00F');
        $this->addSql('DROP TABLE admin_audit_logs');
    }
}
