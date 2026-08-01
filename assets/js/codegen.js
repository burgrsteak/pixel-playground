/* Snap Pixel Playground — generates copy-paste Snap Pixel implementation code */

var SPXCodegen = (function () {
  function esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function genInit(cfg) {
    var lines = ["snaptr('init', '" + esc(cfg.pixelId || 'YOUR_PIXEL_ID') + "'"];
    var opts = {};
    if (cfg.hashedEmail)  opts.user_email = cfg.hashedEmail;
    if (cfg.hashedPhone)  opts.user_phone_number = cfg.hashedPhone;
    if (cfg.externalId)   opts.user_hashed_external_id = cfg.externalId;
    if (Object.keys(opts).length) {
      lines[0] += ', ' + JSON.stringify(opts, null, 2).replace(/\n/g, '\n  ');
    }
    lines[0] += ');';
    return lines.join('\n');
  }

  function genTrack(step) {
    var p = step.params;
    if (!p || !Object.keys(p).length) return "snaptr('track', '" + step.event + "');";
    return "snaptr('track', '" + step.event + "', " + JSON.stringify(p, null, 2) + ");";
  }

  return {
    renderPage: function (container) {
      if (SPX_BOOT.halted) return;
      var cfg = SPX_BOOT.config, plan = SPX_BOOT.plan;
      var html = '<div class="spx-codegen">';
      html += '<h4>Init</h4><pre>' + genInit(cfg) + '</pre>';
      html += '<h4>Events</h4>';
      for (var i = 0; i < plan.length; i++) {
        html += '<pre>' + esc(genTrack(plan[i])) + '</pre>';
      }
      html += '</div>';
      if (container) container.innerHTML = html;
      return html;
    }
  };
})();
