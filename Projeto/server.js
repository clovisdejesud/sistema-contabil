const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

console.log('Pasta do servidor:', __dirname);
console.log('Pasta estática:', path.join(__dirname, 'sistema-contabil'));

app.use(express.json());
app.use(cors());

// ── ARQUIVOS ESTÁTICOS ──────────────────────────────────────────────
app.use('/sistema-contabil', express.static(path.join(__dirname, 'sistema-contabil')));

app.get('/', (req, res) => {
    res.redirect('/sistema-contabil/login.html');
});

// ── BANCO DE DADOS ──────────────────────────────────────────────────
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'sistema_contabil'
});

db.connect((err) => {
    if (err) { console.error('Erro ao conectar ao MySQL:', err); return; }
    console.log('Conectado ao MySQL!');
    db.query("UPDATE contas_a_pagar SET status = 'Atrasado' WHERE data_vencimento < CURDATE() AND status = 'Pendente'");
});

// ── ROTAS API ───────────────────────────────────────────────────────
app.get('/api/clientes', (req, res) => {
    db.query("SELECT * FROM clientes ORDER BY razao_social ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/clientes', (req, res) => {
    const { razao_social, nome_fantasia, tipo_pessoa, documento,
            inscricao_estadual, email, celular, limite_credito,
            inscricao_municipal, data_nascimento } = req.body;
    const sql = `INSERT INTO clientes (razao_social, nome_fantasia, tipo_pessoa, cnpj, 
                 inscricao_estadual, email, celular, limite_credito, inscricao_municipal, 
                 data_nascimento, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;
    db.query(sql, [razao_social, nome_fantasia, tipo_pessoa, documento,
                   inscricao_estadual, email, celular, limite_credito,
                   inscricao_municipal, data_nascimento], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Cliente cadastrado!', id: result.insertId });
    });
});

app.delete('/api/clientes/:id', (req, res) => {
    db.query('DELETE FROM clientes WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Cliente removido.' });
    });
});

app.get('/api/contas-pagar', (req, res) => {
    db.query("SELECT * FROM contas_a_pagar ORDER BY data_vencimento ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/contas-pagar', (req, res) => {
    const { data_emissao, data_vencimento, descricao, valor, fornecedor, plano_conta_id } = req.body;
    const sql = `INSERT INTO contas_a_pagar (data_emissao, data_vencimento, descricao, valor, fornecedor, status, plano_conta_id) VALUES (?, ?, ?, ?, ?, 'Pendente', ?)`;
    db.query(sql, [data_emissao, data_vencimento, descricao, valor, fornecedor, plano_conta_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Lançamento realizado!' });
    });
});

app.get('/contas', (req, res) => {
    db.query("SELECT * FROM plano_conta ORDER BY codigo_conta ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/lancamentos', (req, res) => {
    const { data_lancamento, id_conta_debito, id_conta_credito, valor, historico } = req.body;
    const sql = `INSERT INTO lancamentos (data_lancamento, id_conta_debito, id_conta_credito, valor, historico) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [data_lancamento, id_conta_debito, id_conta_credito, valor, historico], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Lançamento salvo!' });
    });
});

// ── START ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});