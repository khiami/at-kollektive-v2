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

  document.addEventListener('DOMContentLoaded', ()=> {

      mainnav();
      
  });

})();