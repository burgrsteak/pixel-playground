/* page-product.js — renders product detail page */
document.addEventListener('DOMContentLoaded', function () {
  if (SPX_BOOT.halted) return;
  var root = document.getElementById('spx-product-root');
  if (!root) return;
  var item = SPX_BOOT.catalog.filter(function(p){ return p.sku === SPX_BOOT.sku; })[0];
  if (!item) return;
  root.innerHTML = '<div class="product-detail">'
    + '<div class="product-img">&#128248;</div>'
    + '<div class="product-info">'
    + '<div class="card-cat">' + item.cat + ' &mdash; ' + item.brand + '</div>'
    + '<div class="product-name">' + item.name + '</div>'
    + '<div class="product-price">$' + item.price.toFixed(2) + '</div>'
    + '<div class="card-actions">'
    + '<a class="btn primary" href="cart.html?action=add&sku=' + item.sku + '">Add to cart</a>'
    + '<a class="btn" href="collection.html">&larr; Back</a>'
    + '</div></div></div>';
});
