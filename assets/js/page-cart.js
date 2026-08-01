/* page-cart.js — renders cart */
document.addEventListener('DOMContentLoaded', function () {
  if (SPX_BOOT.halted) return;
  var root = document.getElementById('spx-cart-root');
  if (!root) return;
  if (SPX_BOOT.replayWarning) {
    root.innerHTML += '<p style="color:#f0c040;background:#2a2000;padding:.5rem .75rem;border-radius:6px;margin-bottom:1rem;font-size:.85rem">&#9888; Refreshing this page will fire ADD_CART again. Navigate away and back to avoid duplicates.</p>';
  }
  if (!SPX_BOOT.cart.length) {
    root.innerHTML += '<p>Your cart is empty. <a href="collection.html">Shop all products</a></p>';
    return;
  }
  var rows = SPX_BOOT.cart.map(function(i){
    return '<tr><td>' + i.name + '</td><td>' + i.qty + '</td><td>$' + i.price.toFixed(2) + '</td>'
      + '<td><a href="cart.html?action=remove&sku=' + i.sku + '" class="btn" style="font-size:.78rem;padding:.2rem .6rem">Remove</a></td></tr>';
  }).join('');
  root.innerHTML += '<table class="cart-table"><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>'
    + '<div class="cart-total">Total: $' + SPX_BOOT.cartTotal.toFixed(2) + '</div>'
    + '<div class="cart-actions">'
    + '<a class="btn primary" href="checkout.html">Checkout</a>'
    + '<a class="btn" href="cart.html?action=clear">Clear cart</a>'
    + '</div>';
});
