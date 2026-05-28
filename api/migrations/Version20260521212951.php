<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260521212951 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add organizer staff memberships and enrich checkins for QR scan validation';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE organizer_staff_members (id_organizer_staff_member INT AUTO_INCREMENT NOT NULL, created_at DATETIME NOT NULL, organizer_user_id INT NOT NULL, staff_user_id INT NOT NULL, INDEX IDX_BACA77BAEE5F645C (organizer_user_id), INDEX IDX_BACA77BAFBD8C423 (staff_user_id), UNIQUE INDEX uq_organizer_staff_pair (organizer_user_id, staff_user_id), PRIMARY KEY (id_organizer_staff_member)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE organizer_staff_members ADD CONSTRAINT FK_BACA77BAEE5F645C FOREIGN KEY (organizer_user_id) REFERENCES users (id_user)');
        $this->addSql('ALTER TABLE organizer_staff_members ADD CONSTRAINT FK_BACA77BAFBD8C423 FOREIGN KEY (staff_user_id) REFERENCES users (id_user)');
        $this->addSql('ALTER TABLE checkins ADD scanned_token VARCHAR(120) DEFAULT NULL, ADD event_id INT DEFAULT NULL, CHANGE ticket_id ticket_id INT DEFAULT NULL');
        $this->addSql('UPDATE checkins checkin INNER JOIN tickets ticket ON ticket.id_ticket = checkin.ticket_id INNER JOIN ticket_types ticket_type ON ticket_type.id_ticket_type = ticket.ticket_type_id SET checkin.event_id = ticket_type.event_id, checkin.scanned_token = COALESCE(checkin.scanned_token, ticket.qr_token) WHERE checkin.ticket_id IS NOT NULL');
        $this->addSql("UPDATE checkins SET scanned_token = COALESCE(scanned_token, '')");
        $this->addSql('ALTER TABLE checkins CHANGE scanned_token scanned_token VARCHAR(120) NOT NULL, CHANGE event_id event_id INT NOT NULL');
        $this->addSql('ALTER TABLE checkins ADD CONSTRAINT FK_9CE70FC571F7E88B FOREIGN KEY (event_id) REFERENCES events (id_event)');
        $this->addSql('CREATE INDEX IDX_9CE70FC571F7E88B ON checkins (event_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE checkins DROP FOREIGN KEY FK_9CE70FC571F7E88B');
        $this->addSql('DROP INDEX IDX_9CE70FC571F7E88B ON checkins');
        $this->addSql('ALTER TABLE checkins DROP COLUMN scanned_token, DROP COLUMN event_id, CHANGE ticket_id ticket_id INT NOT NULL');
        $this->addSql('ALTER TABLE organizer_staff_members DROP FOREIGN KEY FK_BACA77BAEE5F645C');
        $this->addSql('ALTER TABLE organizer_staff_members DROP FOREIGN KEY FK_BACA77BAFBD8C423');
        $this->addSql('DROP TABLE organizer_staff_members');
    }
}
