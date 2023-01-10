(()=> {

  let nestedNavigation;
  let nestNavigationHeight = 0;
  let vars = {};
  let onWindowScroll;
  let tl = gsap.timeline({ paused: true });

  window.tl = tl;
  
  function mainnav() {

    const navToggle = query('.nav-toggle');
    const header = query('header');
    nestedNavigation = query('nav.n-level');
    const itemsWithSubmenu = listify('header .list-menu__item');

    function closeNavigation(opts) {

      let { removeBodyHtmlClass } = opts||{};

      itemsWithSubmenu.forEach(a=> {
        a.parentElement?.classList.remove('open');
        a.setAttribute('aria-expanded', false);
      });

      document.body?.classList.remove('submenu-open');
      if (removeBodyHtmlClass !== false) {
        document.body?.classList.remove('header-open');
      }
      
      nestedNavigation.innerHTML = '';
      onNestedNavToggle(false);
    }

    itemsWithSubmenu.forEach(item=> {
      item.addEventListener('click', e=> {

        e.stopPropagation();
        if (!item.getAttribute('href')) e.preventDefault();

        let parent = item.parentElement;
        let menu = query('.list-menu', parent);

        itemsWithSubmenu.forEach(a=> {
          if (a !== item) {
            a.parentElement?.classList.remove('open');
            a.setAttribute('aria-expanded', false);
          }
        });

        if (parent.classList.contains('open')) {
          parent.classList.remove('open');
          nestedNavigation.innerHTML = null;
        } else {
          parent.classList.add('open');
          if (menu) {
            nestedNavigation.innerHTML = menu.outerHTML;
          }
        }

        // set aria-expanded
        item.setAttribute('aria-expanded', parent.classList.contains('open'));
        document.body?.classList[
          parent.classList.contains('open') ? 'add':'remove'
        ]('submenu-open');
        
        onNestedNavToggle(parent.classList.contains('open'));
      });
    });

    // auto-collapse header if clicked outside
    document.addEventListener('click', e=> !elementBelongsTo(header, e.target) && closeNavigation());

    // auto-collapse on [escape] clicked
    document.addEventListener('keyup', e=> e.key === 'Escape' && closeNavigation());

    // close submenu
    header.addEventListener('click', e=> {
      if (e.target?.classList.contains('close-submenu-btn')) {
        e.stopPropagation();
        closeNavigation({ removeBodyHtmlClass: false });
      }
    });

    // mobile nav
    if (navToggle) navToggle.addEventListener('click', ()=> {
      document.body?.classList.toggle('header-open');

      // close submenu if closed
      if (!document.body?.classList.contains('header-open')) {
        closeNavigation();
      }
    });
  }

  function onNestedNavToggle(isOpen) {
    nestNavigationHeight = nestedNavigation.clientHeight;
    ___onWindowScroll();
  }

  function newsletterToggle() {

    // class '.footer' exist in +1 places
    let footers = listify('.footer');

    if (!footers?.length) return; 
    footers.forEach(footer=> {

      let label = query('.footer-block__newsletter label', footer);
      let input = query('input[type=email]', footer);
      let newsletterWrap = query('.footer-block__newsletter', footer);

      // toggle if [label] is clicked
      if (label) label.addEventListener('click', ()=> {
        footer.classList.toggle('open');

        // make input autofocus
        if (footer.classList.contains('open')) setTimeout(()=> input?.focus(), 200);
      });

      // auto-close if clicked [elsewhere]
      document.addEventListener('click', e=> {
        if (!elementBelongsTo(newsletterWrap, e.target)) footer.classList.remove('open');
      });
    });

  }

  function onEscape() {

    let elements = [
      { item: 'body', htmlClass: 'header-open' },
      { item: 'body', htmlClass: 'collection-tools-open' },
      { item: 'header', htmlClass: 'open' },
      { item: 'body', htmlClass: 'submenu-open' },
      { item: 'footer', htmlClass: 'open' },
      { item: '.collection-tools', htmlClass: 'open' },
      { item: '.product-size-variants', htmlClass: 'open' },
    ];

    elements = elements.map(a=> ({ ...a, dom: query(a.item) })).filter(a=> a.dom);
    if (elements?.length) elements.forEach(a=> {
      if (a?.dom) a.dom.classList?.remove(a.htmlClass);
    });

    onNestedNavToggle();
  }

  function bootstrapWistiaEmbedAPI() {
    let _wq = [];
    let pristine = true;
    let wistiaRatio = whichWistiaRatio();
    let autoplayedWistiaId = null;

    _wq.push({
      id: '_all',
      options: {
        videoFoam: false,
        playerColor: '000000',
        autoPlay: true,
        muted: true,
        controlsVisibleOnLoad: false,
        playbar: false,
        endVideoBehavior: 'loop',
        playButton: false,
        volumeControl: false,
        fullscreenButton: false,
        qualityControl: false,
        playPauseNotifier: false,
        playbackRateControl: false,
      },
      onReady: video => {
        try {
          
          let hashedId = video.hashedId();
          if (isNil(autoplayedWistiaId)) {
            
            let embed = video.getMediaElement().closest('.wistia_embed');
            let isAutoplayed = embed.hasAttribute('data-autoplayed-wistia');
            let sameRatio = embed.classList.contains(wistiaRatio);

            if (isAutoplayed && sameRatio) {
              autoplayedWistiaId = hashedId;
              logg('autoplayed hashedId ', autoplayedWistiaId);
            }
          }

          video.bind('play', ()=> {

            if (isSoundOn()) {
              video.unmute();
            }
            
            let videos = Wistia.api.all();
            for (let i = 0; i < videos.length; i++) {
              if (videos[i].hashedId() !== hashedId) {
                videos[i].mute();

                if (pristine && videos[i].hashedId() === autoplayedWistiaId) {
                  continue;
                }
                videos[i].pause();
              }
            }
          });

          video.bind('crosstime', 2, ()=> {
            
            if (autoplayedWistiaId === hashedId) {
              pristine = false;
              dispatchCustomEvent('wsitia-control-sound', video);
              triggerWindowResize();
              logg('pristine/false');
            }
          });
        
          //setTimeout(()=> video.play(), 500); // force play
          video.bind('end', ()=> video.play()); // force loop
        } catch(e) { logg('bootstrapWistiaEmbedAPI caught ', e) }
      }
    });
    return window._wq = _wq;
  }

  function switchIframeToWistiaEmbed() {
    try {
      let wistia = listify('iframe.embed-responsive-item');
      if (!wistia?.length) return;
      return wistia = wistia
        .filter(a=> a.src.includes('wistia'))
        .map(a=> {

          // add desktop-resource automatically, only if there are multiple iframe
          // backward-compatible
          if (!a.className.includes('-resource') && listify('iframe.embed-responsive-item', a.parentElement)?.length > 1) {
            a.classList.add('desktop-resource');
          }

          let [_, videoId] = a.src?.match(/http\s?.+\/(\S+)\?/)||[];
          a.outerHTML = `<div class="wistia_embed wistia_async_${videoId} ${a.className}"></div>`

          return a;

        });
    } catch(e) { logg('compatible wistia embed api - caught ', e ) }
  }

  function wistiaShowThumbnail() {

    let p = [];
    let wistias = listify('.wistia_embed');
    if (!wistias?.length) return;
    wistias.forEach(wistia=> {
      let [_,hashedId] = wistia.className?.match(/\bwistia\_async\_(\S+)\b/i);
      if (hashedId?.length) {
        p.push(new Promise((resolve, reject)=> {
          fetch(`https://fast.wistia.net/oembed?url=http://home.wistia.com/medias/${hashedId}?embedType=async_popover&videoWidth=${innerWidth}&videoHeight=${innerHeight}`)
            .then(a=> a.json())
            .then(a=> resolve({ 
              wistia, hashedId, 
              thumbnail: a.thumbnail_url,
            }))
            .catch(e=> reject(e));
        }));
      }
    });

    return Promise
      .all(p)
      .then(result=> {
        if (result?.length) {
          result.forEach(item=> {
            try {
              if (item.wistia?.parentElement) {
                item.wistia.style.background = `transparent url(${item.thumbnail}) no-repeat center center/cover`;
              }
            } catch(e) {logg('wistia show thumbnail caught ', e)}
          });
        }
      })
      .catch(e=> logg('promise all caught ', e));
  }

  function responsiveWistia() {

    let portraitWistia = listify('.portrait');
    let landscapeWistia = listify('.landscape');

    if (whichWistiaRatio() === 'portrait') {
      landscapeWistia.forEach(r=> r.dataset.hidden = true);
      portraitWistia.forEach(r=> r.dataset.hidden = false);
    } else {
      landscapeWistia.forEach(r=> r.dataset.hidden = false);
      portraitWistia.forEach(r=> r.dataset.hidden = true);
    }
  }

  function toggleCollectionTools() {

    let tools = query('.collection-tools');
    let open = query('.filter-open');
    let close = query('.filter-close');
    let whenClose = ()=> {
      tools.classList.remove('open');
      document.body.classList.remove('collection-tools-open');
    }
    let whenOpen = ()=> {
      tools.classList.add('open');
      document.body?.classList.add('collection-tools-open');
    }
    
    if (open) open.addEventListener('click', e=> {
      e.stopPropagation();
      whenOpen();
      ___onWindowScroll();
    });

    if (close) close.addEventListener('click', e=> {
      e.stopPropagation();
      whenClose();
    });

    // auto-close
    document.addEventListener('click', e=> {
      if (!elementBelongsTo(tools, e.target)) whenClose();
    });
  }

  function processFilterTitleCase() {

    let codes = listify('[data-filter-code]');
    if (codes?.length) codes.forEach(code=> {
      const btn = query('button', code);
      btn.innerHTML = titleCase(btn.innerHTML);
      code.classList.add('loaded');
    });
  }

  function updateVars() {
    
    let stylesheet = query('style.root');
    if (stylesheet) window.addEventListener('vars-update', e=> {
      let local = vars = { ...vars, ...e.detail };
      let cssVars = Object.assign({}, local);

      Object.keys(cssVars).forEach(key=> {
        cssVars['--' + hyphenate(key)] = cssVars[key];
        Reflect.deleteProperty(cssVars, key);
      });

      stylesheet.innerText = `:root{${ Object.entries(cssVars).map(([key, value])=> `${key}: ${value}`).join(';')}}`;
    });
  }

  function setCurrentFilters() {
  
    const excludedFilters = listify('nav a[href]').map(a=> a.innerHTML.replace(/\s+|\r+|\n+|\t+/g, '').trim().toLowerCase());
    const filterOpen = query('.filter-open');
    const filters = urlFilters().filter(a=> excludedFilters.indexOf(a) === -1);

    if (filters?.length) filters.forEach(code=> {
        try {
          query(`[data-filter-code="${code}"]`)?.classList.add('active');
        } catch(e) { logg('setCurrentFilters caught ', e) }
      });

    if (!filterOpen) return;

    if (filters?.length) {
      filterOpen.dataset.count = filters.length
    } else {
      filterOpen.removeAttribute('data-count'); 
    }
  }
  
  function filterOnClick() {
  
    let generateUrlWithTags = tags=> currentCollection.url + '/' + tags.join('+');
    let codes = listify('[data-filter-code]');

    if (codes?.length) codes.forEach(code=> {

      const { filterCode } = code.dataset;
      const btn = query('button', code);
  
      if (btn) btn.addEventListener('click', e=> {

        e.preventDefault();

        let tags = urlFilters().slice();
        let codeIndex = tags.findIndex(a=> a === filterCode);
        
        if (codeIndex > -1) {
          tags.splice(codeIndex, 1);

        } else {
          tags.push(filterCode);
        }
        
        tags = tags.filter(a=> {
          a = a?.toLowerCase();
          return !a.match(/\bsearch\b/);
        });

        return location.href = generateUrlWithTags(tags);
      });
    });
  }

  function stickyHeader() {

    let rootNav = query('.root_navigation');
    let rootNavHeight = rootNav.clientHeight;
    let lastPageYOffset = null;
    let lastScrollTop = window.pageYOffset??document.documentElement.scrollTop;
    let limit = window.innerWidth < 576 ? 40:rootNavHeight;
    let lastDirection;
    let topUp = -limit;
    let topDown = 0; //parseInt(getComputedStyle(rootNav).top);
    let header = query('.section-header');
    let dynamic = listify('[dynamic]');
    let dynamictops = dynamic.map(d=> parseInt(getComputedStyle(d).top));
    let updateLimit = ()=> limit = window.innerWidth < 576 ? 40:rootNav.clientHeight;

    dynamic.forEach(el=> {
      el.dataset.top = parseInt(getComputedStyle(el).top)??0;
    });
    
    onWindowScroll = window.___onWindowScroll = ()=> {
  
      let { pageYOffset } = window;
      let windowY = pageYOffset??document.documentElement.scrollTop;
      let down = windowY > lastScrollTop;

      // logic if no scroll, apply the last recorded scrolling direction
      if (windowY === lastScrollTop) down = lastDirection === 'down';
      lastDirection = down ? 'down':'up';
      
      // bootstrap
      if (lastPageYOffset===null) lastPageYOffset = pageYOffset;
      if (document?.body?.classList) document.body.dataset.scrollDirection = down ? 'down':'up';

      tl.invalidate();
      tl.restart();
    
      // direction logic
      if (!down) {
        tl.play();
      } else {
        
        tl.pause(0);
        
        topDown = topDown - (pageYOffset - lastPageYOffset);
        topDown = cap(topDown, -limit, 0);
  
        lastPageYOffset = pageYOffset;
  
        // down
        header.style.top = `${topDown}px`;
        dynamic.forEach((dynamic, idx)=> {
          dynamic.style.top = dynamictops[idx] + rootNavHeight + nestNavigationHeight + topDown + 'px';
        });
      }
  
      lastScrollTop = window.pageYOffset??document.documentElement.scrollTop;
    }
    
    window.addEventListener('resize', updateLimit.bind(null));
    window.addEventListener('scroll', ___onWindowScroll, false);

    // mobile check
    // if (window.mobile) return;
    topUp = parseInt(getComputedStyle(header).top);

    tl
      .add(
        gsap.to([header, ...dynamic], { 
          duration: .4,
          top: (_, t)=> t.hasAttribute('dynamic') ? parseInt(t.dataset.top) + nestNavigationHeight + rootNavHeight:0,
        }, 0)
      )
  }

  function sizeGuideToggle() {

    let container = query('.product-size-variants');
    let open = query('.size-guide-open');
    let close = query('.size-guide-close')

    if (open) open.addEventListener('click', ()=> container.classList.add('open'));
    if (close) close.addEventListener('click', ()=> container.classList.remove('open'));
  }

  function tabContentToggle() {

    let tabs = listify('.content-tab-btn[data-rel]');
    let tabContents = listify('[data-content-rel]');

    if (tabs?.length) tabs.forEach(tab=> {
      tab.addEventListener('click', ()=> {

        let {rel} = tab.dataset;
        tabs.forEach(t=> t.classList.remove('active'));
        tabContents.forEach(c=> c.classList.remove('open'));

        tab.classList.add('active');
        let content = query(`[data-content-rel="${rel}"]`);

        if (content) content.classList.add('open');

      });
    });
  }

  function productSizeToggle() {

    let sizes = listify('.product-size');

    if (sizes?.length) sizes.forEach(size=> {
      size.addEventListener('click', ()=> {
        
        size.classList.toggle('active');
        sizes.forEach(a=> (a !== size) && a.classList.remove('active'));
      });
    });
  }

  function hasStickyPolifyfill() {

    let rowsWithSticky = listify('[class*=container]>.row>.row').filter(a=> query('.sticky-title', a));

    if (rowsWithSticky?.length) {
      rowsWithSticky.forEach(a=> {
        a.classList.add('has-sticky');
        a.setAttribute('dynamic', '');
      });
    }
  }
  
  // function productCareWidth() {
    
  //   try {
  //     let getWidth = ()=> {
  //       let width = query('.grid-element')?.clientWidth??0;
  //       dispatchCustomEvent('vars-update', { 
  //         productCarePMaxWidth: Math.floor(width + width/3) + 'px' ,
  //       });
  //     }

  //     return window.addEventListener('resize', getWidth);
  //   } catch(e) {
  //     logg('product care width caught ', e);
  //   }
  // }

  function gridCol() {
    
    try {
      let getWidth = ()=> {
        let width = query('.f-calc > div')?.clientWidth??0;
        dispatchCustomEvent('vars-update', { 
          gridUnitWidth: width + 'px' ,
        });
      }
      window.addEventListener('resize', getWidth);
      return getWidth();
    } catch(e) {
      logg('grid unit width caught ', e);
    }
  }

  function defineHeaderHeight() {

    let header = query('.root_navigation');
    let update = ()=> dispatchCustomEvent('vars-update', { 
      rootNavigationHeight: header.clientHeight + 'px' ,
    });
    window.addEventListener('resize', update);
    update();
  }

  document.addEventListener('DOMContentLoaded', ()=> {

      mainnav();

      newsletterToggle();
    
      switchIframeToWistiaEmbed();
    
      bootstrapWistiaEmbedAPI();

      wistiaShowThumbnail();

      toggleCollectionTools();

      processFilterTitleCase();
      
      setCurrentFilters();

      filterOnClick();

      sizeGuideToggle();

      tabContentToggle();

      productSizeToggle();

      // css :has selector not working on firefox
      hasStickyPolifyfill();

      updateVars();

      // deprecated
      // productCareWidth();

      gridCol();

      defineHeaderHeight();

      // scrollTo = document.documentElement.scrollTop;


      document.addEventListener('keyup', e=> {
        if (e.key === 'Escape') onEscape();
      });
      
  });

  window.addEventListener('load', ()=> {
    stickyHeader();
  })

  window.addEventListener('resize', debounce(responsiveWistia.bind(undefined), 100, true));

})();