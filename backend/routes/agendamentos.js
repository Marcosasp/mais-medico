const express = require('express');
const router = express.Router();
const db = require('../database');
const { FAKE_TOKEN } = require('./auth');

// Middleware de autenticação admin
function requireAdmin(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '').trim();
  if (token !== FAKE_TOKEN) {
    return res.status(401).json({ erro: 'Acesso não autorizado.' });
  }
  next();
}

// Sanitiza string simples
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>"'`]/g, '').trim().slice(0, 500);
}

// POST /api/agendamentos — público
router.post('/', (req, res) => {
  let { nome_paciente, email, telefone, especialidade_id, data_consulta, hora_consulta, mensagem } = req.body;

  nome_paciente  = sanitize(nome_paciente);
  email          = sanitize(email);
  telefone       = sanitize(telefone);
  mensagem       = sanitize(mensagem || '');
  especialidade_id = parseInt(especialidade_id);
  data_consulta  = sanitize(data_consulta);
  hora_consulta  = sanitize(hora_consulta);

  // Validação
  if (!nome_paciente || !email || !telefone || !especialidade_id || !data_consulta || !hora_consulta) {
    return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ erro: 'E-mail inválido.' });
  }

  // Verificar conflito de horário
  const conflito = db.query(
    `SELECT id FROM agendamentos
     WHERE especialidade_id = ? AND data_consulta = ? AND hora_consulta = ? AND status != 'cancelado'`,
    [especialidade_id, data_consulta, hora_consulta]
  );
  if (conflito.length > 0) {
    return res.status(409).json({ erro: 'Já existe um agendamento neste horário para esta especialidade. Escolha outro horário.' });
  }

  try {
    const id = db.run(
      `INSERT INTO agendamentos (nome_paciente, email, telefone, especialidade_id, data_consulta, hora_consulta, mensagem, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')`,
      [nome_paciente, email, telefone, especialidade_id, data_consulta, hora_consulta, mensagem]
    );

    // Simula envio de e-mail
    console.log(`\n📧 [EMAIL SIMULADO] Agendamento #${id} recebido de ${nome_paciente} (${email}) para ${data_consulta} às ${hora_consulta}\n`);

    res.status(201).json({ sucesso: true, id, mensagem: 'Agendamento realizado com sucesso! Entraremos em contato para confirmação.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar agendamento.' });
  }
});

// GET /api/agendamentos — admin
router.get('/', requireAdmin, (req, res) => {
  try {
    const { status, busca } = req.query;
    let sql = `
      SELECT a.*, e.nome AS especialidade_nome
      FROM agendamentos a
      LEFT JOIN especialidades e ON a.especialidade_id = e.id
    `;
    const params = [];
    const conditions = [];

    if (status && ['pendente','confirmado','cancelado'].includes(status)) {
      conditions.push('a.status = ?');
      params.push(status);
    }
    if (busca) {
      conditions.push('(a.nome_paciente LIKE ? OR a.email LIKE ?)');
      params.push(`%${busca}%`, `%${busca}%`);
    }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY a.data_consulta DESC, a.hora_consulta DESC';

    const rows = db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar agendamentos.' });
  }
});

// DELETE /api/agendamentos/:id — admin
router.delete('/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const exist = db.query('SELECT id FROM agendamentos WHERE id = ?', [id]);
    if (!exist.length) return res.status(404).json({ erro: 'Agendamento não encontrado.' });

    db.run("UPDATE agendamentos SET status = 'cancelado' WHERE id = ?", [id]);
    console.log(`\n🚫 [EMAIL SIMULADO] Agendamento #${id} cancelado.\n`);
    res.json({ sucesso: true, mensagem: 'Agendamento cancelado.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao cancelar agendamento.' });
  }
});

// PUT /api/agendamentos/:id/confirmar — admin
router.put('/:id/confirmar', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const rows = db.query('SELECT * FROM agendamentos WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ erro: 'Agendamento não encontrado.' });

    db.run("UPDATE agendamentos SET status = 'confirmado' WHERE id = ?", [id]);
    const ag = rows[0];
    console.log(`\n✅ [EMAIL SIMULADO] Agendamento #${id} confirmado! Paciente: ${ag.nome_paciente} (${ag.email}), Data: ${ag.data_consulta} às ${ag.hora_consulta}\n`);
    res.json({ sucesso: true, mensagem: 'Agendamento confirmado.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao confirmar agendamento.' });
  }
});

module.exports = router;
