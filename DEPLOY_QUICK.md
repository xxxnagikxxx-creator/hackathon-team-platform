# Быстрая шпаргалка по развертыванию

## Быстрый старт

```bash
# 1. Клонируйте проект
git clone <repo-url> itamhack
cd itamhack

# 2. Создайте .env файл
cp env.example .env
nano .env  # Отредактируйте настройки

# 3. Сгенерируйте секретный ключ
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 4. Запустите
docker compose -f docker-compose.prod.yaml up -d --build

# 5. Создайте администратора
docker compose -f docker-compose.prod.yaml exec backend python -m backend.api.create_admin
```

## Основные команды

```bash
# Запуск
docker compose -f docker-compose.prod.yaml up -d

# Остановка
docker compose -f docker-compose.prod.yaml down

# Просмотр логов
docker compose -f docker-compose.prod.yaml logs -f

# Перезапуск
docker compose -f docker-compose.prod.yaml restart

# Обновление
docker compose -f docker-compose.prod.yaml down
docker compose -f docker-compose.prod.yaml build --no-cache
docker compose -f docker-compose.prod.yaml up -d
```

## Важные настройки .env

```env
# Обязательно измените!
DB_PASSWORD=<надежный_пароль>
SECRET_KEY=<минимум_32_символа>
REDIS_PASSWORD=<надежный_пароль>
TELEGRAM_BOT_TOKEN=<ваш_токен>

# Для продакшена
API_URL=http://your-domain.com:8000
# или
API_URL=https://api.your-domain.com
```

## Проверка работы

```bash
# Backend
curl http://localhost:8000/docs

# Frontend
curl http://localhost:80

# Статус всех сервисов
docker compose -f docker-compose.prod.yaml ps
```

## Бэкап базы данных

```bash
# Создание
docker compose -f docker-compose.prod.yaml exec postgres pg_dump -U $DB_USER $DB_NAME > backup.sql

# Восстановление
docker compose -f docker-compose.prod.yaml exec -T postgres psql -U $DB_USER $DB_NAME < backup.sql
```

## Настройка файрвола

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable
```

## Проблемы?

1. Проверьте логи: `docker compose -f docker-compose.prod.yaml logs`
2. Проверьте .env файл
3. Проверьте порты: `netstat -tulpn | grep LISTEN`
4. Проверьте ресурсы: `docker stats`

Подробная инструкция в файле `DEPLOY.md`
