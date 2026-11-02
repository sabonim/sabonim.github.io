(function(window, document) {

var defaultOptions = {
  "thumbnails": true,
  "history": true,
  "repeat": false,

  "actions": {
    "overlay": false,
    "leftside": "prev",
    "container": "next",
    "rightside": "close"
  }
};

var templates = {"image-hover":"<span class=\"choco-item-hover\" data-pid=\"{{cid}}\"></span>","overlay":"<div class=\"choco-overlay\"><div class=\"choco-slider\"><div class=\"choco-inline-hack\"></div></div><div class=\"choco-leftside choco-unselect\"></div><div class=\"choco-rightside choco-unselect\"></div>{{thumbnails}}</div>","slide":"<div class=\"choco-slide\"><div class=\"choco-slide-container\"><span class=\"choco-slide-title choco-empty\">{{title}}</span><div class=\"choco-spinner\"><img src=\"chocolate/images/loader.png\" width=\"30\" height=\"30\" alt=\"\" class=\"choco-spinner-cssanimation\"><img src=\"chocolate/images/loader.gif\" width=\"32\" height=\"32\" alt=\"\" class=\"choco-spinner-gifanimation\"></div><img class=\"choco-slide-image\" src=\"\" title=\"{{title}}\" alt=\"{{title}}\"></div></div>","thumbnails":"<ul class=\"choco-thumbnails choco-unselect\"></ul><div class=\"choco-thumbnails-toggle choco-unselect\"></div>","thumbnails-item":"<li class=\"choco-thumbnail\" data-cid=\"{{cid}}\" style=\"background-image:url('{{thumb}}')\"></li>"};

var Chocolate, Storage, addClass, addEvent, beforeEnd, capture, choco, choco_animated, choco_body, choco_empty, choco_error, choco_hide, choco_hover, choco_item, choco_loading, choco_no_thumbnails, choco_selected, choco_show, choco_title, choco_touch, classList, cssAnimationsSupport, dummy, env, existActions, getAttribute, getEnv, getImageFromUri, getOffset, getStyle, getTarget, getTouch, hasClass, instances, isOpen, isSupport, isTouch, merge, mustache, needResize, offsetHeight, offsetWidth, opened, pushState, removeClass, scale, session, setStyle, squeeze, startTouch, stop, toCamelCase, toInt, toggleClass, touchShift, touchType, transitionType, translate,
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf;

if (!defaultOptions || !templates) {
  throw new Error("You don't have defaultOptions or templates variables");
  return;
}

choco = 'choco-';

choco_body = choco + 'body';

choco_error = choco + 'error';

choco_empty = choco + 'empty';

choco_hide = choco + 'hide';

choco_hover = choco + 'hover';

choco_item = choco + 'item';

choco_loading = choco + 'loading';

choco_selected = choco + 'selected';

choco_show = choco + 'show';

choco_title = choco + 'slide-title';

choco_no_thumbnails = choco + 'no-thumbnails';

choco_animated = choco + 'animated';

existActions = ['next', 'prev', 'close'];

env = {};

isOpen = false;

isTouch = false;

isSupport = !!window.addEventListener;

needResize = true;

instances = [];

opened = null;

startTouch = pushState = dummy = function() {};

session = {
  set: dummy,
  get: dummy
};

merge = function(o1, o2) {
  var key, value;
  for (key in o2) {
    if (!hasProp.call(o2, key)) continue;
    value = o2[key];
    if (value instanceof Object) {
      o1[key] = merge(o1[key], value);
    } else {
      o1[key] = value;
    }
  }
  return o1;
};

mustache = function(a, b) {
  return a.replace(/\{\{([^{}]+)\}\}/g, function(c, d) {
    if (b.hasOwnProperty(d) && (b[d] != null)) {
      return `${b[d]}`;
    } else {
      return '';
    }
  });
};

getTarget = function(element, selector) {
  if (selector) {
    return element.querySelector(selector);
  }
  return element;
};

addEvent = function(element, event, listener, selector) {
  var target;
  target = getTarget(element, selector);
  if (!target) {
    return;
  }
  target.addEventListener(event, listener, false);
};

classList = function(element, className, selector, method) {
  var target;
  target = getTarget(element, selector);
  if (!target || !target.classList) {
    return false;
  }
  return target.classList[method](className);
};

addClass = function(element, className, selector) {
  return classList(element, className, selector, 'add');
};

removeClass = function(element, className, selector) {
  return classList(element, className, selector, 'remove');
};

toggleClass = function(element, className, selector) {
  return classList(element, className, selector, 'toggle');
};

hasClass = function(element, className, selector) {
  return classList(element, className, selector, 'contains');
};

getAttribute = function(element, attribute) {
  return element.getAttribute(attribute);
};

getStyle = function(element) {
  var style;
  style = window.getComputedStyle(element);
  return function(property) {
    return style.getPropertyValue(property);
  };
};

setStyle = function(element, params) {
  var property, results, value;
  results = [];
  for (property in params) {
    if (!hasProp.call(params, property)) continue;
    value = params[property];
    results.push(element.style[toCamelCase(property)] = value);
  }
  return results;
};

toCamelCase = function(str) {
  return str.replace(/-([a-z])/g, function(str) {
    return str[1].toUpperCase();
  });
};

offsetWidth = function(element) {
  return element.offsetWidth;
};

offsetHeight = function(element) {
  return element.offsetHeight;
};

beforeEnd = function(element, template) {
  element.insertAdjacentHTML('beforeend', template);
  return element.lastElementChild;
};

stop = function(event) {
  event.stopPropagation();
  event.preventDefault();
};

toInt = function(string) {
  return parseInt(string, 10) || 0;
};

squeeze = function(n, min, max) {
  if (min > max) {
    [min, max] = [max, min];
  }
  if (n < min) {
    n = min;
  }
  if (n > max) {
    n = max;
  }
  return n;
};

scale = function(w1, h1, w2, h2) {
  var ratio;
  ratio = w1 / h1;
  if (w1 > w2) {
    w1 = w2;
    h1 = w2 / ratio;
  }
  if (h1 > h2) {
    w1 = h2 * ratio;
    h1 = h2;
  }
  return [toInt(w1), toInt(h1)];
};

getEnv = function() {
  var h, shift, slide, style, w;
  if (!needResize) {
    return env;
  }
  env = {
    w: window.innerWidth || document.documentElement.clientWidth,
    h: window.innerHeight || document.documentElement.clientHeight
  };
  if (isOpen) {
    slide = getTarget(opened.slider, `.${choco}slide`);
    if (!slide) {
      return env;
    }
    needResize = false;
    style = getStyle(slide);
    shift = toInt(slide.offsetWidth);
    h = toInt(style('height')) - toInt(style('padding-top')) - toInt(style('padding-bottom'));
    w = shift - toInt(style('padding-left')) - toInt(style('padding-right'));
    env.shift = shift * -1;
    env.s = {w, h};
  }
  return env;
};

translate = (function() {
  var accelerate, element, i, len, prefix, prop, property, ref;
  property = false;
  accelerate = false;
  element = document.createElement('div');
  if (element.style.transform) {
    property = 'transform';
  }
  if (!property) {
    ref = ['Webkit', 'Moz', 'O', 'ms'];
    for (i = 0, len = ref.length; i < len; i++) {
      prefix = ref[i];
      prop = `${prefix}Transform`;
      if (element.style[prop] !== void 0) {
        property = prop;
        break;
      }
    }
  }
  if (!property) {
    return dummy;
  } else {
    element.style[property] = 'translate3d(1px,0,0)';
    accelerate = getStyle(element)(property);
    return function(element, shift) {
      if (accelerate) {
        shift = `translate3d(${shift}px,0,0)`;
      } else {
        shift = `translateX(${shift}px)`;
      }
      return element.style[property] = shift;
    };
  }
})();

cssAnimationsSupport = (function() {
  var cssanimations, element, html, i, len, prefix, prefixes, support;
  cssanimations = 'cssanimations';
  html = document.querySelector('html');
  if (hasClass(html, cssanimations)) {
    return true;
  }
  support = false;
  element = document.createElement('div');
  if (element.style.animationName) {
    support = true;
  }
  prefixes = ['Webkit', 'Moz', 'O', 'ms'];
  for (i = 0, len = prefixes.length; i < len; i++) {
    prefix = prefixes[i];
    if (!(element.style[prefix + 'AnimationName'] !== void 0)) {
      continue;
    }
    support = true;
    break;
  }
  if (support === true) {
    addClass(html, cssanimations);
  }
  return support;
})();

Storage = class Storage {
  constructor(repeat) {
    this.repeat = !!repeat;
    this.images = {};
    this.counter = 0;
  }

  add(image) {
    var cid, fragments;
    if (!image.orig) {
      return false;
    }
    cid = this.counter++;
    fragments = image.orig.split('/');
    image.hashbang = fragments[fragments.length - 1];
    if (!image.thumb) {
      image.thumb = image.orig;
    }
    this.images[cid] = merge({
      cid: cid, // id
      name: '', // title
      thumb: '', // preview
      hashbang: '', // filename
      orig: '', // original
      w: null, // width
      h: null // height
    }, image);
    return this.images[cid];
  }

  get(cid) {
    return this.images[cid];
  }

  next(current) {
    var cid;
    cid = current.cid + 1;
    if (this.repeat && !this.images[cid]) {
      cid = 0;
    }
    return this.images[cid];
  }

  prev(current) {
    var cid;
    cid = current.cid - 1;
    if (this.repeat && cid < 0) {
      cid = this.length() - 1;
    }
    return this.images[cid];
  }

  length() {
    return Object.keys(this.images).length;
  }

  search(hash) {
    var image, key, ref;
    ref = this.images;
    for (key in ref) {
      if (!hasProp.call(ref, key)) continue;
      image = ref[key];
      if (`#${image.hashbang}` === hash) {
        return image;
      }
    }
    return false;
  }

};

if (!!window.sessionStorage) {
  session = (function() {
    var key;
    key = choco + 'thumbnails';
    return {
      set: function(value) {
        window.sessionStorage.setItem(key, +value);
      },
      get: function() {
        return window.sessionStorage.getItem(key);
      }
    };
  })();
}

if (!!(window.history && window.history.pushState)) {
  getImageFromUri = function() {
    var chocolate, hash, i, item, len;
    hash = window.location.hash;
    if (!hash && isOpen) {
      opened.close();
      return;
    }
    if (isOpen) {
      item = opened.storage.search(hash);
      if (item) {
        opened.select(item, false);
        return;
      }
    }
    for (i = 0, len = instances.length; i < len; i++) {
      chocolate = instances[i];
      item = chocolate.storage.search(hash);
      if (item) {
        if (isOpen) {
          opened.close();
        }
        chocolate.open(item, false);
        return;
      }
    }
  };
  if ('onhashchange' in window) {
    addEvent(window, 'hashchange', function() {
      getImageFromUri();
    });
  }
  addEvent(document, 'DOMContentLoaded', function() {
    getImageFromUri();
  });
  pushState = function(title, hash) {
    title = title || '';
    hash = hash || '';
    window.history.pushState(null, title, `#${hash}`);
  };
}

choco_touch = choco + 'touch';

touchType = (function() {
  var element;
  if (!isSupport) {
    return 0;
  }
  element = document.createElement('div');
  element.setAttribute('ongesturestart', 'return');
  if (typeof element.ongesturestart === 'function') {
    return 2;
  }
  element.setAttribute('ontouchstart', 'return');
  if (typeof element.ontouchstart === 'function') {
    return 1;
  }
  return 0;
})();

transitionType = (function() {
  var element, i, len, prefix, prefixes, property;
  element = document.createElement('div');
  property = 'transition';
  if (element.style[property] !== void 0) {
    return true;
  }
  property = property.replace(/^./, property[0].toUpperCase());
  prefixes = ['Webkit', 'Moz', 'O', 'ms'];
  for (i = 0, len = prefixes.length; i < len; i++) {
    prefix = prefixes[i];
    if (element.style[prefix + property] !== void 0) {
      return prefix.toLowerCase() + property;
    }
  }
  return false;
})();

if (touchType !== 0) {
  isTouch = true;
  getOffset = function(element) {
    var regex, style, transform;
    style = getStyle(element);
    regex = /matrix\(([0-9-\.,\s]*)\)/;
    transform = style('transform') || style('-webkit-transform') || style('-ms-transform') || '';
    if (regex.test(transform)) {
      transform = regex.exec(transform)[1].split(',')[4].trim() || 0;
    } else {
      transform = 0;
    }
    return toInt(transform);
  };
  touchShift = (function() {
    var length;
    length = window.innerHeight * 0.25;
    return function(touch, offset) {
      offset = Math.abs(offset);
      if ((touch.x0 - touch.x > length) || (touch.x - touch.x0 < length)) {
        return Math.ceil(offset);
      }
      return Math.floor(offset);
    };
  })();
  getTouch = function(touches, finger) {
    var i, len, touch;
    for (i = 0, len = touches.length; i < len; i++) {
      touch = touches[i];
      if (touch.identifier === finger) {
        return touch;
      }
    }
    return false;
  };
  capture = function(touch) {
    return {
      id: touch.identifier,
      x: touch.pageX,
      y: touch.pageY
    };
  };
  startTouch = function(chocolate) {
    var end, finger, finish, isClosing, isThumbing, max, move, opacity, start, transitionend, transparent;
    getEnv();
    isThumbing = false;
    isClosing = false;
    max = -1;
    opacity = 1;
    finger = {};
    transparent = function(level) {
      opacity = level;
      setStyle(chocolate.overlay, {
        opacity: level
      });
    };
    finish = function() {
      removeClass(chocolate.overlay, choco_animated);
      if (!isClosing) {
        return;
      }
      chocolate.close();
      transparent(1);
    };
    start = function(event) {
      var key, touch, value;
      if (event.changedTouches.length !== 1) {
        return;
      }
      touch = capture(event.changedTouches.item(0));
      if (!touch) {
        return;
      }
      for (key in touch) {
        if (!hasProp.call(touch, key)) continue;
        value = touch[key];
        finger[key] = value;
      }
      finger.x0 = finger.x;
      return finger.y0 = finger.y;
    };
    move = function(event) {
      var distanceX, distanceY, dx, sliderOffset, touch;
      touch = capture(getTouch(event.changedTouches, finger.id));
      if (!touch) {
        return;
      }
      dx = (touch.x - finger.x) || 0;
      finger.x = touch.x;
      finger.y = touch.y;
      distanceX = Math.abs(finger.x0 - touch.x);
      distanceY = Math.abs(finger.y0 - touch.y);
      isThumbing = distanceX > distanceY;
      isClosing = !isThumbing;
      sliderOffset = getOffset(chocolate.slider);
      if (isThumbing) {
        transparent(1);
        translate(chocolate.slider, sliderOffset + dx);
      } else {
        transparent(Math.round((1 - distanceY / env.h) * 100) / 100);
      }
      stop(event);
    };
    end = function(event) {
      var sliderOffset, touch;
      touch = capture(getTouch(event.changedTouches, finger.id));
      if (!touch) {
        return;
      }
      touch.x0 = finger.x0;
      touch.y0 = finger.y0;
      if (isThumbing) {
        addClass(chocolate.slider, choco_animated);
        if (max === -1) {
          max = chocolate.storage.length() - 1;
        }
        sliderOffset = getOffset(chocolate.slider);
        sliderOffset = touchShift(touch, sliderOffset / env.w);
        chocolate.select(squeeze(sliderOffset, 0, max));
      }
      if (isClosing) {
        addClass(chocolate.overlay, choco_animated);
        if (opacity < 0.7) {
          transparent(0);
          if (transitionType === false) {
            finish();
          }
        } else {
          transparent(1);
          isClosing = false;
        }
      }
      finger = {};
    };
    addClass(chocolate.overlay, choco_touch);
    addEvent(chocolate.slider, 'click', function(event) {
      stop(event);
    });
    addEvent(chocolate.slider, 'hover', function(event) {
      stop(event);
    });
    if (transitionType !== false) {
      transitionend = transitionType === true ? 'transitionend' : transitionType + 'End';
    }
    addEvent(chocolate.slider, transitionend, function() {
      removeClass(chocolate.slider, choco_animated);
    });
    addEvent(chocolate.overlay, transitionend, function() {
      finish();
    });
    addEvent(chocolate.overlay, 'touchstart', start);
    addEvent(chocolate.overlay, 'touchmove', move);
    addEvent(chocolate.overlay, 'touchend', end);
    addEvent(chocolate.overlay, 'touchcancel', end);
    return addEvent(chocolate.overlay, 'touchleave', end);
  };
}

Chocolate = (function() {
  var addImage, loadImage, prepareActionFor, resizeHandler, setAnimation, setSize;

  class Chocolate {
    constructor(images, options = {}) {
      var container, containers, i, j, k, len, len1, len2, ref, ref1, template, thumbnailTemplate;
      this.options = merge(defaultOptions, options);
      this.storage = new Storage(this.options.repeat);
      thumbnailTemplate = this.options.thumbnails && templates.thumbnails ? templates.thumbnails : '';
      template = templates.overlay.replace('{{thumbnails}}', thumbnailTemplate);
      this.overlay = beforeEnd(document.body, template);
      this.slider = getTarget(this.overlay, `.${choco}slider`);
      startTouch(this);
      if (isTouch) {
        this.options.thumbnails = false;
      } else {
        containers = ['leftside', 'rightside'];
        if (this.options.thumbnails) {
          containers.push('thumbnails');
        }
        for (i = 0, len = containers.length; i < len; i++) {
          container = containers[i];
          this[container] = getTarget(this.overlay, `.${choco}${container}`);
        }
        if (this.options.thumbnails) {
          this.thumbnailsToggle = getTarget(this.overlay, `.${choco}thumbnails-toggle`);
          addEvent(this.thumbnailsToggle, 'click', () => {
            this.toggleThumbnails();
          });
        } else {
          ref = ['overlay', 'leftside', 'rightside'];
          for (j = 0, len1 = ref.length; j < len1; j++) {
            container = ref[j];
            addClass(this[container], choco_no_thumbnails);
          }
        }
        ref1 = ['overlay', 'leftside', 'rightside'];
        for (k = 0, len2 = ref1.length; k < len2; k++) {
          container = ref1[k];
          prepareActionFor(this, container);
        }
      }
      if (images) {
        this.add(images);
      }
      instances.push(this);
    }

    close() {
      setAnimation(opened, false);
      isOpen = false;
      opened = null;
      if (hasClass(this.overlay, choco_show)) {
        removeClass(this.overlay, choco_show);
        removeClass(document.body, choco_body);
        if (this.options.thumbnails) {
          removeClass(this.current.thumbnail, choco_selected);
        }
        this.current = null;
        pushState();
      }
      return this;
    }

    open(cid, updateHistory) {
      var showThumbnails;
      if (isOpen) {
        return this;
      }
      opened = this;
      isOpen = true;
      addClass(this.overlay, choco_show);
      addClass(document.body, choco_body);
      showThumbnails = session.get();
      if (showThumbnails != null) {
        this.toggleThumbnails(showThumbnails);
      }
      this.updateDimensions();
      this.select(cid, updateHistory);
      setTimeout(function() {
        return setAnimation(opened);
      }, 0);
      return this;
    }

    select(item, updateHistory = true) {
      var loading, offset, ref, thumb;
      if (typeof item === 'number') {
        item = this.storage.get(item);
      }
      if (!item) {
        return false;
      }
      getEnv();
      translate(this.slider, env.shift * item.cid);
      if (item.bg) {
        this.overlay.style.background = item.bg;
      } else {
        this.overlay.style.background = "";
      }
      if (this.options.thumbnails) {
        if (this.current != null) {
          removeClass(this.current.thumbnail, choco_selected);
        }
        thumb = item.thumbnail;
        addClass(thumb, choco_selected);
        offset = (env.w / 2) - thumb.offsetLeft - (offsetWidth(thumb) / 2);
        offset = squeeze(offset, 0, env.w - this.dimensions.thumbWidth);
        translate(this.thumbnails, offset);
      }
      if (updateHistory) {
        pushState((ref = item.title) != null ? ref : item.hashbang, item.hashbang);
      }
      loading = hasClass(item.slide, choco_loading);
      if (loading) {
        loadImage(item, () => {
          return this.updateSides(item);
        });
      } else {
        this.updateSides(item);
      }
      this.current = item;
      return true;
    }

    next() {
      this.select(this.storage.next(this.current));
      return this;
    }

    prev() {
      this.select(this.storage.prev(this.current));
      return this;
    }

    add(images) {
      var i, image, isElement, len, object;
      if (!images || images.length === 0) {
        return this;
      }
      for (i = 0, len = images.length; i < len; i++) {
        object = images[i];
        image = null;
        if (typeof HTMLElement === 'object') {
          isElement = object instanceof HTMLElement;
        } else {
          isElement = typeof object === 'object' && object.nodeType === 1 && typeof object.nodeName === 'string';
        }
        if (isElement) {
          image = object;
          object = {
            orig: getAttribute(image, 'data-src') || getAttribute(image.parentNode, 'href'),
            title: getAttribute(image, 'data-title') || getAttribute(image, 'title') || getAttribute(image, 'alt') || getAttribute(image.parentNode, 'title'),
            thumb: getAttribute(image, 'src'),
            bg: getAttribute(image, 'data-background')
          };
        }
        addImage(this, object, image);
      }
      return this;
    }

    updateDimensions() {
      var cid, image, ref;
      if (this.options.thumbnails) {
        this.dimensions = {
          thumbWidth: offsetWidth(this.thumbnails)
        };
      }
      ref = this.storage.images;
      for (cid in ref) {
        image = ref[cid];
        setSize(image);
      }
    }

    updateSides(item) {
      var s;
      if (isTouch) {
        return;
      }
      if (!item.size) {
        item.size = offsetWidth(getTarget(item.slide, `.${choco}slide-container`));
      }
      s = `${(env.w - item.size) / 2}px`;
      setStyle(this.leftside, {
        width: s
      });
      setStyle(this.rightside, {
        width: s
      });
    }

    toggleThumbnails(show) {
      var container, containers, i, len, method;
      if (isTouch) {
        return;
      }
      containers = ['leftside', 'rightside', 'overlay', 'thumbnailsToggle'];
      if (show != null) {
        if (show === '1') {
          method = 'remove';
        } else {
          method = 'add';
        }
      } else {
        if (hasClass(this.thumbnails, choco_hide)) {
          method = 'remove';
          show = true;
        } else {
          method = 'add';
          show = false;
        }
        session.set(show);
      }
      classList(this.thumbnails, choco_hide, null, method);
      for (i = 0, len = containers.length; i < len; i++) {
        container = containers[i];
        classList(this[container], choco_no_thumbnails, null, method);
      }
      resizeHandler();
    }

  };

  /*
    Private methods
  */
  if (isSupport) {
    addImage = function(chocolate, data, image) {
      var action, preload, showFirstImage, template;
      data = chocolate.storage.add(data);
      if (!data) {
        return;
      }
      if (chocolate.options.thumbnails) {
        template = mustache(templates['thumbnails-item'], data);
        data.thumbnail = beforeEnd(chocolate.thumbnails, template);
        addEvent(data.thumbnail, 'click', function() {
          chocolate.select(data);
        });
      }
      template = mustache(templates['slide'], data);
      data.slide = beforeEnd(chocolate.slider, template);
      addClass(data.slide, choco_loading);
      data.img = getTarget(data.slide, `.${choco}slide-image`);
      action = chocolate.options.actions.container;
      if (indexOf.call(existActions, action) >= 0) {
        addEvent(data.slide, 'click', function() {
          chocolate[action]();
        }, `.${choco}slide-container`);
      }
      if (!image) {
        return;
      }
      showFirstImage = function(event, cid) {
        stop(event);
        chocolate.open(cid);
      };
      addClass(image, choco_item);
      addEvent(image, 'click', function(event) {
        showFirstImage(event, data.cid);
      });
      if (isTouch) {
        return;
      }
      preload = new Image();
      addEvent(preload, 'load', function() {
        var popover;
        template = mustache(templates['image-hover'], data);
        image.insertAdjacentHTML('afterend', template);
        popover = getTarget(document, '[data-pid="' + data.cid + '"]');
        setStyle(popover, {
          'width': `${offsetWidth(image)}px`,
          'height': `${offsetHeight(image)}px`,
          'margin-top': `-${offsetHeight(image)}px`
        });
        addEvent(image, 'mouseenter', function() {
          toggleClass(popover, choco_hover);
        });
        addEvent(image, 'mouseleave', function() {
          toggleClass(popover, choco_hover);
        });
        return addEvent(popover, 'click', function(event) {
          showFirstImage(event, data.cid);
        });
      });
      preload.src = data.thumb;
    };
    loadImage = function(item, fn) {
      var image;
      image = new Image();
      addEvent(image, 'load', function() {
        var title;
        item.img.src = this.src;
        item.w = image.width;
        item.h = image.height;
        removeClass(item.slide, choco_loading);
        title = getTarget(item.slide, `.${choco_title}`);
        if ((title != null) && title.innerHTML.trim() !== "") {
          removeClass(title, choco_empty);
        }
        setSize(item);
        fn(true);
      });
      addEvent(image, 'error', function() {
        removeClass(item.slide, choco_loading);
        addClass(item.slide, choco_error);
        addClass(item.thumbnail, choco_error);
        fn(false);
      });
      image.src = item.orig;
    };
    prepareActionFor = function(chocolate, container) {
      var action, verify;
      action = chocolate.options.actions[container];
      if (indexOf.call(existActions, action) < 0) {
        return;
      }
      verify = chocolate[container].classList[0];
      addEvent(chocolate[container], 'click', function(event) {
        if (hasClass(event.target, verify)) {
          chocolate[action]();
        }
      });
      if (action === 'close') {
        addEvent(chocolate[container], 'mouseenter', function() {
          toggleClass(chocolate.overlay, choco_hover, `.${choco}close`);
        });
        addEvent(chocolate[container], 'mouseleave', function() {
          toggleClass(chocolate.overlay, choco_hover, `.${choco}close`);
        });
      }
    };
    setSize = function(item) {
      var s;
      if (!(item.w > 0 && item.h > 0)) {
        return;
      }
      getEnv();
      s = scale(item.w, item.h, env.s.w, env.s.h);
      item.img.width = s[0];
      item.img.height = s[1];
    };
    resizeHandler = function() {
      needResize = true;
      if (isOpen) {
        setAnimation(opened, false);
        opened.updateDimensions();
        opened.select(opened.current);
        setAnimation(opened);
      }
    };
    addEvent(window, 'resize', resizeHandler);
    addEvent(window, 'orientationchange', resizeHandler);
    setAnimation = function(chocolate, enable = true) {
      var method;
      method = enable ? 'add' : 'remove';
      if (chocolate.options.thumbnails) {
        classList(chocolate.thumbnails, choco_animated, null, method);
      }
      return classList(chocolate.slider, choco_animated, null, method);
    };
    if (!isTouch) {
      addEvent(window, 'keydown', function(event) {
        if (!isOpen || !hasClass(opened.overlay, choco_show)) {
          return;
        }
        switch (event.keyCode) {
          case 27: // ESC
            return opened.close();
          case 37: // Left arrow
            return opened.prev();
          case 39: // Right arrow
            return opened.next();
        }
      });
    }
  }

  return Chocolate;

}).call(this);

window.Chocolate = isSupport ? Chocolate : dummy;


})(window, document);
