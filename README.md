# EventFlow

EventFlow est une application de gestion d'evenements developpee avec Symfony.
Le projet est actuellement en phase MVP / beta pour le jalon 5.

## Stack technique

- Backend : Symfony 7.4
- Base de donnees : MySQL / MariaDB
- Serveur local : Docker avec PHP-FPM et Nginx
- Tests : PHPUnit

## Structure du projet

```text
api/              Application Symfony
docker/           Configuration PHP-FPM et Nginx
docker-compose.yml Configuration des services locaux
```

## Lancement avec Docker

Depuis la racine du projet :

```bash
docker compose up -d --build
```

L'application est ensuite accessible sur :

```text
http://localhost:8080
```

L'API expose aussi une route de verification technique :

```text
http://localhost:8080/api/health
```

La configuration actuelle utilise une base MySQL locale accessible depuis Docker
via `host.docker.internal`.

## Commandes utiles

Depuis le dossier `api` :

```bash
php bin/console about
php bin/console doctrine:schema:validate
php bin/phpunit
```

## Variables d'environnement

Les fichiers `.env`, `.env.dev` et `.env.test` servent de configuration de base.
Le fichier `.env.local` reste local a la machine de developpement et ne doit pas
etre versionne.

## Etat actuel

- Les entites Doctrine principales sont en place.
- La migration initiale est executee.
- L'entite `User` est compatible avec Symfony Security.
- Les roles applicatifs sont prepares : `ROLE_CLIENT`, `ROLE_ORGANIZER`,
  `ROLE_STAFF`, `ROLE_ADMIN`.
- Le hachage des mots de passe est prepare avec Symfony Security.
