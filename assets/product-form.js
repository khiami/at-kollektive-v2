if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      this.submitButton = this.querySelector('[type="submit"]');
      if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

      this.handleErrorMessage();

      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.classList.add('loading');
      this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      
      if (this.submitButton && this.submitButton.classList.contains('is-remove')) {
        
        let { productIndex, } = this.submitButton.dataset||{};
    
        return fetch(routes.cart_change_url, { 
            ...fetchConfig(), 
            body: JSON.stringify({
              line: parseInt(productIndex)||1,
              quantity: 0,
            })
          })
          .then(a => a.text())
          .then((res) => {

            try {

              let { items, status } = JSON.parse(res);
              let buttonSpan = this.submitButton.querySelector('.product-form-btn-span');
              const cartItemCounters = listify('cart-items-counter');

              if (status) {
                this.handleErrorMessage(res.description);
    
                const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
                if (!soldOutMessage) return;
                this.submitButton.setAttribute('aria-disabled', true);
                this.submitButton.querySelector('span').classList.add('hidden');
                soldOutMessage.classList.remove('hidden');
                this.error = true;

                if (buttonSpan) buttonSpan.innerHTML = 'Sold out';
                return;

              }  else {                
                if (buttonSpan) buttonSpan.innerHTML = 'Add to Shopping bag';
              }

              // update 'cart-toggle' btn text
              dispatchCustomEvent('update-product-form', items);
              

              if (cartItemCounters.length) cartItemCounters.forEach(c=> dispatchCustomEvent('cart-updated-with-count', items.length, c));
              
              
            } catch(e) {
              logg('remove from item caught ', e);
            }
            this.submitButton.classList.remove('is-remove');

          })
          
        .catch((e) => logg(e))
        .finally(this.onFinally.bind(this));
        
      }

      const formData = new FormData(this.form);
      if (this.cart) {
        formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
        formData.append('sections_url', window.location.pathname);
        this.cart.setActiveElement(document.activeElement);
      }
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {

          const cartItemCounters = listify('cart-items-counter');

          if (response.status) {
            this.handleErrorMessage(response.description);

            const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
            if (!soldOutMessage) return;
            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButton.querySelector('span').classList.add('hidden');
            soldOutMessage.classList.remove('hidden');
            this.error = true;
            return;
          } 

          // dispatch a custom event
          if (cartItemCounters.length) cartItemCounters.forEach(c=> dispatchCustomEvent('cart-updated', this, c));
          
        })
        .catch((e) => logg(e))
        .finally(this.onFinally.bind(this));
    }

    onFinally() {

      this.submitButton.classList.remove('loading');
      if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
      if (!this.error) this.submitButton.removeAttribute('aria-disabled');
      this.querySelector('.loading-overlay__spinner').classList.add('hidden');

    }

    handleErrorMessage(errorMessage = false) {
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      if (!this.errorMessageWrapper) return;
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}
