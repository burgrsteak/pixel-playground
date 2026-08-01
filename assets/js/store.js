/* Snap Pixel Playground — storefront state, routing and event planning.
   Replaces server code (Code.gs). Synchronous, runs in <head>.
   SPX_BOOT is available before any pixel code executes. */

var SPX_PAGES = ['home','collection','product','signup','cart','checkout','payment','thankyou'];

function SPX_file(page) {
  return page === 'home' ? 'index.html' : page + '.html';
}

var SPX_CATALOG = [
  { sku:'NB-1001', name:'Merino Runner',      price:128.00, cat:'Footwear',    brand:'Northbound' },
  { sku:'NB-1002', name:'Trail Shell Jacket', price:245.00, cat:'Outerwear',   brand:'Northbound' },
  { sku:'NB-1003', name:'Canvas Weekender',   price:98.50,  cat:'Bags',        brand:'Northbound' },
  { sku:'NB-1004', name:'Alpine Beanie',      price:34.00,  cat:'Accessories', brand:'Northbound' },
  { sku:'NB-1005', name:'Field Chino',        price:76.00,  cat:'Apparel',     brand:'Northbound' },
  { sku:'NB-1006', name:'Summit Down Vest',   price:189.00, cat:'Outerwear',   brand:'Northbound' }
];

var SPX_DEFAULTS = {
  pixelId: '', mode: 'manual', gtmId: '', dataLayerName: 'dataLayer',
  currency: 'USD', virtualUrl: false, hashedEmail: '', hashedPhone: '',
  externalId: '', autoFire: true, clientDedup: false
};

function SPX_findSku(sku) {
  for (var i = 0; i < SPX_CATALOG.length; i++) {
    if (SPX_CATALOG[i].sku === sku) return SPX_CATALOG[i];
  }
  return null;
}

function SPX_params() {
  var out = {}, q = window.location.search.replace(/^\?/, '');
  if (!q) return out;
  var parts = q.split('&');
  for (var i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    var kv = parts[i].split('=');
    var k = decodeURIComponent(kv[0].replace(/\+/g, ' '));
    var v = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
    out[k] = v;
  }
  return out;
}

var SPX_KEY = 'spx_session_v1';

function SPX_load() {
  var s = null;
  try {
    var raw = window.localStorage.getItem(SPX_KEY);
    if (raw) s = JSON.parse(raw);
  } catch (err) { s = null; }
  if (!s || typeof s !== 'object') s = {};
  if (!s.config || typeof s.config !== 'object') s.config = {};
  for (var k in SPX_DEFAULTS) {
    if (!Object.prototype.hasOwnProperty.call(s.config, k)) s.config[k] = SPX_DEFAULTS[k];
  }
  if (!Array.isArray(s.cart))    s.cart = [];
  if (!Array.isArray(s.history)) s.history = [];
  if (!s.orderId) s.orderId = '';
  if (s.account === undefined) s.account = null;
  if (typeof s.termsAckDate !== 'string') s.termsAckDate = '';
  return s;
}

function SPX_save(s) {
  if (s.history.length > 200) s.history = s.history.slice(-200);
  try {
    window.localStorage.setItem(SPX_KEY, JSON.stringify(s));
  } catch (err) {
    console.warn('[SPX] could not persist session', err);
  }
}

function SPX_todayKey() {
  var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
}

function SPX_cartTotal(cart) {
  var t = 0;
  for (var i = 0; i < cart.length; i++) t += cart[i].price * cart[i].qty;
  return Math.round(t * 100) / 100;
}

function SPX_cartCount(cart) {
  var n = 0;
  for (var i = 0; i < cart.length; i++) n += cart[i].qty;
  return n;
}

function SPX_applyAction(s, p) {
  var action = p.action || '';
  if (!action) return { redirect: false };

  if (action === 'saveconfig') {
    var c = s.config;
    if (p.pixelId !== undefined)       c.pixelId       = String(p.pixelId).trim();
    if (p.gtmId !== undefined)         c.gtmId         = String(p.gtmId).trim().toUpperCase();
    if (p.currency !== undefined)      c.currency      = String(p.currency).trim().toUpperCase() || 'USD';
    if (p.hashedEmail !== undefined)   c.hashedEmail   = String(p.hashedEmail).trim();
    if (p.hashedPhone !== undefined)   c.hashedPhone   = String(p.hashedPhone).trim();
    if (p.externalId !== undefined)    c.externalId    = String(p.externalId).trim();
    if (p.dataLayerName !== undefined) c.dataLayerName = String(p.dataLayerName).trim() || 'dataLayer';
    if (p.mode !== undefined) {
      var m = String(p.mode);
      c.mode = (m === 'gtm' || m === 'both') ? m : 'manual';
    }
    c.virtualUrl  = (p.virtualUrl  === 'on' || p.virtualUrl  === 'true');
    c.autoFire    = (p.autoFire    === 'on' || p.autoFire    === 'true');
    c.clientDedup = (p.clientDedup === 'on' || p.clientDedup === 'true');
    return { redirect: true, page: p.page || 'home', sku: p.sku || '', open: p.open || 'setup' };
  }

  if (action === 'add') {
    var item = SPX_findSku(p.sku || '');
    if (item) {
      var qty = parseInt(p.qty, 10);
      if (!(qty > 0)) qty = 1;
      var found = false;
      for (var i = 0; i < s.cart.length; i++) {
        if (s.cart[i].sku === item.sku) { s.cart[i].qty += qty; found = true; break; }
      }
      if (!found) {
        s.cart.push({ sku:item.sku, name:item.name, price:item.price,
                      cat:item.cat, brand:item.brand, qty:qty });
      }
      return { redirect: true, page: 'cart', added: item.sku, addedQty: qty };
    }
    return { redirect: true, page: 'cart' };
  }

  if (action === 'remove') {
    var out = [];
    for (var j = 0; j < s.cart.length; j++) {
      if (s.cart[j].sku !== p.sku) out.push(s.cart[j]);
    }
    s.cart = out;
    return { redirect: true, page: 'cart' };
  }

  if (action === 'signup') {
    s.account = {
      method: String(p.method || 'email'),
      hashedEmail: String(p.suEmail || '').trim(),
      hashedPhone: String(p.suPhone || '').trim(),
      id: 'USR-' + Math.floor(Math.random() * 900000 + 100000)
    };
    if (s.account.hashedEmail) s.config.hashedEmail = s.account.hashedEmail;
    if (s.account.hashedPhone) s.config.hashedPhone = s.account.hashedPhone;
    s.config.externalId = s.account.id;
    return { redirect: true, page: 'signup', created: '1' };
  }

  if (action === 'signout') { s.account = null; return { redirect: true, page: 'signup' }; }
  if (action === 'clear')   { s.cart = [];      return { redirect: true, page: 'cart' }; }

  if (action === 'reset') {
    s.cart = []; s.history = []; s.orderId = ''; s.account = null; s.lastOrder = null;
    return { redirect: true, page: 'home' };
  }

  if (action === 'order') {
    s.orderId = 'SPX-' + Math.floor(Math.random() * 900000 + 100000);
    s.lastOrder = { items: s.cart.slice(), total: SPX_cartTotal(s.cart), id: s.orderId };
    s.cart = [];
    return { redirect: true, page: 'thankyou' };
  }

  return { redirect: false };
}

function SPX_itemParams(item, cfg) {
  return {
    item_ids: [item.sku], item_category: item.cat, brands: [item.brand],
    price: item.price, currency: cfg.currency, description: item.name
  };
}

function SPX_planEvents(page, s, p) {
  var cfg = s.config, plan = [], i;
  plan.push({ event:'PAGE_VIEW', params:{} });

  if (page === 'collection') {
    var ids = [];
    for (i = 0; i < SPX_CATALOG.length; i++) ids.push(SPX_CATALOG[i].sku);
    plan.push({ event:'LIST_VIEW', params:{ item_ids: ids, item_category:'All', number_items: ids.length } });
  }
  if (page === 'product') {
    var item = SPX_findSku(p.sku || '');
    if (item) plan.push({ event:'VIEW_CONTENT', params: SPX_itemParams(item, cfg) });
  }
  if (page === 'signup' && p.created && s.account) {
    plan.push({ event:'SIGN_UP', params:{ sign_up_method: s.account.method, success: 1 } });
  }
  if (page === 'cart' && p.added) {
    var added = SPX_findSku(p.added);
    if (added) {
      var q = parseInt(p.addedQty, 10); if (!(q > 0)) q = 1;
      var ap = SPX_itemParams(added, cfg);
      ap.number_items = q;
      ap.price = Math.round(added.price * q * 100) / 100;
      plan.push({ event:'ADD_CART', params: ap });
    }
  }
  if (page === 'checkout') {
    var cids = [];
    for (i = 0; i < s.cart.length; i++) cids.push(s.cart[i].sku);
    plan.push({ event:'START_CHECKOUT', params:{
      item_ids: cids, price: SPX_cartTotal(s.cart), currency: cfg.currency,
      number_items: SPX_cartCount(s.cart)
    }});
  }
  if (page === 'payment') {
    var pids = [];
    for (i = 0; i < s.cart.length; i++) pids.push(s.cart[i].sku);
    plan.push({ event:'ADD_BILLING', params:{
      item_ids: pids, price: SPX_cartTotal(s.cart), currency: cfg.currency,
      number_items: SPX_cartCount(s.cart)
    }});
  }
  if (page === 'thankyou' && s.lastOrder) {
    var oids = [], n = 0;
    for (i = 0; i < s.lastOrder.items.length; i++) {
      oids.push(s.lastOrder.items[i].sku);
      n += s.lastOrder.items[i].qty;
    }
    plan.push({ event:'PURCHASE', params:{
      item_ids: oids, price: s.lastOrder.total, currency: cfg.currency,
      number_items: n, transaction_id: s.lastOrder.id
    }});
  }
  return plan;
}

function SPX_virtualPath(page, p) {
  if (page === 'home')       return '/';
  if (page === 'collection') return '/collections/all';
  if (page === 'product')    return '/products/' + String(p.sku || 'item').toLowerCase();
  if (page === 'signup')     return p.created ? '/account/welcome' : '/account/register';
  if (page === 'cart')       return '/cart';
  if (page === 'checkout')   return '/checkout';
  if (page === 'payment')    return '/checkout/payment';
  if (page === 'thankyou')   return '/checkout/thank-you';
  return '/';
}

function SPX_url(page, extra) {
  var u = SPX_file(page), first = true;
  if (extra) {
    for (var k in extra) {
      if (extra[k] !== undefined && extra[k] !== '' && extra[k] !== null) {
        u += (first ? '?' : '&') + encodeURIComponent(k) + '=' + encodeURIComponent(extra[k]);
        first = false;
      }
    }
  }
  return u;
}

function SPX_nav(page, extra) { window.location.href = SPX_url(page, extra); }

var SPX_BOOT = (function () {
  var p = SPX_params();
  var s = SPX_load();
  var page = (document.documentElement.getAttribute('data-page') || 'home');
  if (SPX_PAGES.indexOf(page) === -1) page = 'home';

  var act = SPX_applyAction(s, p);
  var HALTED = { halted:true, page:page, config:s.config, plan:[], cart:[], catalog:SPX_CATALOG,
                 history:[], cartCount:0, cartTotal:0, sku:'', account:null,
                 lastOrder:null, virtualPath:'/', openTab:'', replayWarning:false,
                 showTerms:false, today:SPX_todayKey() };
  if (act.redirect) {
    SPX_save(s);
    window.location.replace(SPX_url(act.page, {
      sku:act.sku, added:act.added, addedQty:act.addedQty, created:act.created, open:act.open
    }));
    return HALTED;
  }

  if (page === 'product' && !SPX_findSku(p.sku || '')) {
    window.location.replace(SPX_url('collection'));
    return HALTED;
  }

  var plan = SPX_planEvents(page, s, p);
  s.history.push({ t: new Date().getTime(), page: page, events: plan.map(function(x){ return x.event; }) });
  SPX_save(s);

  return {
    halted: false, page: page, sku: p.sku || '', config: s.config, plan: plan,
    cart: s.cart, cartCount: SPX_cartCount(s.cart), cartTotal: SPX_cartTotal(s.cart),
    catalog: SPX_CATALOG, history: s.history, lastOrder: s.lastOrder || null,
    account: s.account || null, virtualPath: SPX_virtualPath(page, p),
    openTab: p.open || '', replayWarning: !!p.added,
    showTerms: s.termsAckDate !== SPX_todayKey(), today: SPX_todayKey()
  };
})();

function SPX_ackTermsToday() {
  var s = SPX_load(); s.termsAckDate = SPX_todayKey(); SPX_save(s); return s.termsAckDate;
}
function SPX_resetTermsAck() {
  var s = SPX_load(); s.termsAckDate = ''; SPX_save(s); return true;
}
