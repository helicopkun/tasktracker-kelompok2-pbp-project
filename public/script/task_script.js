import { API, $, tampilPesan, themeScript, showLoading, hideLoading } from './utils_script.js';

const listView = $('listView');
const detailView = $('detailView');

// ---------- API helper ----------
async function apiGet(url) {
  const res = await fetch(url, { credentials: 'same-origin' });  // sends the token cookie
  if (!res.ok) {
    const err = new Error('request failed');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

const loadTaskId = (id) => apiGet(`${API}/tasks/${encodeURIComponent(id)}`);
const loadTaskDetail = (id) => apiGet(`${API}/tasks/${encodeURIComponent(id)}/details`);

// ---------- warning / redirect ----------
function loginUrl() {
    return '/login?next=' + encodeURIComponent(location.pathname + location.search);
}

function showWarning(html) {
  const box = $('detailWarning');
  box.innerHTML = html;   // static strings only, never task data
  box.hidden = false;
  $('detailContent').hidden = true;
}

function handleDetailError(err) {
  if (err.status === 401) {
    showWarning(`You need to log in to view this task. <a href="${loginUrl()}" class="alert-link">Log in</a>`);
  } else if (err.status === 404 || err.status === 400) {
    showWarning('This task does not exist, or your account does not have access to it.');
  } else {
    showWarning('Something went wrong. Please try again.');
  }
}

// ---------- detail view ----------
function renderDetail(data, details) {
  // adjust the field names to your actual columns
  $('detailName').textContent = data.name ?? data.title ?? '';
  $('detailOwner').textContent = data.owner ?? '';
  $('detailDue').textContent = data.due_date ?? '';

  const body = $('detailBody');
  body.replaceChildren();
  for (const item of details) {
    const li = document.createElement('li');
    li.textContent = (item.done ? '✓ ' : '• ') + (item.name ?? item.title ?? '') + (': ' + item.detail);
    body.append(li);
  }
}

async function showDetailView(id) {
  listView.hidden = true;
  detailView.hidden = false;
  try {
    const [data, details] = await Promise.all([loadTaskId(id), loadTaskDetail(id)]);
    renderDetail(data, details);
  } catch (err) {
    handleDetailError(err);
  }
}

$('btnCopyLink').addEventListener('click', async () => {
  await navigator.clipboard.writeText(location.href);
});

// ---------- list view ----------
async function showListView() {
  detailView.hidden = true;
  listView.hidden = false;
  try {
    // your existing list loading + card rendering goes here
  } catch (err) {
    if (err.status === 401) location.href = loginUrl();
  }
}

// ---------- start ----------
const detailId = new URLSearchParams(location.search).get('id');
if (detailId) showDetailView(detailId);
else showListView();