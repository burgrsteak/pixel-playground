/* Snap Pixel Playground — first-load acknowledgement gate */

var SPX_TERMS_HTML = [
  '<div id="spx-terms-overlay" style="display:none">',
  '  <div class="spx-terms-box">',
  '    <h2>Before you start</h2>',
  '    <p>This playground fires real Snap Pixel events. Only use it with a <strong>test Pixel ID</strong> — never a live production Pixel that has real customer data or active ad campaigns.</p>',
  '    <p>Events fired here will appear in your Snap Events Manager and may affect delivery optimisation if the Pixel is attached to an active campaign.</p>',
  '    <div class="spx-terms-check">',
  '      <input type="checkbox" id="spx-terms-cb">',
  '      <label for="spx-terms-cb">I confirm I am using a test Pixel ID</label>',
  '    </div>',
  '    <button class="btn primary" id="spx-terms-accept" disabled>Continue</button>',
  '  </div>',
  '</div>'
].join('\n');

var SPXTerms = (function () {
  var _callback = null;

  return {
    gate: function (cb) {
      _callback = cb;
      if (SPX_BOOT.halted) return;
      if (!SPX_BOOT.showTerms) { if (cb) cb(); return; }

      var overlay = document.getElementById('spx-terms-overlay');
      var cb_el   = document.getElementById('spx-terms-cb');
      var btn     = document.getElementById('spx-terms-accept');
      if (!overlay) { if (cb) cb(); return; }

      overlay.style.display = 'flex';
      cb_el.addEventListener('change', function () {
        btn.disabled = !cb_el.checked;
      });
      btn.addEventListener('click', function () {
        SPX_ackTermsToday();
        overlay.style.display = 'none';
        if (_callback) _callback();
      });
    },
    reset: function () {
      SPX_resetTermsAck();
      window.location.reload();
    }
  };
})();
