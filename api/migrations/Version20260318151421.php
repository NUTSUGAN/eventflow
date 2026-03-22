<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260318151421 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE abonnements_organisateur (id_abonnement INT AUTO_INCREMENT NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, client_user_id INT NOT NULL, organizer_user_id INT NOT NULL, INDEX IDX_D33EAB83F55397E8 (client_user_id), INDEX IDX_D33EAB83EE5F645C (organizer_user_id), PRIMARY KEY (id_abonnement)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE categories (id_category INT AUTO_INCREMENT NOT NULL, name VARCHAR(80) NOT NULL, description LONGTEXT NOT NULL, PRIMARY KEY (id_category)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE checkins (id_checkin INT AUTO_INCREMENT NOT NULL, scanned_at DATETIME NOT NULL, result VARCHAR(20) NOT NULL, ticket_id INT NOT NULL, staff_user_id INT NOT NULL, INDEX IDX_9CE70FC5700047D2 (ticket_id), INDEX IDX_9CE70FC5FBD8C423 (staff_user_id), PRIMARY KEY (id_checkin)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE events (id_event INT AUTO_INCREMENT NOT NULL, title VARCHAR(160) NOT NULL, description LONGTEXT NOT NULL, start_datetime DATETIME NOT NULL, end_datetime DATETIME NOT NULL, capacity INT NOT NULL, thumbnail_photo VARCHAR(255) NOT NULL, cover_photo VARCHAR(255) NOT NULL, status VARCHAR(30) NOT NULL, created_at DATETIME NOT NULL, organizer_user_id INT NOT NULL, category_id INT NOT NULL, location_id INT NOT NULL, INDEX IDX_5387574AEE5F645C (organizer_user_id), INDEX IDX_5387574A12469DE2 (category_id), INDEX IDX_5387574A64D218E (location_id), PRIMARY KEY (id_event)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE locations (id_location INT AUTO_INCREMENT NOT NULL, address VARCHAR(255) NOT NULL, city VARCHAR(120) NOT NULL, postal_code VARCHAR(20) NOT NULL, country VARCHAR(80) NOT NULL, latitude NUMERIC(10, 7) NOT NULL, longitude NUMERIC(10, 7) NOT NULL, PRIMARY KEY (id_location)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE order_items (id_order_item INT AUTO_INCREMENT NOT NULL, quantity INT NOT NULL, unit_price_at_purchase NUMERIC(15, 2) NOT NULL, order_id INT NOT NULL, ticket_type_id INT NOT NULL, INDEX IDX_62809DB08D9F6D38 (order_id), INDEX IDX_62809DB0C980D5C1 (ticket_type_id), PRIMARY KEY (id_order_item)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE orders (id_order INT AUTO_INCREMENT NOT NULL, reference VARCHAR(40) NOT NULL, status VARCHAR(20) NOT NULL, order_type VARCHAR(20) NOT NULL, total_amount NUMERIC(15, 2) NOT NULL, currency VARCHAR(3) NOT NULL, created_at DATETIME NOT NULL, client_user_id INT NOT NULL, promotion_id INT DEFAULT NULL, INDEX IDX_E52FFDEEF55397E8 (client_user_id), INDEX IDX_E52FFDEE139DF194 (promotion_id), PRIMARY KEY (id_order)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE payments (id_payment INT AUTO_INCREMENT NOT NULL, provider VARCHAR(20) NOT NULL, provider_payment_id VARCHAR(120) NOT NULL, amount NUMERIC(15, 2) NOT NULL, currency VARCHAR(3) NOT NULL, status VARCHAR(20) NOT NULL, paid_at DATETIME NOT NULL, order_id INT NOT NULL, UNIQUE INDEX UNIQ_65D29B328D9F6D38 (order_id), PRIMARY KEY (id_payment)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE promotions (id_promotion INT AUTO_INCREMENT NOT NULL, type VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL, start_at DATETIME NOT NULL, end_at DATETIME NOT NULL, price_amount NUMERIC(15, 2) NOT NULL, created_at DATETIME NOT NULL, event_id INT NOT NULL, INDEX IDX_EA1B303471F7E88B (event_id), PRIMARY KEY (id_promotion)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE ticket_types (id_ticket_type INT AUTO_INCREMENT NOT NULL, name VARCHAR(60) NOT NULL, base_price NUMERIC(15, 2) NOT NULL, stock INT NOT NULL, sale_start_at DATETIME NOT NULL, sale_end_at DATETIME NOT NULL, event_id INT NOT NULL, INDEX IDX_7100EABB71F7E88B (event_id), PRIMARY KEY (id_ticket_type)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE tickets (id_ticket INT AUTO_INCREMENT NOT NULL, qr_token VARCHAR(80) NOT NULL, status VARCHAR(20) NOT NULL, issued_at DATETIME NOT NULL, order_id INT NOT NULL, ticket_type_id INT NOT NULL, INDEX IDX_54469DF48D9F6D38 (order_id), INDEX IDX_54469DF4C980D5C1 (ticket_type_id), PRIMARY KEY (id_ticket)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE users (id_user INT AUTO_INCREMENT NOT NULL, first_name VARCHAR(80) NOT NULL, last_name VARCHAR(80) NOT NULL, email VARCHAR(180) NOT NULL, password_hash VARCHAR(255) NOT NULL, role VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_1483A5E9E7927C74 (email), PRIMARY KEY (id_user)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL, available_at DATETIME NOT NULL, delivered_at DATETIME DEFAULT NULL, INDEX IDX_75EA56E0FB7336F0E3BD61CE16BA31DBBF396750 (queue_name, available_at, delivered_at, id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('ALTER TABLE abonnements_organisateur ADD CONSTRAINT FK_D33EAB83F55397E8 FOREIGN KEY (client_user_id) REFERENCES users (id_user)');
        $this->addSql('ALTER TABLE abonnements_organisateur ADD CONSTRAINT FK_D33EAB83EE5F645C FOREIGN KEY (organizer_user_id) REFERENCES users (id_user)');
        $this->addSql('ALTER TABLE checkins ADD CONSTRAINT FK_9CE70FC5700047D2 FOREIGN KEY (ticket_id) REFERENCES tickets (id_ticket)');
        $this->addSql('ALTER TABLE checkins ADD CONSTRAINT FK_9CE70FC5FBD8C423 FOREIGN KEY (staff_user_id) REFERENCES users (id_user)');
        $this->addSql('ALTER TABLE events ADD CONSTRAINT FK_5387574AEE5F645C FOREIGN KEY (organizer_user_id) REFERENCES users (id_user)');
        $this->addSql('ALTER TABLE events ADD CONSTRAINT FK_5387574A12469DE2 FOREIGN KEY (category_id) REFERENCES categories (id_category)');
        $this->addSql('ALTER TABLE events ADD CONSTRAINT FK_5387574A64D218E FOREIGN KEY (location_id) REFERENCES locations (id_location)');
        $this->addSql('ALTER TABLE order_items ADD CONSTRAINT FK_62809DB08D9F6D38 FOREIGN KEY (order_id) REFERENCES orders (id_order)');
        $this->addSql('ALTER TABLE order_items ADD CONSTRAINT FK_62809DB0C980D5C1 FOREIGN KEY (ticket_type_id) REFERENCES ticket_types (id_ticket_type)');
        $this->addSql('ALTER TABLE orders ADD CONSTRAINT FK_E52FFDEEF55397E8 FOREIGN KEY (client_user_id) REFERENCES users (id_user)');
        $this->addSql('ALTER TABLE orders ADD CONSTRAINT FK_E52FFDEE139DF194 FOREIGN KEY (promotion_id) REFERENCES promotions (id_promotion)');
        $this->addSql('ALTER TABLE payments ADD CONSTRAINT FK_65D29B328D9F6D38 FOREIGN KEY (order_id) REFERENCES orders (id_order)');
        $this->addSql('ALTER TABLE promotions ADD CONSTRAINT FK_EA1B303471F7E88B FOREIGN KEY (event_id) REFERENCES events (id_event)');
        $this->addSql('ALTER TABLE ticket_types ADD CONSTRAINT FK_7100EABB71F7E88B FOREIGN KEY (event_id) REFERENCES events (id_event)');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF48D9F6D38 FOREIGN KEY (order_id) REFERENCES orders (id_order)');
        $this->addSql('ALTER TABLE tickets ADD CONSTRAINT FK_54469DF4C980D5C1 FOREIGN KEY (ticket_type_id) REFERENCES ticket_types (id_ticket_type)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE abonnements_organisateur DROP FOREIGN KEY FK_D33EAB83F55397E8');
        $this->addSql('ALTER TABLE abonnements_organisateur DROP FOREIGN KEY FK_D33EAB83EE5F645C');
        $this->addSql('ALTER TABLE checkins DROP FOREIGN KEY FK_9CE70FC5700047D2');
        $this->addSql('ALTER TABLE checkins DROP FOREIGN KEY FK_9CE70FC5FBD8C423');
        $this->addSql('ALTER TABLE events DROP FOREIGN KEY FK_5387574AEE5F645C');
        $this->addSql('ALTER TABLE events DROP FOREIGN KEY FK_5387574A12469DE2');
        $this->addSql('ALTER TABLE events DROP FOREIGN KEY FK_5387574A64D218E');
        $this->addSql('ALTER TABLE order_items DROP FOREIGN KEY FK_62809DB08D9F6D38');
        $this->addSql('ALTER TABLE order_items DROP FOREIGN KEY FK_62809DB0C980D5C1');
        $this->addSql('ALTER TABLE orders DROP FOREIGN KEY FK_E52FFDEEF55397E8');
        $this->addSql('ALTER TABLE orders DROP FOREIGN KEY FK_E52FFDEE139DF194');
        $this->addSql('ALTER TABLE payments DROP FOREIGN KEY FK_65D29B328D9F6D38');
        $this->addSql('ALTER TABLE promotions DROP FOREIGN KEY FK_EA1B303471F7E88B');
        $this->addSql('ALTER TABLE ticket_types DROP FOREIGN KEY FK_7100EABB71F7E88B');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF48D9F6D38');
        $this->addSql('ALTER TABLE tickets DROP FOREIGN KEY FK_54469DF4C980D5C1');
        $this->addSql('DROP TABLE abonnements_organisateur');
        $this->addSql('DROP TABLE categories');
        $this->addSql('DROP TABLE checkins');
        $this->addSql('DROP TABLE events');
        $this->addSql('DROP TABLE locations');
        $this->addSql('DROP TABLE order_items');
        $this->addSql('DROP TABLE orders');
        $this->addSql('DROP TABLE payments');
        $this->addSql('DROP TABLE promotions');
        $this->addSql('DROP TABLE ticket_types');
        $this->addSql('DROP TABLE tickets');
        $this->addSql('DROP TABLE users');
        $this->addSql('DROP TABLE messenger_messages');
    }
}
