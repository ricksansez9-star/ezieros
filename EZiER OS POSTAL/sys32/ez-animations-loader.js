/* EZIER OS — animation loader. Reads animations.js (window.EZ_ANIMATIONS), loads each CSS file, binds it to a target. */
(function () {
  // target name -> CSS selector (+ optional extra rules)
  var TARGETS = {
    'window-open':     { sel: '.window' },
    'window-close':    { sel: '.window.closing' },
    'start-menu-open': { sel: '#start-menu.open', extra: 'transition:none !important;' },
    'start-menu-apps': { sel: '#start-menu.open .app-item' },
    'user-menu-open':  { sel: '#user-menu.open' },
    'error-dialog':    { sel: '#error-dialog:not(.shake)' },
    'lock-screen':     { sel: '#lock-content' },
    'desktop-icons':   { sel: '.desktop-icon' }
  };
  function run(data) {
    var list = Array.isArray(data) ? data : (data.bindings || []);
    var css = '';
    list.forEach(function (b) {
      var t = TARGETS[b.target];
      if (!t || b.enabled === false || !b.name) return;
      if (b.file) {
        var l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = b.file; document.head.appendChild(l);
      }
      var anim = b.name + ' ' + (b.duration || '0.3s') + ' ' + (b.easing || 'ease') + ' ' +
                 (b.delay || '0s') + ' ' + (b.fill || 'both');
      css += t.sel + '{animation:' + anim + ' !important;' + (t.extra || '') + '}\n';
    });
    var s = document.createElement('style'); s.id = 'ez-anim-bindings'; s.textContent = css;
    document.head.appendChild(s);
  }
  if (window.EZ_ANIMATIONS) run(window.EZ_ANIMATIONS);
})();
