/* page-thankyou.js — renders order confirmation */
document.addEventListener('DOMContentLoaded', function () {
  if (SPX_BOOT.halted) return;
  var root = document.getElementById('spx-thankyou-root');
  if (!root) return;
  var order = SPX_BOOT.lastOrder;
  if (!order) {
    root.innerHTML = '<p>No order found. <a href="collection.html">Continue shopping</a></p>'; return;
  }
  var items = order.items.map(function(i){
    return '<li>' + i.name + ' &times; ' + i.qty + ' — $' + (i.price * i.qty).toFixed(2) + '</li>';
  }).join('');
  root.innerHTML = '<div class="thankyou-box">'
    + '<h1>&#127881; Order confirmed!</h1>'
    + '<p>Order ID: <strong>' + order.id + '</strong></p>'
    + '<ul class="order-items">' + items + '</ul>'
    + '<p style="font-weight:700;margin-top:.75rem">Total: $' + order.total.toFixed(2) + '</p>'
    + '<br><a class="btn primary" href="index.html">Continue shopping</a>'
    + '</div>';
});
