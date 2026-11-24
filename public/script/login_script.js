import { API, $, tampilPesan, themeScript, showLoading, hideLoading } from './utils_script.js';

themeScript();

const form = $('formLogin');
const btn = form.querySelector('button[type="submit"]');

function updateButton() {
  btn.disabled = !form.checkValidity();
}

form.addEventListener('input', updateButton);
form.addEventListener('reset', () => setTimeout(updateButton));
updateButton();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  tampilPesan($('pesan'), '');
  btn.disabled = true;
  showLoading('Logging in...');

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: $('username').value,
        password: $('password').value,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.pesan || 'Login gagal');

    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('username', data.username);
    location.href = '/home';   // page leaves, loader stays until then
  } catch (error) {
    hideLoading();
    updateButton();
    tampilPesan($('pesan'), error.message);
  }
});