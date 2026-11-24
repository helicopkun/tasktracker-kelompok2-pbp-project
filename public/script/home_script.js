import { API, username, $, tampilPesan, pisahWaktu, themeScript } from './utils_script.js'

themeScript();

if (!localStorage.getItem('loggedIn')) {
  location.replace('/index');
}

$('username').textContent = username;

$('btnLogout').addEventListener('click', () => {
    localStorage.clear();
    location.href = '/index';
});


$('formNewtask').addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const res = await fetch(`${API}/new-task-personal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_name: $('taskName').value,
        due: $('due').value,
        username: username
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.pesan || 'Penambahan data gagal');

    e.target.reset();
    tampilPesan($('pesanNewtask'), 'Task baru ditambahkan!');
    muatData();
    
  } catch (error) {
    tampilPesan($('pesanNewtask'), error.message)
  }
})

// Example bukan final
const tabel = $('dataTask');

async function muatData() {
  try {
    const res = await fetch(`${API}/view-task-personal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username
      }),
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.pesan || 'Gagal mengambil data');

    if (data.length === 0) {
      $('pesanData').hidden = false;
      tampilPesan($('pesanData'), 'Belum ada task');
      return;
    }

    tampilkanTabel(data);
    $('pesanData').hidden = true;

  } catch (error) {
    $('pesanData').hidden = false;
    tampilPesan($('pesanData'), error.message);
  }
}

function tampilkanTabel(data) {
  tabel.replaceChildren();
  data.forEach(m => {
    const tr = document.createElement('tr');
    const { tanggal, jam } = pisahWaktu(m.due);
    const str_date = `${tanggal} ${jam}`;
    [m.task_name, str_date].forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    tabel.appendChild(tr);
  });
}

muatData();