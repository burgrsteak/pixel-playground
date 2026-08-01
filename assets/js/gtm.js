/* Snap Pixel Playground — GTM container loader and dataLayer instrumentation */

var SPXGTM = (function () {
  function push(obj) {
    var dlName = SPX_BOOT.config.dataLayerName || 'dataLayer';
    window[dlName] = window[dlName] || [];
    window[dlName].push(obj);
  }

  function ga4Items(cart) {
    return cart.map(function(i){
      return { item_id: i.sku, item_name: i.name, item_category: i.cat,
               item_brand: i.brand, price: i.price, quantity: i.qty };
    });
  }

  function loadContainer(id, dlName) {
    if (!id || !/^GTM-[A-Z0-9]+$/i.test(id)) return;
    (function(w,d,s,l,i){
      w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
    })(window,document,'script',dlName,id);
  }

  function instrument() {
    var plan = SPX_BOOT.plan, cfg = SPX_BOOT.config;
    for (var i = 0; i < plan.length; i++) {
      var step = plan[i];
      var dlEvent = 'spx_' + step.event.toLowerCase();
      var payload = { event: dlEvent, snap_event: step.event };
      for (var k in step.params) payload[k] = step.params[k];
      payload.snap_params = step.params;
      if (step.event === 'PURCHASE' || step.event === 'START_CHECKOUT' || step.event === 'ADD_BILLING') {
        payload.value = step.params.price;
        payload.currency = step.params.currency;
        payload.items = ga4Items(SPX_BOOT.cart);
      }
      push(payload);
    }
  }

  return {
    start: function () {
      if (SPX_BOOT.halted) return;
      var cfg = SPX_BOOT.config;
      if (cfg.mode === 'gtm' || cfg.mode === 'both') {
        loadContainer(cfg.gtmId, cfg.dataLayerName);
        instrument();
      }
    }
  };
})();

document.addEventListener('DOMContentLoaded', function () { SPXGTM.start(); });
