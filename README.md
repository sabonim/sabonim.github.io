# Галерея фотографий с Flickr

Статическая галерея на [chocolate.js](https://github.com/meritt/chocolate.js): фото хранятся на Flickr, код на GitHub, сайт отдаёт GitHub Pages. Своего сервера нет.

## Как это работает

1. GitHub Action раз в сутки (а также после каждого push и по кнопке *Run workflow*) запускает `scripts/fetch-flickr.mjs`.
2. Скрипт берёт список ваших публичных фото через Flickr API и пишет `photos.json`: ссылки на превью, большую версию и страницу фото на Flickr.
3. `gallery.js` строит из `photos.json` сетку, а chocolate.js открывает фото в полноэкранном просмотре.
4. Картинки грузятся напрямую с `live.staticflickr.com`.

## Настройка репозитория

В *Settings* репозитория:

- **Pages → Build and deployment → Source:** GitHub Actions.
- **Secrets and variables → Actions → Secrets:** `FLICKR_API_KEY`, ключ с <https://www.flickr.com/services/apps/create/> (некоммерческий, бесплатный).
- **Secrets and variables → Actions → Variables** (необязательно, по умолчанию берётся аккаунт `24179074@N04`):
  - `FLICKR_USER`: ваш NSID (`12345678@N00`), имя пользователя или ссылка на профиль Flickr.
  - `FLICKR_ALBUM_ID` (необязательно): id альбома, если показывать нужно только его. Это число из адреса `flickr.com/photos/<user>/albums/<id>`.

Без `FLICKR_API_KEY` скрипт использует публичную ленту, но она отдаёт только 20 последних фото, и `FLICKR_USER` в этом случае должен быть NSID.

## Локально

```
npm install
FLICKR_USER=... FLICKR_API_KEY=... npm run fetch
npm run serve        # http://localhost:8080
```

`npm run build:chocolate` пересобирает `chocolate/` из исходников в `_vendor_src/chocolate`: это `git clone https://github.com/meritt/chocolate.js _vendor_src/chocolate`. Оригинальный Gruntfile 2015 года на современном Node не работает, поэтому сборка сделана заново в `tools/build-chocolate.mjs`. Аргументом можно передать тему: `default`, `serenity` или `simonenko`.

## Ограничения Flickr

- Бесплатный аккаунт хранит до 1000 фото, и показываются только публичные.
- Каждое показанное фото должно ссылаться на свою страницу на Flickr: подпись под плиткой ведёт туда.
