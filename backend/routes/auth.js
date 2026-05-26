const express = require('express');
const router = express.Router();

const ADMIN_EMAIL = 'admin@maismedicos.com';
const ADMIN_SENHA = 'medicina2025';
const FAKE_TOKEN = 'mm-admin-token-2025-secure';

// POST /api/login
router.post('/', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  if (email.toLowerCase() === ADMIN_EMAIL && senha === ADMIN_SENHA) {
    return res.json({
      sucesso: true,
      token: FAKE_TOKEN,
      usuario: { nome: 'Administrador', email: ADMIN_EMAIL }
    });
  }

  return res.status(401).json({ erro: 'Credenciais inválidas.' });
});

module.exports = router;
module.exports.FAKE_TOKEN = FAKE_TOKEN;
