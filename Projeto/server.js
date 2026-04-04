const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── CONEXÃO COM O BANCO ───────────────────────────────────────────
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'sistema_contabil'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err.message);
        return;
    }
    console.log('Conectado ao MySQL com sucesso!');
});

// ── ROTAS: CLIENTES ───────────────────────────────────────────────
app.get('/api/clientes', (req, res) => {
    db.query("SELECT * FROM clientes ORDER BY razao_social ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/clientes', (req, res) => {
    const {
        razao_social, nome_fantasia, tipo_pessoa, documento,
        inscricao_estadual, inscricao_municipal, email,
        celular, limite_credito, data_nascimento
    } = req.body;

    const sql = `INSERT INTO clientes (
        razao_social, nome_fantasia, tipo_pessoa, documento,
        inscricao_estadual, inscricao_municipal, email,
        celular, limite_credito, data_nascimento
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        razao_social, nome_fantasia, tipo_pessoa, documento,
        inscricao_estadual, inscricao_municipal, email,
        celular, limite_credito, data_nascimento
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Cliente cadastrado!', id: result.insertId });
    });
});

// ── ROTAS: FORNECEDORES ───────────────────────────────────────────
app.get('/api/fornecedores', (req, res) => {
    db.query("SELECT * FROM fornecedores ORDER BY razao_social ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/fornecedores', (req, res) => {
    const {
        razao_social, nome_fantasia, tipo_pessoa, cnpj, cpf,
        inscricao_estadual, inscricao_municipal, regime_tributario,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        email, telefone, nome_contato, ativo
    } = req.body;

    const sql = `INSERT INTO fornecedores (
        razao_social, nome_fantasia, tipo_pessoa, cnpj, cpf,
        inscricao_estadual, inscricao_municipal, regime_tributario,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        email, telefone, nome_contato, ativo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        razao_social, nome_fantasia, tipo_pessoa, cnpj, cpf,
        inscricao_estadual, inscricao_municipal, regime_tributario,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        email, telefone, nome_contato, ativo || 1
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Fornecedor cadastrado!', id: result.insertId });
    });
});

app.delete('/api/fornecedores/:id', (req, res) => {
    db.query("DELETE FROM fornecedores WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Fornecedor excluído!' });
    });
});

// ── ROTAS: PLANO DE CONTAS ────────────────────────────────────────
app.get('/api/plano-contas', (req, res) => {
    db.query("SELECT * FROM plano_conta ORDER BY codigo_conta ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/plano-contas', (req, res) => {
    const { codigo_conta, nome_conta, tipo_conta, natureza } = req.body;
    const sql = `INSERT INTO plano_conta (codigo_conta, nome_conta, tipo_conta, natureza) VALUES (?, ?, ?, ?)`;
    db.query(sql, [codigo_conta, nome_conta, tipo_conta, natureza], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Conta criada!', id: result.insertId });
    });
});

app.delete('/api/plano-contas/:id', (req, res) => {
    db.query("DELETE FROM plano_conta WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Conta excluída!' });
    });
});

// ── START DO SERVIDOR ─────────────────────────────────────────────
// IMPORTANTE: o app.listen sempre deve ser o ÚLTIMO item do arquivo
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});