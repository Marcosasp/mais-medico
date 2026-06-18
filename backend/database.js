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
    { nome: 'Curativos e Procedimentos', descricao: 'Realização de curativos simples e complexos, retirada de pontos, sondagens e demais procedimentos técnicos no domicílio.', icone: 'fa-bandage' },
    { nome: 'Administração de Medicação', descricao: 'Aplicação segura de medicamentos via oral, intramuscular, subcutânea e endovenosa com prescrição médica.', icone: 'fa-syringe' },
    { nome: 'Home Care', descricao: 'Assistência de enfermagem domiciliar contínua para pacientes acamados, pós-cirúrgicos ou em recuperação prolongada.', icone: 'fa-house-chimney-medical' },
    { nome: 'Monitoramento de Saúde', descricao: 'Aferição de pressão arterial, glicemia, saturação de oxigênio e demais sinais vitais com relatório ao médico responsável.', icone: 'fa-heart-pulse' },
    { nome: 'Vacinação', descricao: 'Aplicação de vacinas do calendário adulto e infantil no conforto do seu lar, com registro e orientação completos.', icone: 'fa-shield-virus' },
    { nome: 'Orientação em Saúde', descricao: 'Educação em saúde para pacientes e familiares: cuidados preventivos, higiene, alimentação e uso correto de medicamentos.', icone: 'fa-book-medical' },
  ];

  const stmt = db.prepare('INSERT INTO especialidades (nome, descricao, icone) VALUES (?, ?, ?)');
  especialidades.forEach(e => stmt.run([e.nome, e.descricao, e.icone]));
  stmt.free();

  // Seed some demo appointments
  const demos = [
    ['Maria Oliveira', 'maria@email.com', '(31) 99999-1111', 1, '2026-06-22', '09:00', 'Curativo pós-cirúrgico', 'pendente'],
    ['João Silva', 'joao@email.com', '(31) 99999-2222', 4, '2026-06-22', '10:30', 'Monitoramento de pressão arterial', 'confirmado'],
    ['Ana Souza', 'ana@email.com', '(31) 99999-3333', 2, '2026-06-23', '14:00', 'Aplicação de insulina', 'pendente'],
    ['Carlos Mendes', 'carlos@email.com', '(31) 99999-4444', 3, '2026-06-24', '16:00', 'Paciente acamado — avaliação inicial', 'pendente'],
    ['Patrícia Lima', 'patricia@email.com', '(31) 99999-5555', 5, '2026-06-25', '08:00', 'Vacina da gripe', 'confirmado'],
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
