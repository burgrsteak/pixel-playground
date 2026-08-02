/* Snap Pixel Playground — Setup tab: live config for Snap Pixel ID, GTM, and options

   Owns the #spx-panel-setup DOM entirely. No page reload required.
   On Apply:
     1. Persists config via SPX_BOOT.configure(patch)
     2. Re-inits the Snap Pixel SDK if pixelId changed
     3. Re-injects the GTM container script if gtmId / mode changed

   Called from console.js: SPXSetup.render() replaces the old renderSetup(). */

var SPXSetup = (function () {

  /* ── helpers ─────────────────────────────────────────────── */

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function isValidPixelId(v) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || '').trim());
  }

  function isValidGtmId(v) {
    return /^GTM-[A-Z0-9]{4,}$/i.test(String(v || '').trim());
  }

  function badge(ok, msg) {
    var cls = ok ? 'ok' : 'err';
    return '<span class="spx-badge ' + cls + '">' + esc(msg) + '</span>';
  }

  /* ── live pixel re-init ───────────────────────────────────── */

  function reinitPixel(pixelId, cfg) {
    if (!pixelId || !isValidPixelId(pixelId)) return;
    /* If snaptr already exists just call init again with the new ID */
    if (window.snaptr) {
      window.snaptr('init', pixelId, {
        user_email: cfg.hashedEmail || undefined,
        user_phone_number: cfg.hashedPhone || undefined,
        user_hashed_external_id: cfg.externalId || undefined
      });
    }
  }

  /* ── live GTM re-inject ───────────────────────────────────── */

  function reinjectGtm(gtmId, dlName) {
    if (!gtmId || !isValidGtmId(gtmId)) return;
    var dl = dlName || 'dataLayer';
    /* Remove any previously injected SPX GTM script */
    var old = document.getElementById('spx-gtm-script');
    if (old) old.parentNode.removeChild(old);
    window[dl] = window[dl] || [];
    window[dl].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.id = 'spx-gtm-script';
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + gtmId + (dl !== 'dataLayer' ? '&l=' + dl : '');
    document.head.appendChild(s);
  }

  /* ── snippet generator ────────────────────────────────────── */

  function buildSnippet(cfg) {
    var lines = [];

    if (cfg.mode === 'manual' || cfg.mode === 'both') {
      lines.push('<!-- Snap Pixel -->');
      lines.push('<script>');
      lines.push('  (function(e,t,n){');
      lines.push('    if(e.snaptr)return;');
      lines.push('    var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};');
      lines.push('    a.queue=[];');
      lines.push('    var s=\'script\',r=t.createElement(s);r.async=!0;');
      lines.push('    r.src=\'https://sc-static.net/scevent.min.js\';');
      lines.push('    var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);');
      lines.push('  })(window,document);');
      var initArgs = ["'init'", "'" + (cfg.pixelId || 'YOUR-PIXEL-ID') + "'"];
      var userData = {};
      if (cfg.hashedEmail)  userData.user_email = cfg.hashedEmail;
      if (cfg.hashedPhone)  userData.user_phone_number = cfg.hashedPhone;
      if (cfg.externalId)   userData.user_hashed_external_id = cfg.externalId;
      if (Object.keys(userData).length) {
        initArgs.push(JSON.stringify(userData, null, 4));
      }
      lines.push('  snaptr(' + initArgs.join(', ') + ');');
      lines.push('  snaptr(\'track\', \'PAGE_VIEW\');');
      lines.push('<\/script>');
    }

    if (cfg.mode === 'gtm' || cfg.mode === 'both') {
      var dl = cfg.dataLayerName || 'dataLayer';
      var id = cfg.gtmId || 'GTM-XXXXXX';
      lines.push('');
      lines.push('<!-- Google Tag Manager -->');
      lines.push('<script>');
      lines.push('  (function(w,d,s,l,i){');
      lines.push('    w[l]=w[l]||[];w[l].push({\'gtm.start\':new Date().getTime(),event:\'gtm.js\'});');
      lines.push('    var f=d.getElementsByTagName(s)[0],j=d.createElement(s),');
      lines.push('        dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';');
      lines.push('    j.async=true;j.src=\'https://www.googletagmanager.com/gtm.js?id=\'+i+dl;');
      lines.push('    f.parentNode.insertBefore(j,f);');
      lines.push('  })(window,document,\'script\',\'' + dl + '\',\'' + id + '\');');
      lines.push('<\/script>');
    }

    return lines.join('\n');
  }

  /* ── section builders ─────────────────────────────────────── */

  function sectionHeader(title, subtitle) {
    return '<div class="spx-setup-section-head"><strong>' + title + '</strong>'
      + (subtitle ? '<span class="spx-setup-section-sub">' + esc(subtitle) + '</span>' : '')
      + '</div>';
  }

  function fieldRow(labelText, inputHtml, statusHtml) {
    return '<div class="spx-setup-row">'
      + '<label>' + esc(labelText) + (statusHtml || '') + '</label>'
      + inputHtml
      + '</div>';
  }

  function textInput(name, value, placeholder, attrs) {
    return '<input type="text" id="spx-cfg-' + name + '" name="' + name + '"'
      + ' value="' + esc(value) + '"'
      + ' placeholder="' + esc(placeholder || '') + '"'
      + (attrs || '') + '>';
  }

  function selectInput(name, value, options) {
    var html = '<select id="spx-cfg-' + name + '" name="' + name + '">';
    options.forEach(function(o) {
      html += '<option value="' + esc(o.v) + '"' + (o.v === value ? ' selected' : '') + '>' + esc(o.l) + '</option>';
    });
    html += '</select>';
    return html;
  }

  function checkRow(name, label, checked) {
    return '<label class="spx-setup-check">'
      + '<input type="checkbox" id="spx-cfg-' + name + '" name="' + name + '"'
      + (checked ? ' checked' : '') + '>' + esc(label) + '</label>';
  }

  /* ── main render ──────────────────────────────────────────── */

  function render() {
    var panel = $('spx-panel-setup');
    if (!panel) return;
    var cfg = SPX_BOOT.config;

    var pixelStatus = cfg.pixelId
      ? (isValidPixelId(cfg.pixelId) ? badge(true, '✓ valid') : badge(false, '✗ invalid UUID'))
      : badge(false, 'not set');

    var gtmStatus = '';
    if (cfg.mode !== 'manual') {
      gtmStatus = cfg.gtmId
        ? (isValidGtmId(cfg.gtmId) ? badge(true, '✓ valid') : badge(false, '✗ bad format'))
        : badge(false, 'not set');
    }

    var showGtm = cfg.mode === 'gtm' || cfg.mode === 'both';

    var html = [
      '<div class="spx-setup-wrap">',

      /* ── Snap Pixel ── */
      sectionHeader('Snap Pixel', 'Pixel ID · user identity'),

      fieldRow('Pixel ID ' + pixelStatus,
        textInput('pixelId', cfg.pixelId,
          'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          ' class="spx-cfg-pixel-id"'),
        ''),

      fieldRow('Hashed Email',
        textInput('hashedEmail', cfg.hashedEmail, 'sha256 hex — or leave blank'), ''),

      fieldRow('Hashed Phone',
        textInput('hashedPhone', cfg.hashedPhone, 'sha256 hex — or leave blank'), ''),

      fieldRow('External / User ID',
        textInput('externalId', cfg.externalId, 'your internal user ID'), ''),

      /* ── Mode ── */
      sectionHeader('Mode', 'How events are sent'),

      fieldRow('Firing mode',
        selectInput('mode', cfg.mode, [
          { v:'manual', l:'manual — direct snaptr() calls' },
          { v:'gtm',    l:'gtm — via Google Tag Manager only' },
          { v:'both',   l:'both — snaptr() + GTM dataLayer' }
        ]), ''),

      /* ── GTM (shown/hidden by JS) ── */
      '<div id="spx-gtm-fields" style="' + (showGtm ? '' : 'display:none') + '">',
      sectionHeader('Google Tag Manager', 'Container · dataLayer'),

      fieldRow('GTM Container ID ' + gtmStatus,
        textInput('gtmId', cfg.gtmId, 'GTM-XXXXXX'), ''),

      fieldRow('dataLayer name',
        textInput('dataLayerName', cfg.dataLayerName, 'dataLayer'), ''),
      '</div>',

      /* ── Options ── */
      sectionHeader('Options'),
      checkRow('autoFire',    'Auto-fire event plan on page load', cfg.autoFire),
      checkRow('virtualUrl',  'Send virtual page URLs',            cfg.virtualUrl),
      checkRow('clientDedup', 'Client-side dedup IDs',             cfg.clientDedup),

      fieldRow('Currency',
        textInput('currency', cfg.currency, 'USD'), ''),

      /* ── Actions ── */
      '<div class="spx-setup-actions">',
      '<button type="button" id="spx-setup-apply" class="btn primary">Apply</button>',
      '<button type="button" id="spx-setup-reset" class="spx-setup-reset-btn">Reset all</button>',
      '</div>',

      /* ── Status bar ── */
      '<div id="spx-setup-status" class="spx-setup-status"></div>',

      /* ── Generated snippet ── */
      sectionHeader('Generated snippet', 'copy into your &lt;head&gt;'),
      '<div class="spx-snippet-wrap">',
      '<button type="button" class="spx-snippet-copy" id="spx-snippet-copy">Copy</button>',
      '<pre id="spx-snippet-pre" class="spx-snippet">' + esc(buildSnippet(cfg)) + '</pre>',
      '</div>',

      '</div>' /* end .spx-setup-wrap */
    ].join('\n');

    panel.innerHTML = html;
    bindSetupEvents();
  }

  /* ── event binding ────────────────────────────────────────── */

  function bindSetupEvents() {
    /* Show/hide GTM fields when mode changes */
    var modeEl = document.getElementById('spx-cfg-mode');
    if (modeEl) {
      modeEl.addEventListener('change', function () {
        var gtmFields = document.getElementById('spx-gtm-fields');
        if (gtmFields) {
          gtmFields.style.display = (modeEl.value === 'gtm' || modeEl.value === 'both') ? '' : 'none';
        }
        refreshSnippet();
      });
    }

    /* Live snippet refresh on any input */
    ['pixelId','hashedEmail','hashedPhone','externalId','gtmId','dataLayerName','currency']
      .forEach(function (name) {
        var el = document.getElementById('spx-cfg-' + name);
        if (el) el.addEventListener('input', refreshSnippet);
      });

    /* Apply button */
    var applyBtn = document.getElementById('spx-setup-apply');
    if (applyBtn) applyBtn.addEventListener('click', applyConfig);

    /* Reset button */
    var resetBtn = document.getElementById('spx-setup-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (!confirm('Reset all Pixel Playground settings and cart? This cannot be undone.')) return;
        window.location.href = 'index.html?action=reset';
      });
    }

    /* Copy snippet */
    var copyBtn = document.getElementById('spx-snippet-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var pre = document.getElementById('spx-snippet-pre');
        if (!pre) return;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(pre.textContent).then(function () {
            copyBtn.textContent = 'Copied!';
            setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
          });
        } else {
          var ta = document.createElement('textarea');
          ta.value = pre.textContent;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copyBtn.textContent = 'Copied!';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
        }
      });
    }
  }

  function readFormValues() {
    function val(name) {
      var el = document.getElementById('spx-cfg-' + name);
      return el ? el.value : '';
    }
    function chk(name) {
      var el = document.getElementById('spx-cfg-' + name);
      return el ? el.checked : false;
    }
    return {
      pixelId:       val('pixelId').trim(),
      mode:          val('mode'),
      gtmId:         val('gtmId').trim().toUpperCase(),
      dataLayerName: val('dataLayerName').trim() || 'dataLayer',
      currency:      val('currency').trim().toUpperCase() || 'USD',
      hashedEmail:   val('hashedEmail').trim(),
      hashedPhone:   val('hashedPhone').trim(),
      externalId:    val('externalId').trim(),
      autoFire:      chk('autoFire'),
      virtualUrl:    chk('virtualUrl'),
      clientDedup:   chk('clientDedup')
    };
  }

  function refreshSnippet() {
    var pre = document.getElementById('spx-snippet-pre');
    if (!pre) return;
    var values = readFormValues();
    pre.textContent = buildSnippet(values);
  }

  function applyConfig() {
    var status = document.getElementById('spx-setup-status');
    var values = readFormValues();

    /* Validate */
    var errors = [];
    if (values.pixelId && !isValidPixelId(values.pixelId)) {
      errors.push('Pixel ID must be a UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).');
    }
    if ((values.mode === 'gtm' || values.mode === 'both') && values.gtmId && !isValidGtmId(values.gtmId)) {
      errors.push('GTM Container ID must match GTM-XXXXXX.');
    }
    if (errors.length) {
      status.innerHTML = errors.map(function(e){
        return '<span class="spx-badge err">' + esc(e) + '</span>';
      }).join(' ');
      return;
    }

    var prevPixelId = SPX_BOOT.config.pixelId;
    var prevGtmId   = SPX_BOOT.config.gtmId;
    var prevMode    = SPX_BOOT.config.mode;

    /* Persist */
    SPX_BOOT.configure(values);

    /* Re-wire pixel if ID or mode changed */
    if (values.pixelId !== prevPixelId ||
        values.mode !== prevMode) {
      reinitPixel(values.pixelId, values.config);
    }

    /* Re-inject GTM if container or mode changed */
    if ((values.mode === 'gtm' || values.mode === 'both') &&
        (values.gtmId !== prevGtmId || values.mode !== prevMode)) {
      reinjectGtm(values.gtmId, values.dataLayerName);
    }

    /* Refresh snippet */
    refreshSnippet();

    /* Update Pixel ID status badge in the label */
    var pixelStatus = values.pixelId
      ? (isValidPixelId(values.pixelId) ? badge(true, '\u2713 valid') : badge(false, '\u2717 invalid UUID'))
      : badge(false, 'not set');
    var pixelLabel = document.querySelector('#spx-panel-setup label:first-of-type');
    /* Re-render is simpler for status accuracy */
    render();

    /* Show saved confirmation */
    var newStatus = document.getElementById('spx-setup-status');
    if (newStatus) {
      newStatus.innerHTML = '<span class="spx-badge ok">\u2713 Saved — config applied live</span>';
      setTimeout(function () {
        if (newStatus) newStatus.innerHTML = '';
      }, 3000);
    }
  }

  return {
    render: render
  };

})();
