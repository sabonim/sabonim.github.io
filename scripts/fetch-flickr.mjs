// Забирает список публичных фото с Flickr и пишет photos.json для галереи.
// Сами картинки не скачиваются: галерея берёт их напрямую с live.staticflickr.com.
//
// Переменные окружения:
//   FLICKR_USER      — NSID (12345678@N00), имя пользователя или ссылка на профиль Flickr
//   FLICKR_API_KEY   — ключ Flickr API (без него используется публичная лента: только ~20 последних фото)
//   FLICKR_ALBUM_ID  — необязательно: id альбома (photoset), тогда берутся фото только из него
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'photos.json');

const user = (process.env.FLICKR_USER || '').trim();
const apiKey = (process.env.FLICKR_API_KEY || '').trim();
const albumId = (process.env.FLICKR_ALBUM_ID || '').trim();

if (!user) {
  console.error('Не задан FLICKR_USER');
  process.exit(1);
}

// Размеры по убыванию предпочтения (как в статье adrianmrit/flickrdatasets)
const LARGE_SIZES = ['url_k', 'url_h', 'url_l', 'url_c', 'url_z'];
const THUMB_SIZES = ['url_z', 'url_n', 'url_m', 'url_q'];
const pick = (photo, sizes) => sizes.map((s) => photo[s]).find(Boolean);

async function api(method, params = {}) {
  const url = new URL('https://api.flickr.com/services/rest/');
  url.search = new URLSearchParams({ method, api_key: apiKey, format: 'json', nojsoncallback: '1', ...params });
  const res = await fetch(url);
  const data = await res.json();
  if (data.stat !== 'ok') throw new Error(`${method}: ${data.message}`);
  return data;
}

async function resolveNsid() {
  if (/^\d+@N\d+$/.test(user)) return user;
  const profileUrl = user.startsWith('http') ? user : `https://www.flickr.com/photos/${user}/`;
  const { user: found } = await api('flickr.urls.lookupUser', { url: profileUrl });
  return found.id;
}

async function fromApi() {
  const nsid = await resolveNsid();
  const extras = [...new Set([...LARGE_SIZES, ...THUMB_SIZES])].join(',') + ',date_taken';
  const photos = [];
  for (let page = 1, pages = 1; page <= pages; page++) {
    const data = albumId
      ? await api('flickr.photosets.getPhotos', { photoset_id: albumId, user_id: nsid, extras, per_page: '500', page: String(page) })
      : await api('flickr.people.getPublicPhotos', { user_id: nsid, extras, per_page: '500', page: String(page) });
    const list = albumId ? data.photoset : data.photos;
    pages = Number(list.pages);
    for (const p of list.photo) {
      const large = pick(p, LARGE_SIZES);
      if (!large) continue;
      photos.push({
        id: p.id,
        title: p.title || '',
        thumb: pick(p, THUMB_SIZES) || large,
        large,
        page: `https://www.flickr.com/photos/${nsid}/${p.id}/`,
        taken: p.datetaken || null,
      });
    }
  }
  return { nsid, photos };
}

async function fromFeed() {
  if (!/^\d+@N\d+$/.test(user)) {
    throw new Error('Без FLICKR_API_KEY в FLICKR_USER нужен NSID вида 12345678@N00');
  }
  const url = `https://www.flickr.com/services/feeds/photos_public.gne?id=${encodeURIComponent(user)}&format=json&nojsoncallback=1`;
  const data = await (await fetch(url)).json();
  const photos = data.items.map((item) => {
    const m = item.media.m; // ..._m.jpg (240px)
    return {
      id: item.link.split('/').filter(Boolean).pop(),
      title: item.title || '',
      thumb: m.replace('_m.', '_z.'),
      large: m.replace('_m.', '_b.'),
      page: item.link,
      taken: item.date_taken || null,
    };
  });
  return { nsid: user, photos };
}

const { nsid, photos } = apiKey ? await fromApi() : await fromFeed();
const result = {
  source: apiKey ? (albumId ? `album ${albumId}` : 'public photos') : 'public feed',
  profile: `https://www.flickr.com/photos/${nsid}/`,
  updated: new Date().toISOString(),
  photos,
};
fs.writeFileSync(outFile, JSON.stringify(result, null, 2) + '\n');
console.log(`photos.json: ${photos.length} фото (${result.source})`);
