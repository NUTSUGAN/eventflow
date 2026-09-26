<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926110000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add initial curated places in Togo without changing existing locations.';
    }

    public function up(Schema $schema): void
    {
        foreach (['Lomé', 'Adidogomé', 'Agoè', 'Bè', 'Tsévié', 'Aného', 'Kpalimé', 'Atakpamé', 'Sokodé', 'Kara', 'Dapaong'] as $name) {
            $quotedName = $this->connection->quote($name);
            $this->addSql("INSERT INTO cities (name, active) SELECT $quotedName, 1 WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = $quotedName)");
        }
    }
}
