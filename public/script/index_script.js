import { $, tampilPesan, API, themeScript } from './utils_script.js'

themeScript();

async function init() {
  const res = await fetch(`${API}/me`);
  if (res.ok) return (location.href = '/home.html');
}
init();
