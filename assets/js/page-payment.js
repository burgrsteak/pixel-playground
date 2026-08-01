/* page-payment.js — renders payment form */
document.addEventListener('DOMContentLoaded', function () {
  if (SPX_BOOT.halted) return;
  var root = document.getElementById('spx-payment-root');
  if (!root) return;
  if (!SPX_BOOT.cart.length) {
    root.innerHTML = '<p>Your cart is empty. <a href="collection.html">Continue shopping</a></p>'; return;
  }
  root.innerHTML = '<h1 class="ph">Payment</h1>'
    + '<div class="form-section">'
    + '<div class="form-group"><label>Card number</label><input type="text" placeholder="4242 4242 4242 4242"></div>'
    + '<div class="form-group"><label>Expiry</label><input type="text" placeholder="MM / YY"></div>'
    + '<div class="form-group"><label>CVC</label><input type="text" placeholder="123"></div>'
    + '<a class="btn primary" href="thankyou.html?action=order">Place order &mdash; $' + SPX_BOOT.cartTotal.toFixed(2) + '</a>'
    + '</div>';
});
