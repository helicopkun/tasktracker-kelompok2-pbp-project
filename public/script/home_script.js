import { API, $, tampilPesan, makeEl, dueText, makeProgress, themeScript } from './utils_script.js'

themeScript();

async function init() {
  const res = await fetch(`${API}/me`);
  if (!res.ok) return (location.href = '/index.html');
  
  loadUsername();
  loadTeamTABLE();

  loadTasks();
}
init();

async function loadUsername() {
  try {
    const res = await fetch(`${API}/me`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.pesan || 'Gagal mengambil data');
    $('username').textContent = data.username;

  } catch (err) {
    $('username').textContent = data.pesan;
  }
};


$('btnLogout').addEventListener('click', async () => {
    await fetch(`${API}/logout`, {
      method: 'POST'
    });
    location.href = '/index';
});


// Example bukan final
const tableTeam = $('dataTeam');

async function loadTeamTABLE() {
  try {
    const res = await fetch(`${API}/teams`);
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.pesan || 'Gagal mengambil data');

    if (data.length === 0) {
      $('pesanTeamTABLE').hidden = false;
      tampilPesan($('pesanTeamTABLE'), 'Belum ada team');
      return;
    }

    displayTeamTABLE(data);
    $('pesanTeamTABLE').hidden = true;

  } catch (error) {
    $('pesanTeamTABLE').hidden = false;
    tampilPesan($('pesanTeamTABLE'), error.message);
  }
}

function displayTeamTABLE(data) {
  tableTeam.replaceChildren();
  data.forEach(m => {
    const tr = document.createElement('tr');
    [m.name].forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    tableTeam.appendChild(tr);
  });
}



const modal = $('taskModal');

modal.addEventListener('show.bs.modal', async (e) => {
  const card = e.relatedTarget;
  modal.querySelector('#taskName').textContent = card.dataset.taskName;

  const data = await loadTaskDetail(card.dataset.taskId);
  const taskDetails = modal.querySelector('#taskDetails');
  taskDetails.replaceChildren();
  data.forEach(d => {
    const p = document.createElement('p');
    if (d.done) {
    p.style.color = 'var(--success)';
    p.textContent = `${d.name} \u2714`;
  } else {
    p.style.color = 'var(--warning)';
    p.textContent = d.name;
  }
    taskDetails.appendChild(p);
  });
});

const modes = ['all', 'personal', 'team'];
const labels = { all: 'All', personal: 'Personal', team: 'Teams' };
let modeIndex = 0;

const filterBtn = $('filterBtn');

filterBtn.addEventListener('click', () => {
  modeIndex = (modeIndex + 1) % modes.length;   // 0 -> 1 -> 2 -> 0
  filterBtn.textContent = labels[modes[modeIndex]];
  filterBtn.dataset.mode = modes[modeIndex];
  loadTasks(modes[modeIndex]);
});

let requestId = 0;
async function loadTasks(mode = 'all') {
  try {
    const myId = ++requestId;
    const res = await fetch(`${API}/tasks?scope=${mode}`);
    const data = await res.json();
    if (myId !== requestId) return;
    if (res.status === 401) return (location.href = '/index');
    if (!res.ok) throw new Error(data.pesan || 'Gagal mengambil data');

    if (data.length === 0) {
      $('pesanTask').hidden = false;
      tampilPesan($('pesanTask'), 'Belum ada task');
      return;
    }

    displayTask(data);
    $('pesanTask').hidden = true;

  } catch (error) {
    $('pesanTask').hidden = false;
    tampilPesan($('pesanTask'), error.message);
  }
}

async function loadTaskDetail(taskId) {
  const res = await fetch(`${API}/tasks/${taskId}/details`)
  const data = await res.json();
  return data;
}

function displayTask(data) {
  const taskContainer = $('taskContainer');

  const cards = data.map (d => {
    const card = makeEl('button', 'task-card card-surface is-interactive');
    card.type = 'button';
    card.dataset.bsToggle = 'modal';
    card.dataset.bsTarget = '#taskModal';
    card.dataset.taskId = d.id;
    card.dataset.taskName = d.name;

    const pct = d.total ? Math.round((d.done / d.total) * 100) : 0;
    const due = makeEl('p', 'task-due', dueText(d.due));
    if (pct >= 100) { due.classList.add('done'); due.textContent = `\u2714`}
    else if (Math.ceil((new Date(d.due) - Date.now()) / 86400000) < 0) { due.classList.add('overdue'); }
    else { due.classList.add('due'); }
    card.append(
      makeEl('p', 'task-owner', d.owner),
      makeEl('p', 'task-name', d.name),
      due,
      makeEl('div', 'task-percentage', `${pct}%`),
      makeProgress(d.done, d.total),

    );

    return card;
  });
    taskContainer.replaceChildren(...cards);
}

