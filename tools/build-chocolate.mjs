// Сборка chocolate.js без старого Grunt 0.4 (он не работает на современных Node).
// Повторяет задачи из Gruntfile.coffee: coffee -> подстановка шаблонов и опций темы -> less -> картинки.
// Запуск: node tools/build-chocolate.mjs [тема]   (по умолчанию default)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import coffee from 'coffeescript';
import less from 'less';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, '_vendor_src', 'chocolate');
const theme = process.argv[2] || 'default';
const dest = path.join(root, 'chocolate');
// Путь к картинкам темы относительно css/ и относительно index.html
const basedirCss = '../images';
const basedirHtml = 'chocolate/images';

const sources = [
  'src/init.coffee',
  'src/utils.coffee',
  'src/storage.coffee',
  'src/plugins/session.coffee',
  'src/plugins/history.coffee',
  'src/plugins/touch.coffee',
  'src/chocolate.coffee',
];

const read = (p) => fs.readFileSync(path.join(src, p), 'utf8');

const coffeeSource = sources.map(read).join('\n');
const js = coffee.compile(coffeeSource, { bare: true });

// templates.html: каждый <script id="..."> превращается в строку шаблона
const templatesHtml = read(`themes/${theme}/templates.html`);
const templates = {};
for (const m of templatesHtml.matchAll(/<script id="([^"]+)"[^>]*>([\s\S]*?)<\/script>/g)) {
  templates[m[1]] = m[2].split('\n').map((l) => l.trim()).join('').trim().replaceAll('@@basedir', basedirHtml);
}

const options = read(`themes/${theme}/options.json`);
const bundle = `(function(window, document) {\n\nvar defaultOptions = ${options};\n\nvar templates = ${JSON.stringify(templates)};\n\n${js}\n\n})(window, document);\n`;

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(path.join(dest, 'js'), { recursive: true });
fs.mkdirSync(path.join(dest, 'css'), { recursive: true });
fs.writeFileSync(path.join(dest, 'js', 'chocolate.js'), bundle);

const lessFile = path.join(src, 'themes', theme, 'css', 'chocolate.less');
const lessSource = fs.readFileSync(lessFile, 'utf8').replaceAll('@@basedir/', `${basedirCss}/`);
const { css } = await less.render(lessSource, { filename: lessFile, math: 'always' }); // тема написана под Less 1.x
fs.writeFileSync(path.join(dest, 'css', 'chocolate.css'), css);

fs.cpSync(path.join(src, 'themes', theme, 'images'), path.join(dest, 'images'), { recursive: true });

console.log(`chocolate.js (${theme}) собран в ${path.relative(root, dest)}/`);
