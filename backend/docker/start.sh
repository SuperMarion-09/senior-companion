#!/bin/sh
# Runs every time the container starts (each deploy, and each wake-up on
# Render's free plan). Environment variables are only available now, not at
# build time, so config is cached here.
set -e
cd /var/www/html

# Some MySQL hosts (e.g. Aiven) sign their certificate with their own CA.
# Paste that CA's text into MYSQL_SSL_CA_PEM and it is used instead of the
# system certificates.
if [ -n "$MYSQL_SSL_CA_PEM" ]; then
    printf '%s\n' "$MYSQL_SSL_CA_PEM" > /tmp/mysql-ca.pem
    export MYSQL_ATTR_SSL_CA=/tmp/mysql-ca.pem
fi

php artisan config:cache
php artisan route:cache
# No view:cache: the app has no Blade views of its own (resources/views is
# empty, so git doesn't even store it). Email layouts from Laravel itself are
# compiled into storage/framework/views the first time an email is sent.

# Safe to run on every start: only migrations that haven't run yet are applied.
php artisan migrate --force

exec apache2-foreground
