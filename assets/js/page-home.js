/* page-home.js — renders featured products grid */
document.addEventListener('DOMContentLoaded', function () {
  if (SPX_BOOT.halted) return;
  var grid = document.getElementById('spx-home-grid');
  if (!grid) return;
  var featured = SPX_BOOT.catalog.slice(0, 3);
  grid.innerHTML = featured.map(function (p) {
    return '<div class="card">'
      + '<span class="card-cat">' + p.cat + '</span>'
      + '<div class="card-name">' + p.name + '</div>'
      + '<div class="card-price">$' + p.price.toFixed(2) + '</div>'
      + '<div class="card-actions">'
      + '<a class="btn" href="product.html?sku=' + p.sku + '">View</a>'
      + '<a class="btn primary" href="cart.html?action=add&sku=' + p.sku + '">Add to cart</a>'
      + '</div></div>';
  }).join('');
});
