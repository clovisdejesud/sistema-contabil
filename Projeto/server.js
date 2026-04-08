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



// ── ROTAS: FORNECEDORES ───────────────────────────────────────────
app.get('/api/fornecedores', (req, res) => {
    db.query("SELECT * FROM fornecedores ORDER BY razao_social ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
// ── ROTA: POST FORNECEDORES (versão corrigida e única) ────────────
app.post('/api/fornecedores', (req, res) => {
    let {
        razao_social, nome_fantasia, tipo_pessoa, cnpj, cpf,
        inscricao_estadual, inscricao_municipal, regime_tributario,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        email, telefone, nome_contato, ativo
    } = req.body;

    // 🔥 NORMALIZAÇÃO: string vazia → null (evita Duplicate entry '')
    cpf  = (cpf  && cpf.trim()  !== '') ? cpf.trim()  : null;
    cnpj = (cnpj && cnpj.trim() !== '') ? cnpj.trim() : null;

    // 🔒 VALIDAÇÃO
    if (tipo_pessoa === 'JURIDICA' && !cnpj)
        return res.status(400).json({ error: 'CNPJ é obrigatório para Pessoa Jurídica.' });

    if (tipo_pessoa === 'FISICA' && !cpf)
        return res.status(400).json({ error: 'CPF é obrigatório para Pessoa Física.' });

    const sql = `
        INSERT INTO fornecedores (
            razao_social, nome_fantasia, tipo_pessoa, cnpj, cpf,
            inscricao_estadual, inscricao_municipal, regime_tributario,
            cep, logradouro, numero, complemento, bairro, cidade, estado,
            email, telefone, nome_contato, ativo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        razao_social, nome_fantasia, tipo_pessoa, cnpj, cpf,
        inscricao_estadual || null, inscricao_municipal || null, regime_tributario,
        cep || null, logradouro || null, numero || null, complemento || null,
        bairro || null, cidade || null, estado || null,
        email || null, telefone || null, nome_contato || null,
        ativo !== undefined ? ativo : 1
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('ERRO MYSQL (fornecedor):', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Fornecedor cadastrado!', id: result.insertId });
    });
});

// ── ROTAS: CLIENTES ───────────────────────────────────────────────
app.get('/api/clientes', (req, res) => {
    db.query("SELECT * FROM clientes ORDER BY razao_social ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/fornecedores', (req, res) => {
    let {
        razao_social, nome_fantasia, tipo_pessoa, cnpj, cpf,
        inscricao_estadual, inscricao_municipal, regime_tributario,
        cep, logradouro, numero, complemento, bairro, cidade, estado,
        email, telefone, nome_contato, ativo
    } = req.body;

    // 🔥 NORMALIZAÇÃO (ESSENCIAL)
    cpf = cpf && cpf.trim() !== "" ? cpf : null;
    cnpj = cnpj && cnpj.trim() !== "" ? cnpj : null;

    // 🔒 VALIDAÇÃO CORRETA
    if (tipo_pessoa === "JURIDICA" && !cnpj) {
        return res.status(400).json({ error: "CNPJ é obrigatório para pessoa jurídica" });
    }

    if (tipo_pessoa === "FISICA" && !cpf) {
        return res.status(400).json({ error: "CPF é obrigatório para pessoa física" });
    }

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
        if (err) {
            console.error("ERRO MYSQL:", err); // 👈 IMPORTANTE
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Fornecedor cadastrado!', id: result.insertId });
    });
});

app.delete('/api/clientes/:id', (req, res) => {
    db.query("DELETE FROM clientes WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Cliente excluído!' });
    });
});

// ── ROTA: POST CLIENTES (estava faltando!) ────────────────────────
app.post('/api/clientes', (req, res) => {
    let {
        razao_social, nome_fantasia, tipo_pessoa, cnpj, cpf,
        inscricao_estadual, inscricao_municipal, email,
        celular, telefone, limite_credito, data_nascimento, ativo
    } = req.body;

    // Normalização
    cpf  = (cpf  && cpf.trim()  !== '') ? cpf.trim()  : null;
    cnpj = (cnpj && cnpj.trim() !== '') ? cnpj.trim() : null;

    if (!razao_social)
        return res.status(400).json({ error: 'Razão Social é obrigatória.' });

    const sql = `
        INSERT INTO clientes (
            razao_social, nome_fantasia, tipo_pessoa, cnpj, cpf,
            inscricao_estadual, inscricao_municipal, email,
            celular, telefone, limite_credito, data_nascimento, ativo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        razao_social, nome_fantasia || null, tipo_pessoa, cnpj, cpf,
        inscricao_estadual || null, inscricao_municipal || null,
        email || null, celular || null, telefone || null,
        limite_credito || 0,
        data_nascimento || null,
        ativo !== undefined ? ativo : 1
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('ERRO MYSQL (cliente):', err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Cliente cadastrado!', id: result.insertId });
    });
});

// ── ROTAS: PLANO DE CONTAS ────────────────────────────────────────

app.get('/api/plano-contas', (req, res) => {
    db.query('SELECT * FROM plano_contas ORDER BY codigo_conta ASC', (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result);
    });
});
//Contas a pagar
// ── ROTAS: CONTAS A PAGAR ─────────────────────────────────────────
// GET - Listar contas a pagar
app.get('/api/contas-pagar', (req, res) => {
    // Usamos um LEFT JOIN para buscar a razao_social do fornecedor usando o fornecedor_id
    // Assim o front-end recebe 'conta.fornecedor' corretamente com o nome, e não apenas um número
    const sql = `
        SELECT 
            cp.*, 
            f.razao_social AS fornecedor 
        FROM contas_pagar cp
        LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
        ORDER BY cp.data_vencimento ASC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao listar contas a pagar:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// POST - Criar nova conta a pagar
app.post('/api/contas-pagar', (req, res) => {
    // Recebendo estritamente o que a tabela suporta
    const {
        id_lancamento,   // Obrigatório (int NO)
        fornecedor_id,   // Opcional (bigint YES)
        descricao,       // Opcional (text YES)
        valor,           // Obrigatório (decimal NO)
        data_emissao,    // Obrigatório (date NO)
        data_vencimento, // Obrigatório (date NO)
        status           // Opcional (enum YES)
    } = req.body;

    // Verificação de segurança para os campos obrigatórios do banco (NOT NULL)
    if (!id_lancamento || !valor || !data_emissao || !data_vencimento) {
        return res.status(400).json({ 
            error: "Campos obrigatórios faltando: id_lancamento, valor, data_emissao ou data_vencimento." 
        });
    }

    const sql = `
        INSERT INTO contas_pagar (
            id_lancamento, 
            fornecedor_id, 
            descricao, 
            valor, 
            data_emissao, 
            data_vencimento, 
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        id_lancamento,
        fornecedor_id || null, // Se vier vazio, salva como NULL no banco
        descricao || null,
        valor,
        data_emissao,
        data_vencimento,
        status || 'Pendente' // Usa exatamente a capitalização do seu banco (enum)
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Erro ao cadastrar conta a pagar:", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Conta registrada com sucesso!', id: result.insertId });
    });
});

// ── START DO SERVIDOR ─────────────────────────────────────────────
// IMPORTANTE: o app.listen sempre deve ser o ÚLTIMO item do arquivo
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});