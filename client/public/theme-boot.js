// Runs before the app loads: applies the last used theme to avoid a flash.
(function () {
  var pref = 'system';
  try {
    pref = localStorage.getItem('tw-theme') || 'system';
  } catch (e) {}
  var dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();
