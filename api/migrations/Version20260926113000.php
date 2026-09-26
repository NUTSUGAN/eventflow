<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260926113000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add tourist localities to the curated city list without changing existing locations.';
    }

    public function up(Schema $schema): void
    {
        foreach (['Agbodrafo', 'Togoville', 'Badou', 'Bassar', 'Womé', 'Nadoba', 'Pya'] as $name) {
            $quotedName = $this->connection->quote($name);
            $this->addSql("INSERT INTO cities (name, active) SELECT $quotedName, 1 WHERE NOT EXISTS (SELECT 1 FROM cities WHERE name = $quotedName)");
        }
    }
}
