/* Snap Pixel Playground — page shell: header, console, terms gate */

var SPX_NAV_HTML = [
  '<header class="shop-head">',
  '  <a class="logo" href="index.html">NORTHBOUND<span>SUPPLY</span></a>',
  '  <nav class="shop-nav">',
  '    <a href="index.html">Home</a>',
  '    <a href="collection.html">Shop All</a>',
  '    <a href="signup.html">Account</a>',
  '  </nav>',
  '  <span class="who" id="spx-who"></span>',
  '  <a class="cart-link" href="cart.html">',
  '    Cart <span class="cart-badge" id="spx-cart-n"></span>',
  '  </a>',
  '</header>'
].join('\n');

var SPXShell = (function () {
  function mount() {
    var head = document.createElement('div');
    head.innerHTML = SPX_NAV_HTML;
    document.body.insertBefore(head.firstElementChild, document.body.firstChild);
    document.getElementById('spx-cart-n').textContent = SPX_BOOT.cartCount;
    document.getElementById('spx-who').textContent =
      SPX_BOOT.account ? 'Signed in \u00b7 ' + SPX_BOOT.account.id : '';
    var host = document.createElement('div');
    host.innerHTML = SPX_CONSOLE_HTML + SPX_TERMS_HTML;
    while (host.firstChild) document.body.appendChild(host.firstChild);
  }

  return {
    start: function () {
      if (SPX_BOOT.halted) return;
      mount();
      SPXConsole.init();
      SPXTerms.gate(function () { SPXPixel.start(); });
    }
  };
})();

document.addEventListener('DOMContentLoaded', function () { SPXShell.start(); });
