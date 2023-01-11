const localhostRegex = /http(s?)\:[\/]{2}(localhost|127\.0\.0\.1|0\.0\.0\.0)/i
const debugging = localhostRegex.test(location.href)

function log(...args) {
  return console.log( args.join(' ') );
}

function logConditionally(dev) {

  return !dev ? 
    ()=> undefined:
    console.log.bind(console);

}

const logg = logConditionally(debugging);

function query(selector, el) {

  return !el ?
    document.querySelector(selector) :
    el.querySelector(selector);

}

function listify(selector, el) {

  return !el ?
    Array.from(document.querySelectorAll(selector)) :
    Array.from(el.querySelectorAll(selector));

}

function generateInteger(min, max) {

  const _min = Math.ceil(min);
  const _max = Math.floor(max);

  return Math.floor(Math.random() * (_max - _min + 1)) + min;
}


function isAChildOf(_parent, _child) {
  if (_parent === _child) {
    return false;
  }
  while (_child && _child !== _parent) {
    _child = _child.parentNode;
  }

  return _child === _parent;
}

function elementBelongsTo(_parent, _child) {
  if (_parent === _child) return !0

  while (_child && _child !== _parent)
    _child = _child.parentNode

  return _child === _parent
}

function eventCreator(_fn) {

  return function (e) {
    const relTarget = e.relatedTarget
    if (this === relTarget || isAChildOf(this, relTarget)) return

    _fn.call(this, e)
  }
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function generateSequenceOfRandomNumbers(length, min, max, isUnique) {

  let ids = !isUnique ?
  
    // generate random number (uniqueness is not guaranteed)
    Array
      .from({ length })
      .map(()=> 
        generateInteger(min, max)):
    []

  if (isUnique) {
    // ensure unique ids
    while (ids.length < length) {

      const elementId = generateInteger(min, max)

      !~ids.indexOf(elementId) && ids.push(elementId)

    }
  }

  return ids

}

function whenInvalidDOMRangeDo(selector, child, parent, callback, host) {

  return e=> {
    
    const hasDOM = !!query( selector )?.nodeName
    const shouldIgnore = hasDOM && elementBelongsTo(child, e.target || e.currentTarget)
  
    if ( shouldIgnore ) return logg( 'ignore toggle btn' )
  
    const isRelatedElement = elementBelongsTo(parent, e.target)
    
    if ( hasDOM && !isRelatedElement ) return callback?.call(host, e)

  }

}

function createElementByTagName(tag, className, htmlContent, id) {

  const element = document.createElement(tag?.toUpperCase())

  // assign class name
  !className ? 
    null:
    element.className = className

  // assign id
  !id  ?
    null:
    element.id = id

  // assign innerHtml
  element.innerHTML = htmlContent

  return element

}

function generateRandomText() {

  const randomText = ()=> 
      Math.random().toString(36).slice(2);

  return [ randomText(), randomText() ].join('');

}

function queryImageDimenions(url) {

  return new Promise((resolve, reject)=> {
  
      const divId = generateRandomText();
      const div = document.createElement( 'DIV' );

      // referenced to be removed later
      div.id = divId;

      // ensure no flashing content
      div.style.opacity = 0;
      div.style.visibility = 'hidden';

      const img = document.createElement('IMG');

      img.id = generateRandomText();
      img.src = url;
      img.onload = e=> {

          const { offsetWidth: width, offsetHeight: height } = e.target || {};

          document.getElementById( divId )?.remove();

          return resolve({ width, height });

      };

      img.onerror = e=> 
          reject(e);

      // append image to div
      div.appendChild(img);
      
      // append div to body
      return document.body.appendChild(div);

  });

}

const bindUnit = (value, unit)=>
  `${value}${unit}`

const preloadImages = selector=>
  new Promise(resolve=> 
    imagesLoaded(document.querySelectorAll(selector), resolve))

const getMousePos = e => 
  ({ x : e.clientX, y : e.clientY })

  // Map number x from range [a, b] to [c, d]
const map = (x, a, b, c, d) => (x - a) * (d - c) / (b - a) + c;

// Linear interpolation
const lerp = (a, b, n) => (1 - n) * a + n * b;

const calcWinsize = () => {
  return { 
    width: window.innerWidth, 
    height: window.innerHeight }
}

function whenElement(selector) {
  return new Promise(resolve => {

      if (query(selector)) return resolve(query(selector));

      const observer = new MutationObserver(mutations => {
          if (query(selector)) {
              resolve(query(selector));
              observer.disconnect();
          }
      });

      return observer.observe(document.body, {
          childList: true,
          subtree: true
      });
  });
}

function queryWistia(embeds) {
  
  if (!embeds?.length) return;
  
  let video = null;
  let length = embeds?.length;
  let forWistia = embeds[0];

  if (!length) return null;
  if (length === 1) {
    video = Wistia.api(forWistia?.id);
  }
  if (length > 1) {
    forWistia = embeds.find(a=> a.classList.contains(whichWistiaRatio()));
    if (forWistia?.id) {
      video = Wistia.api(forWistia.id);
    }
  }

  return [video, forWistia];
}

function whichWistiaRatio() {
  let portrait = innerWidth <= innerHeight;
  if (window.mobile) {
    portrait = screen.availWidth <= screen.availHeight;
    if (Math.abs(window.orientation??0) !== 0) {
      portrait = false;
    }
  };
  return portrait ? 'portrait':'landscape';
}


function muteAllWistia() {
  try {
    let control = query('.global-sound-control');
    Wistia.api.all().forEach(a=> a.mute());
    if (control) control.dataset.sound = 'off';
  } catch(e) {logg('muteAllWistia caught', e)}
}

const randomEasing = index=> {
  const easing = [
    'Power3.easeInOut',
    // 'Power3.easeIn',
  ];
  const idx = generateInteger(index, easing.length) ;
  return easing[idx];
}

function whenDomLoaded() {

  return new Promise(resolve=>
    window.addEventListener('DOMContentLoaded', e=> 
      resolve(e)))

}

function titleCase(txt) {
  return txt
    .toLowerCase()
    .replace(/(?:^|[\s-/])\w/g, m=> m.toUpperCase())
    .replace(/\-/g, ' ');
}

function addressFiltersV1() {

  // set active filter codes
  const [ _, pathFilters ] = location.pathname.match(/.+\/(.+)/i) || [];
  const filters = pathFilters?.split('+')||[];
  const filtersIsString = typeof filters === 'string'

  // filter is not specified
  if (filtersIsString) {
    if (filters.indexOf('-collection') > -1) return;
  } else if (typeof filters === 'object') {
    if (filters.some(a=> a.indexOf('-collection') > -1)) return;
  }

  const processedFilters = filtersIsString ? [filters]:filters;

  return processedFilters;
}

function urlFilters() {

  let filters = location.pathname.replace(currentCollection.url, '');

  // remove starting '/'
  filters = (filters.startsWith('/') ? filters.slice(1):filters)??[];

  // split '+', lowercase, trim  
  return filters
    .split('+')
    .map(a=> a.trim().toLowerCase())
    .filter(a=> a?.length);
}

function isNil(value) {
  return value === null || value === undefined
}

function asInteger(value) {
  if (isNil(value)) {
    return null;
  } else {

    const parsed = parseInt(value);
    
    if (isNaN(parsed)) {
      return null;
    } else {
      return parsed;
    }
  }

}

function elementTransform(el) {

  let transform = null;

  if (el) {
    let [ _, x, y ] = el.style.transform.match(/transl.+\((-?[\d\.]+)px?\,\s*(-?[\d\.]+)px?(.+\)?)/i)||[];
    transform = { x: parseFloat(x), y: parseFloat(y) };
  }

  return transform;

}

function addClass(element, _classes) {

  if (element) {
    return _classes.split(' ').forEach(a=> element.classList.add(a))
  }
}

function removeClass(element, _classes) {
  if (element) {
    return _classes.split(' ').forEach(a=> element.classList.remove(a));
  }
}

function mobileCheck() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);

  return check;
};

function dispatchCustomEvent(key, detail = null, object = window) {
  return object.dispatchEvent(new CustomEvent(key, { detail }))
}

function appliedFilters() {

  let tags = location.pathname.replace(collectionUrl, '');

  if (isNil(tags)) return [];

  if (tags[0] === '/') tags = tags.slice(1);
  return tags.split('+').filter(a=> !!a.length);

}

function applyWidthRatio(ratio, height) {

  let w = 0;

  if (ratio?.length) {

    if (ratio.match('1x1')) {
      w = height;
    } else if (ratio.match('2x1')) {
      w = Math.floor(height / 2);
    } else if (ratio.match('16x9')) {
      w = Math.floor(height * 16 / 9);
    } else if (ratio.match('4x5')) {
      w = Math.floor(height * 4 / 5);
    } else if (ratio.match('5x4')) {
      w = Math.floor(height * 5 / 4);
    }
  }
  
  return w;

}

function applyHeightRatio(ratio, width) {

  let h = 0;

  if (ratio?.length) {

    if (ratio.match('1x1')) {
      h = width;
    } else if (ratio.match('2x1')) {
      h = Math.floor(width / 2);
    } else if (ratio.match('16x9')) {
      h = Math.floor(width / 16 * 9);
    } else if (ratio.match('4x5')) {
      h = Math.floor(width / 4 * 5);
    } else if (ratio.match('5x4')) {
      h = Math.floor(width / 5 * 4);
    }
  }
  
  return h;
}

function keepAspectRatio() {

  const elements = listify('.keep-aspect') || [];

  elements.forEach(el => {

    let w;
    let h;

    const aspect = [...el.classList].find(a => a.indexOf('aspect-') > -1) || 'aspect-1x1';
    const [_, ratio] = aspect.match(/aspect\W(.+)$/i) || [];
    const {height: elH, width: elW} = el.getBoundingClientRect();

    if (this.isHorizontalPage) {

      // header menu is 45px
      const shouldUpdateHeight = elH > this.maxElHeight;

      // TODO ensure height doesn't exceed windw.innerHeight
      const cappedElH = shouldUpdateHeight ?
          Math.min.apply(undefined, [this.maxElHeight, elH]) :
          elH;

      w = applyWidthRatio(ratio, cappedElH);

      if (!isNil(w)) {
        el.style['width'] = `${w}px`;
      }

      if (el) {
        el.style['height'] = `${this.maxElHeight}px`
      }

    } else {

      const attribute = window.innerWidth < 768 ? 'min-height' : 'height';

      h = applyHeightRatio(ratio, elW);

      if (!isNil(h)) {
        el.style[attribute] = `${h}px`;
      }
    }

  });
}


function triggerWindowResize() {
  try {
    // cross-browser compatible
    const resizeEvent = window.document.createEvent('UIEvents');
    resizeEvent.initUIEvent('resize', true, false, window, 0);
    return window.dispatchEvent(resizeEvent);
  } catch(e) {
    // for modern browsers
    return window.dispatchEvent(new Event('resize'));
  }
}

function arrayWithLength(length) {
  return Array.from({ length });
}

function isSoundOn() {
  try {
    return query('.global-sound-control')?.dataset.sound === 'on';
  } catch(e) { 
    logg('isSoundOn caught ', e);
    return false;
  }
}

function cap(x, min, max) {
  let value = x;
  if (!isNil(min) && value<min) value = min;
  if (!isNil(max) && value>max) value = max;

  return value;
}

function hyphenate(camelized) {
  return camelized.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
}

function camelize(hyphenated) {
  return hyphenated.replace(/-([a-z])/g, m=> m[1].toUpperCase());
}

function getCss(hyphenatedAttr, element) {
  try {
    if (!element) element = document.documentElement;
    if (hyphenatedAttr?.length) return getComputedStyle(element)[camelize(hyphenatedAttr)];
    return getComputedStyle(element);
  } catch(e) {
    return getComputedStyle(element);
  }
}

function getCssInt(...args) {
  try {
    return parseInt(getCss.apply(this, args));
  } catch(e) {
    return getCss(args);
  }
}

function getCssVariable(cssVariable) {
  return getCss().getPropertyValue(cssVariable);
}