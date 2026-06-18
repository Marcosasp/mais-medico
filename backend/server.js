const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Init DB then start ──────────────────────────────────────
db.getDb().then(() => {
  console.log('✅ Banco de dados inicializado.');

  // ── Routes ─────────────────────────────────────────────
  app.use('/api/login',          require('./routes/auth'));
  app.use('/api/especialidades', require('./routes/especialidades'));
  app.use('/api/agendamentos',   require('./routes/agendamentos'));

  // Fallback: serve index.html for any unmatched route
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });

  app.listen(PORT, () => {
    console.log(`\n🚀 CuidarBem rodando em http://localhost:${PORT}`);
    console.log(`   Admin: http://localhost:${PORT}/admin.html`);
    console.log(`   Login: admin@cuidarbem.com.br / enfermagem2026\n`);
  });
}).catch(err => {
  console.error('❌ Erro ao inicializar banco:', err);
  process.exit(1);
});
