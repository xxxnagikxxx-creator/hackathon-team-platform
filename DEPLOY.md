# Инструкция по развертыванию на Ubuntu сервере

## Требования

- Ubuntu 20.04+ или 22.04+
- Docker и Docker Compose установлены
- Минимум 2GB RAM
- Минимум 10GB свободного места на диске

## Шаг 1: Подготовка сервера

### 1.1 Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Установка Docker

```bash
# Удаляем старые версии (если есть)
sudo apt remove docker docker-engine docker.io containerd runc

# Устанавливаем зависимости
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Добавляем официальный GPG ключ Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Настраиваем репозиторий
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Добавляем текущего пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER

# ВАЖНО: Применяем изменения (выберите один из вариантов):
# Вариант 1: Перезайти в систему (рекомендуется)
# exit
# Затем войдите в SSH снова

# Вариант 2: Применить изменения без перезахода
newgrp docker

# Вариант 3: Перезагрузить сессию
# su - $USER
```

### 1.3 Проверка установки

```bash
docker --version
docker compose version
```

## Шаг 2: Подготовка проекта

### 2.1 Клонирование репозитория

```bash
# Если используете Git
git clone <your-repo-url> itamhack
cd itamhack

# Или загрузите проект другим способом
```

### 2.2 Создание файла .env

```bash
# Копируем пример конфигурации
cp env.example .env

# Редактируем .env файл
nano .env
```

### 2.3 Настройка .env файла

Отредактируйте `.env` файл со следующими значениями:

```env
# Database Configuration
DB_USER=itamhack_user
DB_PASSWORD=<сгенерируйте_надежный_пароль>
DB_NAME=itamhack_db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<сгенерируйте_надежный_пароль_для_redis>
REDIS_DB=0
REDIS_SSL=false

# API Configuration
API_URL=http://your-domain.com:8000
# Или если используете домен с SSL:
# API_URL=https://api.your-domain.com

# ВАЖНО: Сгенерируйте надежный секретный ключ (минимум 32 символа)
SECRET_KEY=<сгенерируйте_случайную_строку_минимум_32_символа>
ALGORITHM=HS256
ACCESS_TOKEN_EXIRE_MINUTES=1440

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=<ваш_токен_telegram_бота>

# Port Configuration
BACKEND_PORT=8000
FRONTEND_PORT=80
POSTGRES_PORT=5432
REDIS_PORT=6379

# Workers for production (рекомендуется количество CPU ядер)
WORKERS=4
```

**Генерация секретного ключа:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Генерация паролей:**
```bash
openssl rand -base64 32
```

## Шаг 3: Настройка для продакшена

### 3.1 Обновление конфигурации API для фронтенда

В файле `frontend/src/shared/config/api.ts` убедитесь, что для продакшена используется правильный URL:

```typescript
export const API_BASE_URL = isDevelopment
  ? '/api'
  : import.meta.env.VITE_API_URL || 'http://your-domain.com:8000'
```

Или установите переменную окружения `VITE_API_URL` при сборке фронтенда.

**Важно:** В продакшене nginx проксирует `/api` на бэкенд, поэтому фронтенд должен использовать относительный путь `/api` или полный URL вашего домена.

### 3.2 Настройка CORS в бэкенде

Отредактируйте файл `backend/api/main.py` и добавьте ваш продакшн домен в список разрешенных источников:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://your-domain.com",  # Добавьте ваш домен
        "https://your-domain.com",  # Если используете HTTPS
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-User-Id", "X-User-Name", "Editable"],
)
```

Или используйте переменную окружения для динамической настройки:

```python
import os

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5175,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-User-Id", "X-User-Name", "Editable"],
)
```

### 3.2 Настройка nginx для продакшена (опционально)

Если вы хотите использовать внешний nginx как reverse proxy, создайте конфигурацию:

```nginx
# /etc/nginx/sites-available/itamhack
server {
    listen 80;
    server_name your-domain.com;

    # Редирект на HTTPS (если используете SSL)
    # return 301 https://$server_name$request_uri;

    # Или проксируем напрямую на Docker контейнер
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Шаг 4: Развертывание

### 4.1 Сборка и запуск контейнеров

```bash
# Используем продакшн конфигурацию
docker compose -f docker-compose.prod.yaml build

# Запускаем в фоновом режиме
docker compose -f docker-compose.prod.yaml up -d

# Проверяем статус
docker compose -f docker-compose.prod.yaml ps

# Смотрим логи
docker compose -f docker-compose.prod.yaml logs -f
```

### 4.2 Создание администратора

```bash
# Войдите в контейнер backend
docker compose -f docker-compose.prod.yaml exec backend python -m backend.api.create_admin

# Или с параметрами
docker compose -f docker-compose.prod.yaml exec backend python -m backend.api.create_admin admin@example.com your_password
```

### 4.3 Проверка работы

```bash
# Проверка backend
curl http://localhost:8000/docs

# Проверка frontend
curl http://localhost:80

# Проверка всех сервисов
docker compose -f docker-compose.prod.yaml ps
```

## Шаг 5: Настройка файрвола (UFW)

```bash
# Разрешаем SSH (ВАЖНО: сделайте это первым!)
sudo ufw allow 22/tcp

# Разрешаем HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Если нужно открыть порт бэкенда напрямую (не рекомендуется для продакшена)
# sudo ufw allow 8000/tcp

# Включаем файрвол
sudo ufw enable

# Проверяем статус
sudo ufw status
```

## Шаг 6: Настройка SSL (опционально, но рекомендуется)

### 6.1 Установка Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Получение SSL сертификата

```bash
# Если используете nginx
sudo certbot --nginx -d your-domain.com

# Или только сертификат
sudo certbot certonly --standalone -d your-domain.com
```

### 6.3 Автоматическое обновление

```bash
# Проверка автообновления
sudo certbot renew --dry-run
```

## Шаг 7: Мониторинг и обслуживание

### 7.1 Просмотр логов

```bash
# Все сервисы
docker compose -f docker-compose.prod.yaml logs -f

# Конкретный сервис
docker compose -f docker-compose.prod.yaml logs -f backend
docker compose -f docker-compose.prod.yaml logs -f frontend
docker compose -f docker-compose.prod.yaml logs -f postgres
```

### 7.2 Перезапуск сервисов

```bash
# Перезапуск всех
docker compose -f docker-compose.prod.yaml restart

# Перезапуск конкретного сервиса
docker compose -f docker-compose.prod.yaml restart backend
```

### 7.3 Обновление приложения

```bash
# Останавливаем контейнеры
docker compose -f docker-compose.prod.yaml down

# Получаем последние изменения (если используете Git)
git pull

# Пересобираем образы
docker compose -f docker-compose.prod.yaml build --no-cache

# Запускаем заново
docker compose -f docker-compose.prod.yaml up -d
```

### 7.4 Резервное копирование базы данных

```bash
# Создание бэкапа
docker compose -f docker-compose.prod.yaml exec postgres pg_dump -U $DB_USER $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
docker compose -f docker-compose.prod.yaml exec -T postgres psql -U $DB_USER $DB_NAME < backup_file.sql
```

## Шаг 8: Настройка автозапуска (systemd)

Создайте systemd сервис для автоматического запуска при перезагрузке:

```bash
sudo nano /etc/systemd/system/itamhack.service
```

Добавьте:

```ini
[Unit]
Description=ITAMHack Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/itamhack
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yaml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yaml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Активируйте сервис:

```bash
sudo systemctl daemon-reload
sudo systemctl enable itamhack.service
sudo systemctl start itamhack.service
```

## Решение проблем

### Проблема: Контейнеры не запускаются

```bash
# Проверьте логи
docker compose -f docker-compose.prod.yaml logs

# Проверьте статус
docker compose -f docker-compose.prod.yaml ps

# Проверьте использование ресурсов
docker stats
```

### Проблема: База данных не подключается

```bash
# Проверьте переменные окружения
docker compose -f docker-compose.prod.yaml exec backend env | grep DB

# Проверьте подключение к БД
docker compose -f docker-compose.prod.yaml exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT 1;"
```

### Проблема: Фронтенд не может подключиться к бэкенду

1. Проверьте переменную `VITE_API_URL` в `.env`
2. Убедитесь, что nginx правильно проксирует запросы
3. Проверьте настройки CORS в бэкенде

### Проблема: Недостаточно места на диске

```bash
# Очистка неиспользуемых Docker ресурсов
docker system prune -a --volumes

# Проверка использования диска
df -h
```

### Проблема: Permission denied при работе с Docker

Если вы видите ошибку:
```
permission denied while trying to connect to the Docker daemon socket
```

**Решение:**

```bash
# 1. Добавьте пользователя в группу docker
sudo usermod -aG docker $USER

# 2. Примените изменения (выберите один вариант):
# Вариант A: Перезайдите в систему
exit
# Затем войдите в SSH снова

# Вариант B: Примените без перезахода
newgrp docker

# Вариант C: Перезагрузите сессию
su - $USER

# 3. Проверьте, что работает
docker ps

# 4. Если все еще не работает, проверьте права
ls -la /var/run/docker.sock
# Должно быть: srw-rw---- 1 root docker

# 5. Если нужно, исправьте права (не рекомендуется, лучше использовать группу)
sudo chmod 666 /var/run/docker.sock
```

**Важно:** После добавления в группу docker обязательно перезайдите в систему или выполните `newgrp docker`, иначе изменения не вступят в силу.

## Безопасность

1. **Измените все пароли по умолчанию**
2. **Используйте сильные пароли** (минимум 16 символов)
3. **Настройте файрвол** (UFW)
4. **Используйте SSL/TLS** для продакшена
5. **Регулярно обновляйте систему и Docker**
6. **Ограничьте доступ к портам** (не открывайте 5432, 6379 наружу)
7. **Настройте регулярные бэкапы базы данных**
8. **Используйте переменные окружения** для секретов, не храните их в коде

## Полезные команды

```bash
# Просмотр использования ресурсов
docker stats

# Очистка логов
docker compose -f docker-compose.prod.yaml logs --tail=100

# Проверка здоровья контейнеров
docker compose -f docker-compose.prod.yaml ps

# Вход в контейнер
docker compose -f docker-compose.prod.yaml exec backend bash
docker compose -f docker-compose.prod.yaml exec postgres psql -U $DB_USER -d $DB_NAME
```

## Контакты и поддержка

При возникновении проблем проверьте:
1. Логи контейнеров
2. Настройки `.env` файла
3. Доступность портов
4. Состояние базы данных и Redis
