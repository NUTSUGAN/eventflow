FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    libxml2-dev \
    default-mysql-client \
    && docker-php-ext-install pdo pdo_mysql intl zip opcache

# Installation de APCu (Indispensable pour la vitesse de Symfony)
RUN pecl install apcu && docker-php-ext-enable apcu

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/api

COPY api/composer.json api/composer.lock api/symfony.lock ./
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# --- OPTIMISATION : Augmenter la RAM allouée à PHP ---
RUN echo "memory_limit = 512M" > /usr/local/etc/php/conf.d/memory-limit.ini
