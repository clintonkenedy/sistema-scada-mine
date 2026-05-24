#!/bin/sh

echo "🚀 Generating .env file from environment variables..."

# Crear el archivo .env con las variables de entorno
cat > /var/www/html/.env << EOF
APP_NAME="${APP_NAME:-Laravel}"
APP_ENV="${APP_ENV:-production}"
APP_KEY="${APP_KEY:-}"
APP_DEBUG="${APP_DEBUG:-true}"

APP_URL=${APP_URL:-http://playa.test}
ASSET_URL="${ASSET_URL:-http://playa.test/core}"

TRUSTED_PROXIES="${TRUSTED_PROXIES:-*}"
TRUSTED_HEADERS="${TRUSTED_HEADERS:-x-forwarded-all}"

APP_LOCALE="${APP_LOCALE:-es}"
APP_FALLBACK_LOCALE="${APP_FALLBACK_LOCALE:-en}"
APP_FAKER_LOCALE="${APP_FAKER_LOCALE:-en_US}"
APP_MAINTENANCE_DRIVER="${APP_MAINTENANCE_DRIVER:-file}"
PHP_CLI_SERVER_WORKERS="${PHP_CLI_SERVER_WORKERS:-4}"
BCRYPT_ROUNDS="${BCRYPT_ROUNDS:-12}"

LOG_CHANNEL="${LOG_CHANNEL:-stack}"
LOG_STACK="${LOG_STACK:-single}"
LOG_DEPRECATIONS_CHANNEL="${LOG_DEPRECATIONS_CHANNEL:-null}"
LOG_LEVEL="${LOG_LEVEL:-debug}"

DB_CONNECTION="${DB_CONNECTION:-pgsql}"
DB_HOST_PG="${DB_HOST_PG:-localhost}"
DB_PORT_PG="${DB_PORT_PG:-5432}"
DB_DATABASE_PG="${DB_DATABASE_PG:-back-usuarios}"
DB_USERNAME_PG="${DB_USERNAME_PG:-root}"
DB_PASSWORD_PG="${DB_PASSWORD_PG:-}"
DB_SEARCHPATH_PG="${DB_SEARCHPATH_PG:-}"


SESSION_DRIVER="${SESSION_DRIVER:-database}"
SESSION_LIFETIME="${SESSION_LIFETIME:-120}"
SESSION_ENCRYPT="${SESSION_ENCRYPT:-false}"
SESSION_PATH="${SESSION_PATH:-/}"
SESSION_DOMAIN="${SESSION_DOMAIN:-null}"

BROADCAST_CONNECTION="${BROADCAST_CONNECTION:-log}"
FILESYSTEM_DISK="${FILESYSTEM_DISK:-local}"
QUEUE_CONNECTION="${QUEUE_CONNECTION:-database}"
CACHE_STORE="${CACHE_STORE:-database}"

MEMCACHED_HOST="${MEMCACHED_HOST:-127.0.0.1}"

REDIS_CLIENT="${REDIS_CLIENT:-phpredis}"
REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
REDIS_PASSWORD="${REDIS_PASSWORD:-null}"
REDIS_PORT="${REDIS_PORT:-6379}"

MAIL_MAILER="${MAIL_MAILER:-log}"
MAIL_SCHEME="${MAIL_SCHEME:-null}"
MAIL_HOST="${MAIL_HOST:-127.0.0.1}"
MAIL_PORT="${MAIL_PORT:-2525}"
MAIL_USERNAME="${MAIL_USERNAME:-null}"
MAIL_PASSWORD="${MAIL_PASSWORD:-null}"
MAIL_FROM_ADDRESS="${MAIL_FROM_ADDRESS:-hello@example.com}"
MAIL_FROM_NAME="${MAIL_FROM_NAME:-${APP_NAME:-Laravel}}"

AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
AWS_BUCKET="${AWS_BUCKET:-}"
AWS_USE_PATH_STYLE_ENDPOINT="${AWS_USE_PATH_STYLE_ENDPOINT:-false}"
AWS_ENDPOINT="${AWS_ENDPOINT:-}"

VITE_APP_NAME="${VITE_APP_NAME:-${APP_NAME:-Laravel}}"
EOF

echo "✅ .env file generated successfully!"

# Mostrar algunas variables para debug (sin mostrar passwords)
echo "🔍 Environment variables loaded:"
echo "  - APP_NAME: ${APP_NAME:-Laravel}"
echo "  - APP_ENV: ${APP_ENV:-production}"
echo "  - DB_CONNECTION: ${DB_CONNECTION:-mysql}"
echo "  - DB_HOST: ${DB_HOST:-127.0.0.1}"
echo "  - DB_DATABASE: ${DB_DATABASE}"

# Verificar que APP_KEY existe
if [ -z "$APP_KEY" ]; then
    echo "⚠️  WARNING: APP_KEY is not set. Generating one..."
    php artisan key:generate --force
else
    echo "✅ APP_KEY is set"
fi

# Limpiar caches previos
echo "🧹 Clearing previous caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Crear las nuevas caches
echo "⚡ Building Laravel caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Generar claves de Passport si es necesario
if [ "$APP_ENV" = "production" ] && [ ! -f "/var/www/html/storage/oauth-private.key" ]; then
    echo "🔐 Generating Passport keys..."
    php artisan passport:keys --force
fi

# Verificar permisos
echo "🔒 Setting correct permissions..."
# chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html
# php artisan octane:frankenphp --host=0.0.0.0 --port=8080 --caddyfile=/etc/frankenphp/Caddyfile --workers=auto --max-requests=500
echo "🎉 Laravel application is ready!"
echo "Starting PHP-FPM..."
# php artisan key:generate --force
# RUN php artisan key:generate --force || true \
#  && php artisan passport:keys --force \
#  && php artisan config:cache \
#  && php artisan route:cache \
#  && php artisan view:cache \
#  && chown -R www-data:www-data /var/www/html
