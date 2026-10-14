# Установка на Linux-сервер

Пример для Ubuntu/Debian с systemd и Nginx. Нужны домен, направленный на сервер, SSH с sudo, Git, Node.js 22.13+ из ветки 22 LTS и npm. Используйте актуальный исправленный выпуск Node.js. Приложению необходим постоянный диск и достаточно памяти для `npm ci` и `npm run build`; начальный ориентир — 2 ГБ, фактические требования зависят от среды.

Команды ниже рассчитаны на пользователя `portfolio`, код в `/srv/artm-portfolio`, данные в `/var/lib/artm-portfolio`. Замените `portfolio.example.com` своим доменом. Не запускайте само приложение от root.

## 1. Подготовить каталоги и исходники

```sh
sudo apt update
sudo apt install git nginx
node --version
npm --version
sudo useradd --system --create-home --home-dir /srv/portfolio --shell /usr/sbin/nologin portfolio
sudo install -d -o portfolio -g portfolio /srv/artm-portfolio /var/lib/artm-portfolio
sudo -u portfolio git clone https://github.com/shalamovartem/artm-portfolio.git /srv/artm-portfolio
cd /srv/artm-portfolio
sudo -u portfolio npm ci
sudo -u portfolio cp .env.example .env.local
sudo -u portfolio nano .env.local
```

Если Node.js ещё не установлен, установите его по [официальной инструкции](https://nodejs.org/en/download), затем продолжите. В этом примере `node` и `npm` должны быть доступны пользователю `portfolio`, без зависимости от домашней папки другого пользователя.

В `.env.local`:

```dotenv
PUBLIC_ORIGIN=https://portfolio.example.com
DATA_DIR=/var/lib/artm-portfolio
```

```sh
sudo chmod 600 .env.local
sudo -u portfolio npm run admin
sudo -u portfolio npm run build
```

Создайте свой логин и пароль в интерактивном терминале. Не публикуйте их в Git. Не запускайте создание администратора при каждом обновлении: команда заменяет аккаунт.

## 2. Настроить systemd

Проверьте `command -v node` и при необходимости измените путь `ExecStart`. Создайте `/etc/systemd/system/artm-portfolio.service`:

```ini
[Unit]
Description=Portfolio website
After=network.target

[Service]
Type=simple
User=portfolio
Group=portfolio
WorkingDirectory=/srv/artm-portfolio
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3000
EnvironmentFile=/srv/artm-portfolio/.env.local
ExecStart=/usr/bin/node /srv/artm-portfolio/server.cjs
Restart=on-failure
RestartSec=5
UMask=0077
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now artm-portfolio
sudo systemctl status artm-portfolio
curl -I http://127.0.0.1:3000
```

## 3. Настроить Nginx и HTTPS

Создайте `/etc/nginx/sites-available/artm-portfolio`:

```nginx
server {
    listen 80;
    server_name portfolio.example.com;
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
```

```sh
sudo ln -s /etc/nginx/sites-available/artm-portfolio /etc/nginx/sites-enabled/artm-portfolio
sudo nginx -t
sudo systemctl reload nginx
```

Получите TLS-сертификат с помощью [Certbot для Nginx](https://certbot.eff.org/instructions?ws=nginx&os=pip) по инструкции для вашей ОС. Включите перенаправление HTTP → HTTPS и автоматическое обновление сертификата. Откройте во внешнем firewall только необходимые порты, включая 80/443 и SSH; порт 3000 слушает лишь 127.0.0.1.

Не входите в редактор через обычный HTTP: при HTTPS-адресе в PUBLIC_ORIGIN cookie входа требует HTTPS. `PUBLIC_ORIGIN` должен точно совпадать с выбранным основным HTTPS-адресом; альтернативные домены перенаправляйте на него.

## 4. Обновить из Git

Перед обновлением сохраните независимую резервную копию `/var/lib/artm-portfolio` и `.env.local`. Во время копирования данных и обновления остановите приложение — это даёт короткий период недоступности, но исключает изменения данных посреди копирования. Зафиксируйте текущую ревизию через `git rev-parse HEAD`, чтобы иметь точку возврата.

```sh
sudo systemctl stop artm-portfolio
cd /srv/artm-portfolio
sudo -u portfolio git pull --ff-only
sudo -u portfolio npm ci
sudo -u portfolio npm run build
sudo systemctl start artm-portfolio
sudo systemctl status artm-portfolio
```

Выполняйте команды последовательно. При ошибке установки или сборки не продолжайте запуск: устраните причину или верните предыдущую ревизию, установите её зависимости и соберите заново. Не удаляйте `DATA_DIR` и `.env.local`. Для возврата данных используйте отдельную резервную копию только при необходимости: она заменит новые изменения после копирования.

После обновления проверьте главную, страницу проекта, вход, сохранение черновика, публикацию и загрузку изображения. Убедитесь, что `/licenses` открывается.

## Диагностика

```sh
sudo journalctl -u artm-portfolio -n 100 --no-pager
sudo nginx -t
curl -I http://127.0.0.1:3000
```

- `Cannot find module` — проверьте успешность `npm ci` в папке приложения.
- Нет production build — выполните `npm run build` и проверьте её завершение.
- Вход отклонён — проверьте HTTPS, `PUBLIC_ORIGIN` и проксируемый Host.
- Данные не сохраняются — проверьте путь `DATA_DIR`, владельца папки и свободное место.
- Пустая карта или погода — серверу и браузеру нужны исходящие подключения к соответствующим внешним сервисам.

Не раздавайте `/srv/artm-portfolio` как статическую папку Nginx: все запросы должны проходить через приложение. Иначе можно открыть доступ к конфигурации и внутренним файлам.
