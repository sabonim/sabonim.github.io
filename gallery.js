// Строит сетку из photos.json и подключает к ней chocolate.js.
(async function () {
  var grid = document.getElementById('grid');
  var meta = document.getElementById('meta');

  var data;
  try {
    var res = await fetch('photos.json', { cache: 'no-cache' });
    data = await res.json();
  } catch (e) {
    grid.textContent = 'Не удалось загрузить photos.json';
    return;
  }

  document.getElementById('profile').href = data.profile;
  meta.textContent = data.photos.length + ' фото · обновлено ' +
    new Date(data.updated).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  // Имена файлов с камеры (DSC_0180, IMG_1234) подписью не показываем
  var cameraName = /^(DSC|DSCN|IMG|P|PICT|DCIM|_MG)[_\- ]?\d+$/i;

  var images = data.photos.map(function (photo) {
    if (cameraName.test(photo.title)) photo.title = '';

    var figure = document.createElement('figure');
    figure.className = 'tile';

    // chocolate.js берёт большую картинку из href родительской ссылки, превью — из src
    var link = document.createElement('a');
    link.href = photo.large;
    link.className = 'tile-image';

    var img = document.createElement('img');
    img.src = photo.thumb;
    img.alt = photo.title;
    img.setAttribute('data-title', photo.title);
    img.loading = 'lazy';
    link.appendChild(img);

    // Правила Flickr: показанное фото должно ссылаться на свою страницу на Flickr
    var caption = document.createElement('figcaption');
    var flickrLink = document.createElement('a');
    flickrLink.href = photo.page;
    flickrLink.textContent = photo.title || 'Открыть на Flickr';
    flickrLink.target = '_blank';
    flickrLink.rel = 'noopener';
    caption.appendChild(flickrLink);

    figure.appendChild(link);
    figure.appendChild(caption);
    grid.appendChild(figure);
    return img;
  });

  new Chocolate(images, { repeat: true });
})();
