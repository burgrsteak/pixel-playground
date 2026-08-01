/* page-signup.js — renders account/registration page */
document.addEventListener('DOMContentLoaded', function () {
  if (SPX_BOOT.halted) return;
  var root = document.getElementById('spx-signup-root');
  if (!root) return;

  if (SPX_BOOT.account) {
    root.innerHTML = '<h1 class="ph">Account</h1>'
      + '<p>Signed in as <strong>' + SPX_BOOT.account.id + '</strong></p><br>'
      + '<a class="btn" href="signup.html?action=signout">Sign out</a>';
    return;
  }

  root.innerHTML = '<h1 class="ph">Create account</h1>'
    + '<div class="signup-tabs">'
    + '<button class="tab-btn active" onclick="this.parentNode.querySelectorAll(\'.tab-btn\').forEach(b=>b.classList.remove(\'active\')); this.classList.add(\'active\')">Email</button>'
    + '<button class="tab-btn" onclick="this.parentNode.querySelectorAll(\'.tab-btn\').forEach(b=>b.classList.remove(\'active\')); this.classList.add(\'active\')">Phone</button>'
    + '</div>'
    + '<form class="form-section" action="signup.html" method="get">'
    + '<input type="hidden" name="action" value="signup">'
    + '<input type="hidden" name="method" value="email">'
    + '<div class="form-group"><label>Email (hashed)</label><input type="text" name="suEmail" placeholder="sha256 of email, or leave blank"></div>'
    + '<div class="form-group"><label>Phone (hashed)</label><input type="text" name="suPhone" placeholder="sha256 of phone, or leave blank"></div>'
    + '<button type="submit" class="btn primary">Create account</button>'
    + '</form>';
});
