const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. CONFIGURAÇÃO DO BANCO (Mantenha sua senha aqui)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '12345678',
    database: 'sistema_contabil' 
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err);
        return;
    }
    console.log('Conectado ao Banco de Dados MySQL com sucesso!');
});

// --- INÍCIO DAS ROTAS ---

// Rota de Teste
app.get('/', (req, res) => {
    res.send('Servidor do Sistema ContabilCMRT rodando!');
});

// Rota de Login (POST)
app.post('/login', (req, res) => {
    // ... (código do login que passamos antes)
});

// Rota de Lançamentos (POST)
app.post('/lancamentos', (req, res) => {
    // ... (código de salvar lançamentos)
});

// Rota de Plano de Contas (GET) - ESSA QUE ACABAMOS DE CRIAR
app.get('/contas', (req, res) => {
    const sql = "SELECT id, codigo_conta, nome_conta FROM plano_contas ORDER BY codigo_conta ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Erro ao buscar dados" });
        res.json(results);
    });
});

// --- FIM DAS ROTAS ---

// 2. LIGA O SERVIDOR (Sempre por último)
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});