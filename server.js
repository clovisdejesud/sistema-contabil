const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;

// Configuração do Banco
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678', // Sua senha do MySQL
    database: 'sistema_contabil'
});

// Conexão e Atualização de Status
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('Conectado ao Banco de Dados MySQL com sucesso!');

    const sql = "UPDATE contas_a_pagar SET status = 'Atrasado' WHERE data_vencimento < CURDATE() AND status = 'Pendente'";
    db.query(sql, (err, result) => {
        if (err) console.error("Erro ao atualizar status:", err);
        else console.log("Status de pagamentos atualizados.");
    });
});

// --- ROTAS ---

// Rota para o Plano de Contas
app.get('/contas', (req, res) => {
    const sql = "SELECT * FROM plano_conta ORDER BY codigo_conta ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Rota para Contas a Pagar
app.get('/api/contas-pagar', (req, res) => {
    const sql = "SELECT * FROM contas_a_pagar ORDER BY data_vencimento ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Rota para Salvar Lançamento
app.post('/api/contas-pagar', (req, res) => {
    const { data_emissao, data_vencimento, descricao, valor, fornecedor, plano_conta_id } = req.body;
    const sql = `INSERT INTO contas_a_pagar (data_emissao, data_vencimento, descricao, valor, fornecedor, status, plano_conta_id) VALUES (?, ?, ?, ?, ?, 'Pendente', ?)`;
    db.query(sql, [data_emissao, data_vencimento, descricao, valor, fornecedor, plano_conta_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Lançamento realizado!' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});