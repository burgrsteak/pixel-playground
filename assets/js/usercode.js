/* ============================================================================
   usercode.js — the editable backend.

   Whatever the user types in Console -> Editor runs here, against a small,
   documented API (`spx`). It runs INSIDE the page, after init but BEFORE the
   page's auto-fire plan, so a beforeFire hook can intercept the very first
   PAGE_VIEW.

   Deliberate design notes:
   - new Function, not eval: the code gets its own scope and cannot see this
     module's locals, so a stray `var name` in user code can't shadow ours.
   - Errors are caught and reported to the Logs tab. A syntax error in user
     code must never take the storefront down, or the playground becomes
     unusable exactly when you most need it.
   - The API is a facade. User code never touches SPXBus or SPX_BOOT directly,
     so the surface stays stable.
   ========================================================================= */

var SPX_STARTER = [
  '// ---------------------------------------------------------------------',
  '// Voltcore sandbox — this code runs on every page load.',
  '// It runs AFTER snaptr(\'init\') and BEFORE the page fires its own events,',
  '// so a beforeFire hook below sees every event including PAGE_VIEW.',
  '//',
  '// Quick reference (full list in Console -> Help):',
  '//   spx.page                  current page name, e.g. "product"',
  '//   spx.config                live config (read-only copy)',
  '//   spx.cart / spx.catalog    session state',
  '//   spx.fire(name, params)    fire an event through the validator',
  '//   spx.beforeFire(fn)        intercept/modify/cancel every event',
  '//   spx.log(msg)              write to the Logs tab',
  '//   spx.on(page, fn)          run fn only on that page',
  '// ---------------------------------------------------------------------',
  '',
  'spx.log(\'user code running on: \' + spx.page);',
  '',
  '// 1. Add a parameter to every outgoing event.',
  '//    Real use: tagging a test environment so QA hits are filterable.',
  'spx.beforeFire(function (event, params) {',
  '  params.client_dedup_id = spx.uuid();   // shared id for Pixel + CAPI dedup',
  '  return { event: event, params: params };',
  '});',
  '',
  '// 2. Fire a custom event only on the product page.',
  '// spx.on(\'product\', function () {',
  '//   spx.fire(\'CUSTOM_EVENT_1\', { item_ids: [spx.sku], description: \'size chart opened\' });',
  '// });',
  '',
  '// 3. Cancel an event instead of firing it.',
  '// spx.beforeFire(function (event) {',
  '//   if (event === \'LIST_VIEW\') return false;',
  '// });',
  ''
].join('\n');

var SPXUserCode = (function () {
  var lastError = null;

  /** The API handed to user code. Kept small and documented on purpose. */
  function api() {
    var pageHandlers = [];

    var spx = {
      /* ---- read-only context ---- */
      page:    SPX_BOOT.page,
      sku:     SPX_BOOT.sku,
      query:   SPX_BOOT.q,
      config:  JSON.parse(JSON.stringify(SPX_BOOT.config)),
      cart:    SPX_BOOT.cart,
      catalog: SPX_CATALOG,
      account: SPX_BOOT.account,
      order:   SPX_BOOT.lastOrder,
      plan:    SPX_BOOT.plan,

      /* ---- firing ---- */
      /** Fire an event through the same validator and logger as the page. */
      fire: function (name, params) {
        SPXPixel.fire(String(name), params || {}, 'editor');
      },

      /** Intercept every event. Return false to cancel, or {event, params}. */
      beforeFire: function (fn) { SPXPixel.addHook(fn); },

      /* ---- helpers ---- */
      /** Run fn only when the current page matches. */
      on: function (page, fn) {
        if (SPX_BOOT.page === page) pageHandlers.push(fn);
      },
      log:  function (msg) { SPXBus.logLine('info', msg); },
      warn: function (msg) { SPXBus.logLine('warn', msg); },

      /** SHA-256 hex, for building user_hashed_* values in the browser. */
      sha256: async function (value) {
        var norm = String(value).trim().toLowerCase();
        var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(norm));
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
      },

      uuid: function () {
        if (crypto && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
      },

      /** Look up a catalog item by SKU. */
      product: function (sku) { return SPX_findSku(sku); },

      /** Raw dataLayer push, bypassing the manual path entirely. */
      push: function (obj) {
        var dl = SPX_BOOT.config.dataLayerName || 'dataLayer';
        window[dl] = window[dl] || [];
        window[dl].push(obj);
      },

      /** Escape hatch for anything the facade does not cover. */
      raw: { bus: SPXBus, boot: SPX_BOOT, pixel: SPXPixel, validate: SPXValidate },

      _flush: function () {
        for (var i = 0; i < pageHandlers.length; i++) {
          try { pageHandlers[i](); }
          catch (err) { SPXBus.logLine('error', 'page handler threw: ' + (err && err.message)); }
        }
      }
    };
    return spx;
  }

  function run() {
    var src = SPX_loadUserCode();
    if (!src || !src.trim()) { SPXBus.logLine('info', 'No user code saved. Console -> Editor to add some.'); return; }

    var spx = api();
    lastError = null;
    try {
      // new Function gives user code its own scope. 'use strict' so silent
      // globals become errors the user can actually see.
      var fn = new Function('spx', '"use strict";\n' + src);
      fn(spx);
      spx._flush();
      SPXBus.logLine('info', 'User code ran without errors.');
    } catch (err) {
      lastError = err;
      SPXBus.logLine('error', (err && err.name ? err.name + ': ' : '') + (err && err.message));
      // Deliberately swallowed: a broken snippet must not break the store.
    }
    window.spx = spx;   // also available from the browser devtools console
  }

  /** Parse-only check, for the editor's Check button. */
  function validate(src) {
    try { new Function('spx', '"use strict";\n' + String(src)); return { ok:true }; }
    catch (err) { return { ok:false, message: (err && err.name) + ': ' + (err && err.message) }; }
  }

  return { run: run, validate: validate, starter: SPX_STARTER,
           lastError: function () { return lastError; } };
})();
