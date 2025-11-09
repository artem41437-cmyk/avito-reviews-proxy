# Avito Reviews Proxy & Widget

Виджет, который показывает **последние отзывы** продавца с Авито на вашем сайте.
Работает через serverless-функцию (Vercel), которая получает страницу отзывов и вытаскивает данные (из JSON-LD/встроенных скриптов и/или HTML).

> ⚠️ Скрейпинг может ломаться, если Авито изменит разметку. В таком случае просто обновите функцию `api/reviews.js` (см. комментарии внутри) — структура кода уже подготовлена.

---

## Быстрый старт (за 2 минуты)

### 1) Создайте репозиторий на GitHub
1. Зайдите на https://github.com/new
2. Введите имя: **avito-reviews-proxy**
3. Нажмите _Create repository_

### 2) Добавьте файлы и отправьте в репозиторий
В терминале:

```bash
git clone https://github.com/<ВАШ_ЛОГИН>/avito-reviews-proxy.git
cd avito-reviews-proxy
# Скопируйте файлы из архива в эту папку.

git add .
git commit -m "init: avito reviews widget + proxy"
git push
```

### 3) Деплой на Vercel
1. Зайдите на https://vercel.com
2. Нажмите **New Project** → выберите ваш репозиторий `avito-reviews-proxy`
3. **Environment Variables**:
   - `AVITO_SELLER_URL` — ссылка на ваши отзывы (из Авито)

   Пример:  
   `https://www.avito.ru/brands/i36146979/all?src=search_seller_info&iid=7424259805&sellerId=7d3afce54f34557cdf8df89cc8faf983`

4. Deploy. После деплоя у вас будет домен вида: `https://<project>.vercel.app`

---

## Как вставить на сайт (любой HTML/Tilda/WordPress)
Добавьте на страницу следующий HTML-фрагмент **там, где хотите виджет**:

```html
<!-- Контейнер виджета -->
<div id="avito-reviews-widget"
     data-endpoint="https://<ВАШ-ДОМЕН-ОТ-VERCEL>.vercel.app/api/reviews"
     data-limit="6">
</div>

<!-- Скрипт виджета -->
<script src="https://<ВАШ-ДОМЕН-ОТ-VERCEL>.vercel.app/public/widget.js" defer></script>
```

- `data-endpoint` — путь к вашей серверной функции `/api/reviews`
- `data-limit` — сколько отзывов показать (по умолчанию 6)

> На Tilda — используйте **Zero Block → HTML** или **T123 «встроенный код»**. Вставьте HTML из блока выше.

---

## Локальный запуск (для теста)
```bash
# Требуется Node 18+
npm i -g vercel
vercel dev
# Откройте http://localhost:3000
```

---

## Структура проекта
```
api/reviews.js      # serverless-функция (Vercel) — тянет и парсит отзывы
public/widget.js    # фронтенд-виджет (рендер блоков отзывов)
index.html          # демо-страница для проверки
vercel.json         # заголовки/кеш/CORS
```

---

## FAQ

**Можно ли выбрать другой источник отзывов?**  
Да. Внутри `api/reviews.js` оставлены комментарии — можно подменить URL или добавить альтернативный парсер.

**Почему мало отзывов?**  
Страница может подгружать отзывы динамически. Функция пытается достать данные из HTML и JSON-скриптов. Если отзывов нет — попробуйте увеличить таймауты/добавить альтернативные селекторы.

**SEO-интеграция?**  
По умолчанию отзывы рендерятся на клиенте. Если нужен SSR/SSG — перенесите виджет в свой фреймворк (Next.js/Nuxt) и отдавайте HTML прямо из функции.
