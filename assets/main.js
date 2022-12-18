(()=> {

  function mainnav() {

    const header = query('header');
    const injectableNav = query('.nav.n-level');
    const itemsWithSubmenu = listify('header .list-menu__item');

    function closeNavigation() {

      itemsWithSubmenu.forEach(a=> {
        a.parentElement?.classList.remove('open');
        a.setAttribute('aria-expanded', false);
      });
      injectableNav.innerHTML = '';

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
          injectableNav.innerHTML = null;
        } else {
          parent.classList.add('open');
          if (menu) injectableNav.innerHTML = menu.outerHTML;
        }

        // set aria-expanded
        item.setAttribute('aria-expanded', parent.classList.contains('open'));
      });
    });

    // auto-collapse header if clicked outside
    document.addEventListener('click', e=> {
      if (!elementBelongsTo(header, e.target)) closeNavigation();
    });

    // auto-collapse on [escape] clicked
    document.addEventListener('keyup', e=> {
      if (e.key === 'Escape') closeNavigation();
    });
  }

  function newsletterState() {

    let footer = query('footer');
    let label = query('.footer-block--newsletter label');
    let newsletterWrap = query('.footer-block--newsletter');

    if (label) label.addEventListener('click', ()=> {
      footer.classList.toggle('open');
    });

    document.addEventListener('click', e=> {
      if (!elementBelongsTo(newsletterWrap, e.target)) footer.classList.remove('open');
    });

  }

  function onEscape() {

    let elements = [
      'footer',
      '.collection-tools',
    ];

    elements = elements.map(a=> query(a)).filter(a=> !!a);
    if (elements?.length) elements.forEach(a=> {
      a.classList?.remove('open');
    });
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

    if (open) open.addEventListener('click', ()=> tools.classList.add('open'));
    if (close) close.addEventListener('click', ()=> tools.classList.remove('open'));
  }

  function processFilterTitleCase() {

    let codes = listify('[data-filter-code]');
    if (codes?.length) codes.forEach(code=> {
      const btn = query('button', code);
      btn.innerHTML = titleCase(btn.innerHTML);
      code.classList.add('loaded');
    });
  }


  function setCurrentFilters() {
  
    const filterOpen = query('.filter-open');
    const filters = urlFilters();

    if (filters?.length) filters.forEach(code=> {
        try {
          query(`[data-filter-code=${code}]`)?.classList.add('active');
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

  scrollTop = window.pageYOffset??document.documentElement.scrollTop;

  function stickyHeader() {

    let header = query('header');
    let rootNavigation = query('.root_navigation');
    let rootNavHeight = rootNavigation.clientHeight;
    let paddingTop = 0;

    window.addEventListener('scroll', ()=> {

      let down = (window.pageYOffset??document.documentElement.scrollTop) > scrollTop;
      
      if (!down) {
        
        // up
        // logg('scrolling up');
        // header.style.paddingTop = `${cap(0, paddingTop++, rootNavHeight)}px`;
        // header.style.marginTop = `-${cap(0, paddingTop++, rootNavHeight)}px`;
      } else {
        
        // down        
        // logg('scrolling down');
        // header.style.paddingTop = '0px'; //`${cap(0, paddingTop--)}px`;
      }

      scrollTop = window.pageYOffset??document.documentElement.scrollTop;

    }, false);


  }

  document.addEventListener('DOMContentLoaded', ()=> {

      mainnav();

      newsletterState();
    
      switchIframeToWistiaEmbed();
    
      bootstrapWistiaEmbedAPI();

      wistiaShowThumbnail();

      toggleCollectionTools();

      processFilterTitleCase();

      setCurrentFilters();

      filterOnClick();

      stickyHeader();

      scrollTo = document.documentElement.scrollTop;


      document.addEventListener('keyup', e=> {
        if (e.key === 'Escape') onEscape();
      });
      
  });

  window.addEventListener('resize', debounce(responsiveWistia.bind(undefined), 100, true));

})();