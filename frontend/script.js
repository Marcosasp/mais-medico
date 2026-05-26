/* ═══════════════════════════════════════════════════════════
   MAIS MÉDICOS — script.js  (página pública)
   ═══════════════════════════════════════════════════════════ */

const API = ''; // same origin when served by Express

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
const html = document.documentElement;
const saved = localStorage.getItem('mm-theme') || 'light';
html.setAttribute('data-theme', saved);
updateThemeIcon(saved);

document.getElementById('themeToggle').addEventListener('click', () => {
  const cur = html.getAttribute('data-theme');
  const next = cur === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('mm-theme', next);
  updateThemeIcon(next);
});
function updateThemeIcon(t) {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.innerHTML = t === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

/* ── Mobile menu ──────────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
function closeMobile() {
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
}
document.querySelectorAll('.mobile-menu a').forEach(a => a.addEventListener('click', closeMobile));

/* ── Smooth scroll ────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); closeMobile(); }
  });
});

/* ── Active nav link ──────────────────────────────────────── */
const navLinks = document.querySelectorAll('nav a[href^="#"]');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`nav a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('section[id]').forEach(s => observer.observe(s));

/* ── Reveal on scroll ─────────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── Load especialidades ──────────────────────────────────── */
const iconColors = ['c1','c2','c3','c4'];

async function loadEspecialidades() {
  const grid = document.getElementById('specsGrid');
  const selectEl = document.getElementById('especialidade');
  try {
    const res = await fetch(`${API}/api/especialidades`);
    if (!res.ok) throw new Error('Falha na requisição');
    const data = await res.json();

    grid.innerHTML = '';
    data.forEach((esp, i) => {
      const card = document.createElement('div');
      card.className = 'spec-card reveal';
      card.innerHTML = `
        <div class="spec-icon ${iconColors[i % 4]}"><i class="fas ${esp.icone}"></i></div>
        <h3>${esp.nome}</h3>
        <p>${esp.descricao}</p>
        <a class="spec-link" href="#contato">Agendar <i class="fas fa-arrow-right"></i></a>
      `;
      grid.appendChild(card);
      setTimeout(() => card.classList.add('visible'), i * 100);

      const opt = document.createElement('option');
      opt.value = esp.id;
      opt.textContent = esp.nome;
      selectEl?.appendChild(opt);
    });
  } catch (e) {
    grid.innerHTML = '<div class="spec-loading"><i class="fas fa-exclamation-triangle" style="color:var(--warn)"></i> Erro ao carregar especialidades. Verifique se o servidor está rodando.</div>';
    // Fallback estático
    const fallback = [
      { id:1, nome:'Clínica Geral', icone:'fa-stethoscope' },
      { id:2, nome:'Pediatria', icone:'fa-baby' },
      { id:3, nome:'Ginecologia', icone:'fa-venus' },
      { id:4, nome:'Psicologia', icone:'fa-brain' },
    ];
    fallback.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.nome;
      selectEl?.appendChild(opt);
    });
  }
}
loadEspecialidades();

/* ── Phone mask ───────────────────────────────────────────── */
document.getElementById('telefone')?.addEventListener('input', function() {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 2)  v = '(' + v.slice(0,2) + ') ' + v.slice(2);
  if (v.length > 10) v = v.slice(0,10) + '-' + v.slice(10);
  this.value = v;
});

/* ── Set min date ─────────────────────────────────────────── */
const dataInput = document.getElementById('data');
if (dataInput) {
  const today = new Date().toISOString().split('T')[0];
  dataInput.min = today;
}

/* ── Form ─────────────────────────────────────────────────── */
document.getElementById('contactForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  clearErrors();

  const nome         = document.getElementById('nome');
  const email        = document.getElementById('email');
  const telefone     = document.getElementById('telefone');
  const especialidade = document.getElementById('especialidade');
  const data         = document.getElementById('data');
  const hora         = document.getElementById('hora');
  const mensagem     = document.getElementById('mensagem');

  let valid = true;
  if (!nome.value.trim())          { showError(nome, 'Informe seu nome.'); valid = false; }
  if (!email.value.trim())         { showError(email, 'Informe seu e-mail.'); valid = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { showError(email, 'E-mail inválido.'); valid = false; }
  if (!telefone.value.trim())      { showError(telefone, 'Informe seu telefone.'); valid = false; }
  if (!especialidade.value)        { showError(especialidade, 'Selecione uma especialidade.'); valid = false; }
  if (!data.value)                 { showError(data, 'Selecione uma data.'); valid = false; }
  if (!hora.value)                 { showError(hora, 'Selecione um horário.'); valid = false; }
  if (!valid) return;

  const btn = document.getElementById('submitBtn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>Enviando...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/api/agendamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_paciente:   nome.value.trim(),
        email:           email.value.trim(),
        telefone:        telefone.value.trim(),
        especialidade_id: parseInt(especialidade.value),
        data_consulta:   data.value,
        hora_consulta:   hora.value,
        mensagem:        mensagem.value.trim()
      })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.erro || 'Erro desconhecido');

    document.getElementById('formWrapper').style.display = 'none';
    document.getElementById('formSuccess').style.display = 'block';

  } catch (err) {
    toast(err.message, 'error');
    btn.innerHTML = '<i class="fas fa-paper-plane"></i>Enviar solicitação';
    btn.disabled = false;
  }
});

function showError(field, msg) {
  field.classList.add('field-error');
  const p = document.createElement('p');
  p.className = 'error-msg';
  p.textContent = msg;
  field.parentNode.appendChild(p);
}
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(f => f.classList.remove('field-error'));
  document.querySelectorAll('.error-msg').forEach(e => e.remove());
}
function resetForm() {
  document.getElementById('contactForm').reset();
  const btn = document.getElementById('submitBtn');
  btn.innerHTML = '<i class="fas fa-paper-plane"></i>Enviar solicitação';
  btn.disabled = false;
  document.getElementById('formWrapper').style.display = 'block';
  document.getElementById('formSuccess').style.display = 'none';
}
