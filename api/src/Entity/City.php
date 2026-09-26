<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'cities')]
#[ORM\UniqueConstraint(name: 'UNIQ_CITY_NAME', columns: ['name'])]
class City
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    private string $name = '';

    #[ORM\Column(options: ['default' => true])]
    private bool $active = true;

    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function isActive(): bool { return $this->active; }
    public function setActive(bool $active): static { $this->active = $active; return $this; }

    public function setName(string $name): static
    {
        $name = preg_replace('/\s+/u', ' ', trim($name)) ?? '';
        if ('' === $name || mb_strlen($name) > 120) {
            throw new \InvalidArgumentException('Le nom de la ville doit contenir de 1 à 120 caractères.');
        }
        $this->name = $name;
        return $this;
    }

    public function toArray(): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'active' => $this->active];
    }
}
