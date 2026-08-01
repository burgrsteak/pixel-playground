/* Snap Pixel Playground — SDK loader, snaptr wrapper, network interceptors, validator */

var SPXPixel = (function () {
  var _interceptors = [];
  var _eventLog = [];
  var _networkLog = [];
  var _fired = 0;

  /* ---------- validator ---------- */
  function validate(event, params) {
    var warns = [], errs = [];
    var cfg = SPX_BOOT.config;
    if (!cfg.pixelId) warns.push('No Pixel ID set — events will not reach Snap');
    else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cfg.pixelId))
      errs.push('Pixel ID does not look like a UUID — check for an Ad Account ID');
    if (params && params.price !== undefined) {
      if (typeof params.price !== 'number') errs.push('price must be a number');
      else if (params.price > 0 && params.price < 1) warns.push('price < 1.00 — cents-vs-dollars bug?');
    }
    if (params && params.hashedEmail && /[@.]/.test(params.hashedEmail))
      errs.push('hashedEmail looks like a raw email address');
    return { warns: warns, errs: errs };
  }

  /* ---------- interceptor (XHR + fetch) ---------- */
  function installInterceptors() {
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      if (typeof url === 'string' && url.indexOf('snapchat.com') !== -1) {
        _networkLog.push({ ts: Date.now(), type: 'xhr', url: url });
        if (window.SPXConsole) SPXConsole.onNetwork({ type:'xhr', url: url });
      }
      return origOpen.apply(this, arguments);
    };
    if (window.fetch) {
      var origFetch = window.fetch;
      window.fetch = function (input) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        if (url.indexOf('snapchat.com') !== -1) {
          _networkLog.push({ ts: Date.now(), type: 'fetch', url: url });
          if (window.SPXConsole) SPXConsole.onNetwork({ type:'fetch', url: url });
        }
        return origFetch.apply(this, arguments);
      };
    }
  }

  /* ---------- snaptr wrapper ---------- */
  function wrapSnaptr() {
    var original = window.snaptr;
    window.snaptr = function (cmd) {
      var args = Array.prototype.slice.call(arguments);
      if (cmd === 'track') {
        var event = args[1], params = args[2] || {};
        var v = validate(event, params);
        _fired++;
        _eventLog.push({ ts: Date.now(), event: event, params: params, v: v });
        if (window.SPXConsole) SPXConsole.onEvent({ event: event, params: params, v: v });
      }
      if (original) return original.apply(this, args);
    };
  }

  /* ---------- SDK loader ---------- */
  function loadSDK(pixelId) {
    if (!pixelId) return;
    (function(e,t,n){
      if(e.snaptr)return;
      var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
      a.queue=[];
      var s='script',r=t.createElement(s);
      r.async=!0;r.src=n;
      var u=t.getElementsByTagName(s)[0];
      u.parentNode.insertBefore(r,u);
    })(window,document,'https://sc-static.net/scevent.min.js');
    wrapSnaptr();
    window.snaptr('init', pixelId, {
      user_email: SPX_BOOT.config.hashedEmail || undefined,
      user_phone_number: SPX_BOOT.config.hashedPhone || undefined,
      user_hashed_external_id: SPX_BOOT.config.externalId || undefined
    });
  }

  /* ---------- fire plan ---------- */
  function firePlan() {
    if (!SPX_BOOT.config.autoFire) return;
    var plan = SPX_BOOT.plan;
    for (var i = 0; i < plan.length; i++) {
      (function(step){
        setTimeout(function(){
          if (window.SPX_BOOT.config.virtualUrl) {
            step.params.page_url = window.location.origin + SPX_BOOT.virtualPath;
          }
          window.snaptr('track', step.event, step.params);
        }, i * 50);
      })(plan[i]);
    }
  }

  return {
    start: function () {
      if (SPX_BOOT.halted) return;
      installInterceptors();
      var cfg = SPX_BOOT.config;
      if (cfg.mode === 'manual' || cfg.mode === 'both') loadSDK(cfg.pixelId);
      firePlan();
    },
    validate: validate,
    getLog: function () { return _eventLog; },
    getNetwork: function () { return _networkLog; }
  };
})();
