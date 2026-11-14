# Production image for the Laravel API.
# Render builds this automatically (see render.yaml at the repository root).

FROM php:8.4-apache

# pdo_mysql talks to the database; opcache keeps compiled PHP in memory.
# unzip lets Composer unpack packages; ca-certificates lets PHP verify the
# database's TLS certificate (MYSQL_ATTR_SSL_CA in render.yaml).
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip ca-certificates \
    && docker-php-ext-install pdo_mysql opcache \
    && rm -rf /var/lib/apt/lists/*

RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY docker/php.ini "$PHP_INI_DIR/conf.d/zz-app.ini"

# Apache serves public/ and listens on $PORT (Render sets it; 8080 otherwise).
ENV PORT=8080
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
RUN echo 'Listen ${PORT}' > /etc/apache2/ports.conf \
    && echo 'ServerName localhost' >> /etc/apache2/apache2.conf \
    && a2enmod rewrite headers

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install packages before copying the code, so this slow step is cached
# when only application files change.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress

COPY . .
# Recreate the folders Laravel writes to: .dockerignore leaves out their
# contents, and git doesn't store empty folders.
RUN mkdir -p storage/app/private storage/app/public storage/logs \
        storage/framework/cache/data storage/framework/sessions storage/framework/views \
        bootstrap/cache \
    && composer dump-autoload --optimize --no-dev --classmap-authoritative \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/start.sh /usr/local/bin/start
RUN chmod +x /usr/local/bin/start

CMD ["start"]
