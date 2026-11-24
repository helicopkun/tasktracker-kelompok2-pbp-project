import { API, $, tampilPesan, themeScript, showLoading, hideLoading } from './utils_script.js'

themeScript();

const form = $('formRegister');
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

  if ($('password').value !== $('pwConfirm').value) {
    $('pwConfirm').value = '';
    tampilPesan($('pesan'), 'Password tidak sama!');

    return;
  }

  showLoading('Registering...');
  try {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: $('username').value,
        password: $('password').value,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.pesan || 'Register gagal');

    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('username', data.username);
    location.href = '/home';
  } catch (error) {
    hideLoading();
    updateButton();
    tampilPesan($('pesan'), error.message);
  }

});