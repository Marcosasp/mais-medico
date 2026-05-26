const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/especialidades
router.get('/', (req, res) => {
  try {
    const especialidades = db.query('SELECT * FROM especialidades ORDER BY id');
    res.json(especialidades);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar especialidades.' });
  }
});

module.exports = router;
