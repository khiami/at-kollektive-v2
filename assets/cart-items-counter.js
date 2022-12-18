(function defineCartItemCounterCustomElement () {

  let btnText = 'Cart';
  class CartItemsCounter extends HTMLElement {

    elementsWithUpdatedCounter = listify('[data-cart-counter]');

    constructor() {
      super();
  
      this.addEventListener('click', this.onClick.bind(this));
      this.addEventListener('cart-updated', this.onCartUpdate.bind(this));
      this.addEventListener('cart-updated-with-count', this.onCartUpdateWithCount.bind(this));

      this.innerHTML = btnText;
    }

    connectedCallback() {
      this.onCartUpdate(null);
    }

    async onCartUpdate(e) {
      try {
      
        // let payload = e?.detail;
        let request = await fetch('/cart.js');
        let { items } = (await request.json())||{};

        // update 'cart-toggle' btn text
        dispatchCustomEvent('update-product-form', items);

        this.onCartUpdateWithCount({ detail: items.length });

      } catch(e) {
        logg('Cart Items Counter caught ', e);
        this.innerHTML = btnText;
      }
    }

    onCartUpdateWithCount(res) {
      if (this.elementsWithUpdatedCounter?.length) {
        this.elementsWithUpdatedCounter.forEach(a=> {
          try {
            if (!res.detail || res.detail <= 0) {
              a.removeAttribute('data-cart-counter');
            } else {
              a.dataset.cartCounter = res.detail??null;
            }
          } catch(e) {logg('onCartUpdateWithCount caught ', e)}
        });
      }

      if (res.detail > 0) {
        this.innerHTML = `(${res.detail}) ${btnText}`; 

      } else {
        this.innerHTML = btnText;
      }
    }

    onClick(e) {
      location.href = '/cart';
    }
  }
  
  if (!customElements.get('cart-items-counter')) {
    return customElements.define('cart-items-counter', CartItemsCounter);
  };
})();