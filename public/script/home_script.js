import { API, $, tampilPesan, makeEl, dueText, makeProgress, themeScript, pisahWaktu } from './utils_script.js'

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

function displayTask(data) {
  const taskContainer = $('taskContainer');

  const cards = data.map (d => {
    const card = makeEl('button', 'task-card card-surface is-interactive');
    card.type = 'button';
    card.dataset.bsToggle = 'modal';
    card.dataset.bsTarget = '#taskModal';
    card.dataset.taskId = d.id;
    // card.dataset.taskName = d.name;

    const dueCard = makeEl('p', 'task-due', dueText(d.due));
    
    const pct = d.total ? Math.round((d.done / d.total) * 100) : 0;
    if (pct >= 100) { dueCard.classList.add('done'); dueCard.textContent = `\u2714`}
    else if (Math.ceil((new Date(d.due) - Date.now()) / 86400000) < 0) { dueCard.classList.add('overdue'); }
    else { dueCard.classList.add('due'); }
    card.append(
      makeEl('p', 'task-owner', d.owner),
      makeEl('p', 'task-name', d.name),
      dueCard,
      makeEl('div', 'task-percentage', `${pct}%`),
      makeProgress(d.done, d.total),

    );

    return card;
  });
    taskContainer.replaceChildren(...cards);
}

const modal = $('taskModal');
const body = modal.querySelector('#taskDetails');
const name = modal.querySelector('#taskName');
const owner = modal.querySelector('#taskOwner');
const due = modal.querySelector('#taskDue');

const dataCache = new Map();
const detailCache = new Map();
let reqId = 0;

function renderTaskData(data) {
  name.textContent = data.name;
  owner.textContent = data.owner;
  const dueDate = pisahWaktu(data.due);
  due.textContent = `${dueText(data.due)} | ${dueDate.tanggal} ${dueDate.jam}`;
  due.className = 'task-due modal-ver';
  if (data.finished) { due.classList.add('done'); due.textContent = `\u2714`}
  else if (Math.ceil((new Date(data.due) - Date.now()) / 86400000) < 0) { due.classList.add('overdue'); }
  else { due.classList.add('due'); }
}

function renderTaskDetails(dataDetail) {
  const body = modal.querySelector('#taskDetails');

  if (dataDetail.length === 0) {
    body.textContent = 'Belum ada detail';
    return;
  }
  const items = dataDetail.map(d => {
    const p = document.createElement('p');
    p.style.color = d.done ? 'var(--success)' : 'var(--warning)';
    p.textContent = d.done ? `${d.name} \u2714` : d.name;
    return p;
  });
  body.replaceChildren(...items);
}

const btnTaskDetail = $('btnTaskDetail');
btnTaskDetail.addEventListener('click', () => {
  const id = btnTaskDetail.dataset.taskId;
  if (id) window.location.href = `/task?id=${encodeURIComponent(id)}`;
});

modal.addEventListener('show.bs.modal', async (e) => {
  const card = e.relatedTarget;
  const taskId = card.dataset.taskId;
  const myId = ++reqId;
  btnTaskDetail.dataset.taskId = taskId;

  // show cached data instantly, otherwise a loading message
  if (dataCache.has(taskId) && detailCache.has(taskId)) {
    renderTaskData(dataCache.get(taskId));
    renderTaskDetails(detailCache.get(taskId));
  } else {
    [name,owner,due,body].forEach(e => {e.textContent = 'Loading..';});
  }

  try {
    const data = await loadTaskId(taskId)
    const dataDetail = await loadTaskDetail(taskId);
    if (myId !== reqId) return;
    
    dataCache.set(taskId, data);
    detailCache.set(taskId, dataDetail);
    renderTaskData(data);
    renderTaskDetails(dataDetail);
  } catch (err) {
    if (myId !== reqId) return;
    [name,owner,due,body].forEach(e => {e.textContent = 'Gagal memuat data';});
  }
});


async function loadTaskId(taskId) {
  const res = await fetch(`${API}/tasks/${taskId}`)
  if (res.status === 401) { location.href = '/index'; throw new Error('Belum login'); }
  if (!res.ok) throw new Error('Gagal memuat detail');
  return res.json();
}

async function loadTaskDetail(taskId) {
  const res = await fetch(`${API}/tasks/${taskId}/details`)
  if (res.status === 401) { location.href = '/index'; throw new Error('Belum login'); }
  if (!res.ok) throw new Error('Gagal memuat detail');
  return res.json();
}



