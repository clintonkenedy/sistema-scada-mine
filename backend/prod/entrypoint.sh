#!/bin/sh
set -e

APP_DIR="/app"

# 1) Crear directorios que Laravel necesita (cache, views, sessions, etc.)
mkdir -p \
  "$APP_DIR/storage/app" \
  "$APP_DIR/storage/framework/cache" \
  "$APP_DIR/storage/framework/sessions" \
  "$APP_DIR/storage/framework/views" \
  "$APP_DIR/storage/logs" \
  "$APP_DIR/bootstrap/cache"

# 2) Permisos (importante si storage es volumen)
# Nota: si Dokploy monta volúmenes con permisos raros, chown puede fallar; por eso || true
chown -R www-data:www-data "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" || true
chmod -R ug+rwX "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" || true

# 3) Limpiar caches para que Laravel lea las ENV de Dokploy (evita config cache vieja)
if [ -f "$APP_DIR/artisan" ]; then
  php "$APP_DIR/artisan" config:clear || true
  php "$APP_DIR/artisan" route:clear  || true
  php "$APP_DIR/artisan" view:clear   || true
fi

# 4) (Opcional) Generar keys de Passport si faltan (solo si usas laravel/passport)
# Recomendación: mejor persistir storage/ (donde suelen vivir) para no regenerar cada deploy.
# if [ -f "$APP_DIR/artisan" ]; then
#   if [ ! -f "$APP_DIR/storage/oauth-private.key" ] || [ ! -f "$APP_DIR/storage/oauth-public.key" ]; then
#     if php "$APP_DIR/artisan" --version >/dev/null 2>&1; then
#       php "$APP_DIR/artisan" passport:keys --force || true
#       chown -R www-data:www-data "$APP_DIR/storage" || true
#       chmod -R ug+rwX "$APP_DIR/storage" || true
#     fi
#   fi
# fi

# # 5) (Opcional) Migraciones automáticas si activas la variable RUN_MIGRATIONS=1
# if [ -f "$APP_DIR/artisan" ] && [ "${RUN_MIGRATIONS:-0}" = "1" ]; then
#   php "$APP_DIR/artisan" migrate --force || true
# fi

# 6) Arrancar el proceso principal del contenedor
exec "$@"
