# EventFlow

EventFlow est une plateforme de billetterie evenementielle developpee en
Symfony et React. Le projet est actuellement en version beta pour le jalon 5 :
les parcours principaux sont fonctionnels, testables et proches d'une version
exploitable, avec encore quelques finitions avant production.

## Objectif du projet

EventFlow permet a des organisateurs de creer des evenements, vendre des
billets en ligne, suivre leurs ventes, gerer un staff de scan et controler les
entrees via QR Code.

L'application se compose de plusieurs espaces :

- Espace client : exploration des evenements, achat de billets, suivi des
  organisateurs, espace "Mes billets".
- Espace organisateur : tableau de bord, creation et gestion d'evenements,
  billets, staff, statistiques et video souvenir pour les evenements termines.
- Espace staff : scan des billets avec douchette, camera ou image locale.
- Espace administrateur : supervision des utilisateurs, demandes
  organisateur, evenements, categories, commandes, paiements, billets et
  check-ins.

## Stack technique

- Backend : Symfony 7.4
- Frontend : React, TypeScript, Vite
- Base de donnees : MySQL / MariaDB
- ORM : Doctrine
- Paiement : Stripe
- Email local : Mailpit
- Scan QR : html5-qrcode et douchette clavier
- Tests backend : PHPUnit
- Qualite frontend : TypeScript, ESLint
- Environnement local : Docker pour le backend, Nginx, PHP-FPM et Mailpit

## Structure du projet

```text
api/                 Application Symfony
front/               Application React / Vite
docker/              Configuration PHP-FPM et Nginx
docker-compose.yml   Services locaux backend, nginx et mailpit
```

## Lancement local

### 1. Backend Symfony avec Docker

Depuis la racine du projet :

```bash
docker compose up -d --build
```

Le backend est ensuite accessible sur :

```text
http://localhost:8080
```

Route de verification technique :

```text
http://localhost:8080/api/health
```

Mailpit est accessible sur :

```text
http://localhost:8025
```

La configuration Docker actuelle utilise une base MySQL / MariaDB locale
accessible depuis le conteneur via `host.docker.internal`.

### 2. Frontend React

Le frontend se lance actuellement separement depuis le dossier `front` :

```bash
cd front
npm install
npm run dev
```

L'application React est ensuite accessible sur :

```text
http://localhost:5173
```

Note : l'integration complete de React dans Docker est prevue dans les
ameliorations restantes afin de lancer toute l'application avec une seule
commande.

## Variables d'environnement

Les fichiers `.env`, `.env.dev` et `.env.test` servent de configuration de base
pour Symfony.

Les valeurs locales sensibles doivent etre placees dans un fichier `.env.local`
non versionne.

Variables importantes cote backend :

```text
DATABASE_URL
MAILER_DSN
FRONTEND_APP_URL
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_CHECKOUT_SUCCESS_URL
STRIPE_CHECKOUT_CANCEL_URL
```

## Commandes utiles backend

Depuis le dossier `api` :

```bash
php bin/console about
php bin/console doctrine:migrations:migrate
php bin/console doctrine:schema:validate
php bin/console cache:clear
php bin/phpunit
```

Depuis Docker, il est aussi possible d'executer les commandes Symfony avec :

```bash
docker compose exec app php bin/console about
docker compose exec app php bin/phpunit
```

## Commandes utiles frontend

Depuis le dossier `front` :

```bash
npm install
npm run dev
npm run build
npm run lint
```

Etat actuel :

- `npm run build` fonctionne.
- `npm run lint` detecte encore quelques erreurs React Hooks / rendu a corriger
  avant une version finale.

## Tests

Les tests automatises backend utilisent PHPUnit.

Commande :

```bash
cd api
php bin/phpunit
```

Resultat actuel constate pour le jalon 5 :

```text
12 tests
36 assertions
OK
```

Les tests couvrent notamment des comportements lies aux utilisateurs, aux roles,
au staff organisateur et a la gestion des mots de passe.

## Fonctionnalites principales realisees

- Inscription, connexion, deconnexion et profil utilisateur.
- Gestion des roles `ROLE_CLIENT`, `ROLE_ORGANIZER`, `ROLE_ADMIN` et acces staff.
- Demande de role organisateur avec validation admin.
- Exploration des evenements publics avec filtres.
- Abonnement aux organisateurs favoris.
- Achat de billets et paiement Stripe.
- Commandes en attente visibles dans "Mes billets".
- Generation de billets avec QR Code.
- Scan des billets avec detection des billets invalides, valides ou deja utilises.
- Tableau de bord organisateur avec CA, abonnes, billets vendus et scans.
- Gestion des evenements, billets, staff et activite de scan cote organisateur.
- Video souvenir locale visible sur les evenements passes.
- Corbeille publique des evenements termines.
- Console admin avec utilisateurs, demandes organisateur, evenements,
  categories, commandes, paiements, billets et check-ins.
- Signalement d'evenement vers l'administration.
- Newsletter et export des abonnes.

## Securite

Mesures deja en place :

- Hachage des mots de passe avec Symfony Security.
- Authentification via Symfony Security.
- Controle des roles et des droits cote backend.
- Routes admin protegees par `ROLE_ADMIN`.
- Controle des acces organisateur et staff avant les actions sensibles.
- Statut de compte actif / bloque.
- QR Tokens non affiches publiquement en clair.
- Verification serveur des billets lors du scan.
- Utilisation de Doctrine ORM et du QueryBuilder pour limiter les risques
  d'injection SQL.
- Validation serveur des donnees recues par l'API.

Points a renforcer avant production :

- Ajouter une protection anti brute force sur `/api/login` avec Symfony
  `login_throttling` / RateLimiter.
- Verifier et durcir les en-tetes HTTP de securite : CORS strict,
  clickjacking, Content-Security-Policy.
- Completer les pages legales : mentions legales, conditions generales,
  confidentialite, aide et contact.

## Etat beta et travaux restants

EventFlow est actuellement une beta avancee. Les parcours principaux sont
fonctionnels, mais les points suivants restent prevus avant une version finale :

- Module Booster / Promotion pour mettre en avant un evenement.
- Dashboard admin plus complet avec davantage d'indicateurs et de filtres.
- Protection anti brute force sur le login.
- Demande de retrait organisateur apres la fin d'un evenement avec calcul des
  frais.
- Pages de footer : legal, conditions, aide, contact EventFlow.
- Integration complete du frontend React dans Docker.
- Correction des derniers retours ESLint.
- Ajout de tests fonctionnels supplementaires sur les parcours client,
  organisateur et administrateur.

## Notes de developpement

Le projet est utilise comme support de rendu pour le jalon 5 :
Developpement, Securite et Tests. Il correspond a une version beta publique,
pas encore a une version de production definitive.

Les fichiers generes localement comme `.env.local`, `node_modules/`, `vendor/`,
`var/` ou les builds doivent rester hors versionnement selon la configuration
Git du projet.
