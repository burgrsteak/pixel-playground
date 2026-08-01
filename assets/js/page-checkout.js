/* page-checkout.js — renders checkout/shipping form */
document.addEventListener('DOMContentLoaded', function () {
  if (SPX_BOOT.halted) return;
  var root = document.getElementById('spx-checkout-root');
  if (!root) return;
  if (!SPX_BOOT.cart.length) {
    root.innerHTML = '<p>Your cart is empty. <a href="collection.html">Continue shopping</a></p>'; return;
  }
  root.innerHTML = '<h1 class="ph">Shipping</h1>'
    + '<div class="form-section">'
    + '<div class="form-group"><label>Full name</label><input type="text" placeholder="Jane Smith"></div>'
    + '<div class="form-group"><label>Address</label><input type="text" placeholder="123 Main St"></div>'
    + '<div class="form-group"><label>City</label><input type="text" placeholder="New York"></div>'
    + '<div class="form-group"><label>Postcode</label><input type="text" placeholder="10001"></div>'
    + '<a class="btn primary" href="payment.html">Continue to payment</a>'
    + '</div>';
});
