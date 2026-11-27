export const $ = id => document.getElementById(id);
export const API = '/api/task-track';

export function tampilPesan(el, teks) { // tampilPesan($('id'), 'string pesan')
  el.textContent = teks;
}

export function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function dueText(due) {
  if (!due) return 'No due date';
  const days = Math.ceil((new Date(due) - Date.now()) / 86400000);
  if (days < 0) return `Overdue ${-days} day(s)`;
  if (days === 0) return 'Due today';
  const months = Math.floor(days / 30);
  return months ? `Due in ${months} mo, ${days % 30} d` : `Due in ${days} day(s)`;
}

export function makeProgress(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;

  const progress = makeEl('div', 'progress');
  progress.style.height = '6px';
  progress.setAttribute('role', 'progressbar');
  progress.setAttribute('aria-valuenow', pct);
  progress.setAttribute('aria-valuemin', 0);
  progress.setAttribute('aria-valuemax', 100);

  const bar = makeEl('div', 'progress-bar');
  bar.style.width = `${pct}%`;

  progress.appendChild(bar);
  return progress;
}


export function pisahWaktu(iso) {
  const d = new Date(iso);
  return {
    tanggal: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'}),
    jam: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
  };
}

/* ---------- LOADING SCREEN ---------- */
const overlay = $('loadingOverlay');
const loadingText = $('loadingText');

export function showLoading(message = 'Loading...') {
  loadingText.textContent = message;
  overlay.classList.add('is-active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}

export function hideLoading() {
  overlay.classList.remove('is-active');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
}

export function btnScript (id, message) {
  $(id).addEventListener('click', () => showLoading(message));
}

/* ---------- LIGHT / DARK TOGGLE ---------- */
const root = document.documentElement;

function applyTheme(theme, toggleBtn) {
  root.setAttribute('data-bs-theme', theme);   // 'light' or 'dark'
  if (toggleBtn) toggleBtn.textContent = theme === 'light' ? '☀️' : '🌙';
  try { localStorage.setItem('theme', theme); } catch (e) {}
}

export function themeScript() {
  const toggleBtn = document.getElementById('themeToggle'); // may not exist on this page
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(saved || (systemLight ? 'light' : 'dark'), toggleBtn);

  if (!toggleBtn) return;
  toggleBtn.addEventListener('click', () => {
    const isLight = root.getAttribute('data-bs-theme') === 'light';
    applyTheme(isLight ? 'dark' : 'light', toggleBtn);
  });
}