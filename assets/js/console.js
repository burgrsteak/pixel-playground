/* Snap Pixel Playground — debug console panel */

var SPX_CONSOLE_HTML = [
  '<div id="spx-console">',
  '  <div id="spx-console-toggle">',
  '    <span>SPX Console</span><span id="spx-console-chevron">&#9650;</span>',
  '  </div>',
  '  <div id="spx-console-body" style="display:none">',
  '    <div class="spx-tabs">',
  '      <span class="spx-tab active" data-tab="events">Events</span>',
  '      <span class="spx-tab" data-tab="network">Network</span>',
  '      <span class="spx-tab" data-tab="history">History</span>',
  '      <span class="spx-tab" data-tab="setup">Setup</span>',
  '      <span class="spx-tab" data-tab="code">Code</span>',
  '    </div>',
  '    <div class="spx-panel active" id="spx-panel-events"><em>Waiting for events&hellip;</em></div>',
  '    <div class="spx-panel" id="spx-panel-network"><em>No network requests yet.</em></div>',
  '    <div class="spx-panel" id="spx-panel-history"></div>',
  '    <div class="spx-panel" id="spx-panel-setup"></div>',
  '    <div class="spx-panel" id="spx-panel-code"></div>',
  '  </div>',
  '</div>'
].join('\n');

var SPXConsole = (function () {
  var _open = false;

  function $(id) { return document.getElementById(id); }

  function renderSetup() {
    var cfg = SPX_BOOT.config;
    var f = document.createElement('form');
    f.className = 'spx-setup-form';
    f.action = window.location.pathname;
    f.method = 'get';
    f.innerHTML = [
      hiddenInput('action', 'saveconfig'),
      hiddenInput('page', SPX_BOOT.page),
      SPX_BOOT.sku ? hiddenInput('sku', SPX_BOOT.sku) : '',
      field('Pixel ID', 'pixelId', cfg.pixelId, 'text', 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'),
      field('Mode', 'mode', cfg.mode, 'select', '', ['manual','gtm','both']),
      (cfg.mode !== 'manual' ? field('GTM Container ID', 'gtmId', cfg.gtmId, 'text', 'GTM-XXXXXX') : ''),
      (cfg.mode !== 'manual' ? field('dataLayer name', 'dataLayerName', cfg.dataLayerName, 'text', 'dataLayer') : ''),
      field('Currency', 'currency', cfg.currency, 'text', 'USD'),
      field('Hashed Email', 'hashedEmail', cfg.hashedEmail, 'text', 'sha256 hex'),
      field('Hashed Phone', 'hashedPhone', cfg.hashedPhone, 'text', 'sha256 hex'),
      field('External ID', 'externalId', cfg.externalId, 'text', 'your user ID'),
      checkbox('Virtual URL', 'virtualUrl', cfg.virtualUrl),
      checkbox('Auto-fire plan', 'autoFire', cfg.autoFire),
      checkbox('Client dedup', 'clientDedup', cfg.clientDedup),
      '<button type="submit" class="btn primary">Apply</button>',
      ' <a href="index.html?action=reset" style="color:#f06060;font-size:.78rem;margin-left:.5rem">Reset all</a>'
    ].join('');
    var panel = $('spx-panel-setup');
    if (panel) { panel.innerHTML = ''; panel.appendChild(f); }
  }

  function hiddenInput(name, value) {
    return '<input type="hidden" name="' + name + '" value="' + escAttr(value) + '">';
  }

  function field(label, name, value, type, placeholder, options) {
    var html = '<label>' + label + '</label>';
    if (type === 'select') {
      html += '<select name="' + name + '">';
      (options || []).forEach(function(o){
        html += '<option value="' + o + '"' + (o === value ? ' selected' : '') + '>' + o + '</option>';
      });
      html += '</select>';
    } else {
      html += '<input type="text" name="' + name + '" value="' + escAttr(value || '') + '" placeholder="' + escAttr(placeholder || '') + '">';
    }
    return html;
  }

  function checkbox(label, name, checked) {
    return '<label style="display:flex;gap:.4rem;align-items:center;margin-bottom:.5rem">'
      + '<input type="checkbox" name="' + name + '" value="on"' + (checked ? ' checked' : '') + '>'
      + label + '</label>';
  }

  function escAttr(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
  }

  function renderHistory() {
    var h = SPX_BOOT.history, panel = $('spx-panel-history');
    if (!panel) return;
    if (!h || !h.length) { panel.innerHTML = '<em>No history yet.</em>'; return; }
    var rows = h.slice().reverse().map(function(entry){
      var t = new Date(entry.t);
      var time = t.getHours() + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds());
      return '<div class="spx-history-row"><strong>' + entry.page + '</strong> '
        + entry.events.join(', ') + ' <span style="color:#555">' + time + '</span></div>';
    });
    panel.innerHTML = rows.join('');
  }

  function pad(n) { return n < 10 ? '0'+n : n; }

  return {
    init: function () {
      var toggle = $('spx-console-toggle');
      var body   = $('spx-console-body');
      var chevron = $('spx-console-chevron');
      if (!toggle) return;

      toggle.addEventListener('click', function () {
        _open = !_open;
        body.style.display = _open ? 'flex' : 'none';
        body.style.flexDirection = 'column';
        chevron.innerHTML = _open ? '&#9660;' : '&#9650;';
        if (_open && SPX_BOOT.openTab) SPXConsole.openTab(SPX_BOOT.openTab);
      });

      document.querySelectorAll('.spx-tab').forEach(function(tab){
        tab.addEventListener('click', function () {
          SPXConsole.openTab(tab.dataset.tab);
        });
      });

      renderSetup();
      renderHistory();
      SPXCodegen.renderPage($('spx-panel-code'));

      if (SPX_BOOT.openTab) {
        _open = true;
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        chevron.innerHTML = '&#9660;';
        SPXConsole.openTab(SPX_BOOT.openTab);
      }
    },

    openTab: function (name) {
      document.querySelectorAll('.spx-tab').forEach(function(t){ t.classList.remove('active'); });
      document.querySelectorAll('.spx-panel').forEach(function(p){ p.classList.remove('active'); });
      var tab = document.querySelector('[data-tab="' + name + '"]');
      var panel = $('spx-panel-' + name);
      if (tab) tab.classList.add('active');
      if (panel) panel.classList.add('active');
    },

    onEvent: function (entry) {
      var panel = $('spx-panel-events');
      if (!panel) return;
      var v = entry.v || {};
      var badges = (v.errs || []).map(function(e){ return '<span class="spx-badge err">' + e + '</span>'; })
        .concat((v.warns || []).map(function(w){ return '<span class="spx-badge warn">' + w + '</span>'; }))
        .join(' ');
      var row = document.createElement('div');
      row.className = 'spx-event-row';
      row.innerHTML = '<div class="spx-event-name">' + entry.event + badges + '</div>'
        + '<div class="spx-event-params">' + JSON.stringify(entry.params, null, 2) + '</div>';
      if (panel.querySelector('em')) panel.innerHTML = '';
      panel.insertBefore(row, panel.firstChild);
    },

    onNetwork: function (entry) {
      var panel = $('spx-panel-network');
      if (!panel) return;
      var row = document.createElement('div');
      row.className = 'spx-network-row';
      var decoded = decodeURIComponent(entry.url);
      row.innerHTML = '<span style="color:#888">[' + entry.type.toUpperCase() + ']</span> '
        + '<span class="spx-network-url">' + decoded + '</span>';
      if (panel.querySelector('em')) panel.innerHTML = '';
      panel.insertBefore(row, panel.firstChild);
    }
  };
})();
