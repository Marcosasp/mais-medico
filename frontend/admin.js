/* ═══════════════════════════════════════════════════════════
   CUIDARBEM — admin.js
   ═══════════════════════════════════════════════════════════ */

const API   = '';
const TOKEN = localStorage.getItem('mm-admin-token');

// Auth guard
if (!TOKEN) window.location.href = 'login.html';

// Display admin name
const userRaw = localStorage.getItem('mm-admin-user');
if (userRaw) {
  try { document.getElementById('adminName').textContent = JSON.parse(userRaw).nome; } catch {}
}

/* ── Toast ────────────────────────────────────────────────── */
function toast(msg, type = 'success') {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warn: 'fa-triangle-exclamation' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fas ${icons[type] || icons.success}"></i><span>${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 380); }, 4200);
}

/* ── Theme ────────────────────────────────────────────────── */
const html  = document.documentElement;
const saved = localStorage.getItem('mm-theme') || 'light';
html.setAttribute('data-theme', saved);
updateIcon(saved);
document.getElementById('themeToggle').addEventListener('click', () => {
  const cur  = html.getAttribute('data-theme');
  const next = cur === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('mm-theme', next);
  updateIcon(next);
});
function updateIcon(t) {
  document.getElementById('themeToggle').innerHTML = t === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

/* ── Logout ───────────────────────────────────────────────── */
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('mm-admin-token');
  localStorage.removeItem('mm-admin-user');
  window.location.href = 'login.html';
});

/* ── State ────────────────────────────────────────────────── */
let allAgendamentos = [];
let activeFilter    = '';
let searchTerm      = '';

/* ── Fetch agendamentos ───────────────────────────────────── */
async function loadAgendamentos() {
  try {
    const params = new URLSearchParams();
    if (activeFilter) params.set('status', activeFilter);
    if (searchTerm)   params.set('busca', searchTerm);

    const res = await fetch(`${API}/api/agendamentos?${params}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (res.status === 401) {
      localStorage.removeItem('mm-admin-token');
      localStorage.removeItem('mm-admin-user');
      window.location.href = 'login.html';
      return;
    }
    if (!res.ok) throw new Error('Erro ao buscar agendamentos');

    allAgendamentos = await res.json();
    renderTable(allAgendamentos);
    updateStats(allAgendamentos);
    renderChart(allAgendamentos);
  } catch (e) {
    document.getElementById('tableBody').innerHTML =
      `<tr><td colspan="7" class="empty-state"><i class="fas fa-exclamation-triangle" style="color:var(--warn)"></i>Erro: ${e.message}</td></tr>`;
    toast(e.message, 'error');
  }
}

/* ── Render table ─────────────────────────────────────────── */
function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  const count = document.getElementById('tableCount');

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-calendar-xmark"></i>Nenhum agendamento encontrado.</td></tr>`;
    count.textContent = '';
    return;
  }

  count.textContent = `${data.length} agendamento${data.length !== 1 ? 's' : ''} encontrado${data.length !== 1 ? 's' : ''}`;

  tbody.innerHTML = data.map(ag => {
    const badge = statusBadge(ag.status);
    const date  = formatDate(ag.data_consulta);
    const canConfirm  = ag.status === 'pendente';
    const canCancel   = ag.status !== 'cancelado';
    return `
      <tr id="row-${ag.id}">
        <td style="color:var(--muted);font-size:.78rem">#${ag.id}</td>
        <td>
          <div style="font-weight:600;font-size:.88rem">${esc(ag.nome_paciente)}</div>
          <div style="font-size:.75rem;color:var(--muted)">${esc(ag.email)}</div>
        </td>
        <td style="font-size:.85rem">${esc(ag.especialidade_nome || '—')}</td>
        <td style="font-size:.85rem">
          <div style="font-weight:600">${date}</div>
          <div style="color:var(--muted);font-size:.78rem">${ag.hora_consulta}</div>
        </td>
        <td style="font-size:.82rem;color:var(--muted)">${esc(ag.telefone)}</td>
        <td>${badge}</td>
        <td>
          <div class="action-btns">
            ${canConfirm ? `<button class="btn btn-success btn-sm" onclick="confirmar(${ag.id})"><i class="fas fa-check"></i>Confirmar</button>` : ''}
            ${canCancel  ? `<button class="btn btn-danger btn-sm" onclick="cancelar(${ag.id})"><i class="fas fa-xmark"></i>Cancelar</button>` : ''}
            ${!canConfirm && !canCancel ? `<span style="font-size:.78rem;color:var(--muted)">—</span>` : ''}
          </div>
          ${ag.mensagem ? `<div style="font-size:.72rem;color:var(--muted);margin-top:4px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(ag.mensagem)}"><i class="fas fa-comment" style="margin-right:4px"></i>${esc(ag.mensagem)}</div>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function statusBadge(status) {
  const map = {
    pendente:   ['badge-pending',   'fa-clock',  'Pendente'],
    confirmado: ['badge-confirmed', 'fa-check',  'Confirmado'],
    cancelado:  ['badge-cancelled', 'fa-xmark',  'Cancelado'],
  };
  const [cls, icon, label] = map[status] || map.pendente;
  return `<span class="badge ${cls}"><i class="fas ${icon}"></i>${label}</span>`;
}

function formatDate(str) {
  if (!str) return '—';
  const [y,m,d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── Stats ────────────────────────────────────────────────── */
async function updateStats(data) {
  // Fetch all (unfiltered) to show global stats
  let all = data;
  if (activeFilter || searchTerm) {
    try {
      const res = await fetch(`${API}/api/agendamentos`, { headers: { 'Authorization': `Bearer ${TOKEN}` } });
      if (res.ok) all = await res.json();
    } catch {}
  }

  const count = s => all.filter(a => a.status === s).length;
  document.getElementById('statTotal').textContent      = all.length;
  document.getElementById('statPendente').textContent   = count('pendente');
  document.getElementById('statConfirmado').textContent = count('confirmado');
  document.getElementById('statCancelado').textContent  = count('cancelado');
}

/* ── Chart ────────────────────────────────────────────────── */
function renderChart(data) {
  const container = document.getElementById('chartBars');
  const counts    = {};
  data.forEach(a => {
    const k = a.especialidade_nome || 'Outros';
    counts[k] = (counts[k] || 0) + 1;
  });

  const entries = Object.entries(counts).sort(([,a],[,b]) => b - a);
  if (!entries.length) {
    container.innerHTML = '<span style="color:var(--muted);font-size:.85rem">Sem dados para exibir</span>';
    return;
  }

  const MAX_H  = 110;
  const MIN_H  = 28;
  const max    = Math.max(...entries.map(([,v]) => v));
  container.innerHTML = entries.map(([name, val]) => {
    const h   = max > 0 ? Math.max(MIN_H, Math.round((val / max) * MAX_H)) : MIN_H;
    const lbl = name.length > 12 ? name.slice(0, 11) + '…' : name;
    return `
      <div class="chart-col">
        <div class="chart-bar-val">${val}</div>
        <div class="chart-bar" style="height:${h}px" title="${name}"></div>
        <div class="chart-bar-lbl" title="${name}">${lbl}</div>
      </div>
    `;
  }).join('');
}

/* ── Actions ──────────────────────────────────────────────── */
async function confirmar(id) {
  if (!confirm('Confirmar este agendamento?')) return;
  try {
    const res = await fetch(`${API}/api/agendamentos/${id}/confirmar`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.erro);
    toast('Agendamento confirmado!');
    loadAgendamentos();
  } catch (e) { toast(e.message, 'error'); }
}

async function cancelar(id) {
  if (!confirm('Cancelar este agendamento? Esta ação não pode ser desfeita.')) return;
  try {
    const res = await fetch(`${API}/api/agendamentos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.erro);
    toast('Agendamento cancelado.', 'warn');
    loadAgendamentos();
  } catch (e) { toast(e.message, 'error'); }
}

/* ── Filters ──────────────────────────────────────────────── */
document.getElementById('filterTabs').addEventListener('click', e => {
  const tab = e.target.closest('.filter-tab');
  if (!tab) return;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  activeFilter = tab.dataset.filter;
  loadAgendamentos();
});

let searchTimeout;
document.getElementById('searchInput').addEventListener('input', e => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchTerm = e.target.value.trim();
    loadAgendamentos();
  }, 350);
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  toast('Lista atualizada!');
  loadAgendamentos();
});

/* ── Init ─────────────────────────────────────────────────── */
loadAgendamentos();
