const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.sqlite');

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    initSchema();
    seedData();
    saveDb();
  }

  return db;
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS especialidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      icone TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_paciente TEXT NOT NULL,
      email TEXT NOT NULL,
      telefone TEXT NOT NULL,
      especialidade_id INTEGER NOT NULL,
      data_consulta TEXT NOT NULL,
      hora_consulta TEXT NOT NULL,
      mensagem TEXT,
      status TEXT DEFAULT 'pendente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (especialidade_id) REFERENCES especialidades(id)
    );
  `);
}

function seedData() {
  const especialidades = [
    { nome: 'Clínica Geral', descricao: 'Diagnóstico e tratamento das condições mais comuns do dia a dia, orientando você para o cuidado contínuo da saúde.', icone: 'fa-stethoscope' },
    { nome: 'Pediatria', descricao: 'Acompanhamento especializado no desenvolvimento infantil, vacinas, consultas de rotina e cuidados preventivos.', icone: 'fa-baby' },
    { nome: 'Ginecologia', descricao: 'Saúde da mulher em todas as fases: exames preventivos, planejamento familiar, pré-natal e acompanhamento hormonal.', icone: 'fa-venus' },
    { nome: 'Psicologia', descricao: 'Apoio psicológico para saúde mental, equilíbrio emocional, terapia individual, de casal e online.', icone: 'fa-brain' },
  ];

  const stmt = db.prepare('INSERT INTO especialidades (nome, descricao, icone) VALUES (?, ?, ?)');
  especialidades.forEach(e => stmt.run([e.nome, e.descricao, e.icone]));
  stmt.free();

  // Seed some demo appointments
  const demos = [
    ['Maria Oliveira', 'maria@email.com', '(31) 99999-1111', 1, '2025-06-10', '09:00', 'Consulta de rotina', 'pendente'],
    ['João Silva', 'joao@email.com', '(31) 99999-2222', 2, '2025-06-10', '10:30', 'Acompanhamento pediátrico', 'confirmado'],
    ['Ana Souza', 'ana@email.com', '(31) 99999-3333', 3, '2025-06-11', '14:00', 'Preventivo anual', 'pendente'],
    ['Carlos Mendes', 'carlos@email.com', '(31) 99999-4444', 4, '2025-06-12', '16:00', 'Primeira consulta', 'pendente'],
  ];

  const stmt2 = db.prepare('INSERT INTO agendamentos (nome_paciente, email, telefone, especialidade_id, data_consulta, hora_consulta, mensagem, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  demos.forEach(d => stmt2.run(d));
  stmt2.free();
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Helper: run a query and return rows as objects
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run INSERT/UPDATE/DELETE
function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
  // Get last insert rowid
  const result = query('SELECT last_insert_rowid() as id');
  return result[0]?.id;
}

module.exports = { getDb, query, run, saveDb };
