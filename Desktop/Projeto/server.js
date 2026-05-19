const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const util = require('util');

const app = express();
app.use(cors());
app.use(express.json());

// ── CONEXÃO COM O BANCO ───────────────────────────────────────────
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'fatec#2025',
    database: 'sistema_contabil',
    port: 3306,
    charset: 'utf8mb4'
});

// ✅ DEPOIS
db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:');
        console.error('  Código  :', err.code);
        console.error('  Mensagem:', err.message);
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

app.get('/api/fornecedores', (req, res) => {
    db.query("SELECT * FROM fornecedores ORDER BY razao_social ASC", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/dashboard', async (req, res) => {
    const promiseDb = db.promise();
    const query = promiseDb.query.bind(promiseDb);

    try {
        const [contasPagar] = await query('SELECT COUNT(*) AS total, COALESCE(SUM(valor), 0) AS total_valor FROM contas_pagar');
        const [vendas] = await query(`
            SELECT COALESCE(SUM(
                CASE WHEN pc.codigo_conta LIKE '3.%' OR pc.codigo_conta = '3' THEN
                    CASE WHEN l.id_conta_credito = pc.id THEN l.valor ELSE 0 END -
                    CASE WHEN l.id_conta_debito = pc.id THEN l.valor ELSE 0 END
                ELSE 0 END
            ), 0) AS total_vendas
            FROM plano_contas pc
            LEFT JOIN lancamentos l ON l.id_conta_debito = pc.id OR l.id_conta_credito = pc.id
            WHERE pc.codigo_conta LIKE '3.%' OR pc.codigo_conta = '3'
        `);
        const [saldoCaixa] = await query(`
            SELECT COALESCE(SUM(
                CASE WHEN l.id_conta_debito = pc.id THEN l.valor
                     WHEN l.id_conta_credito = pc.id THEN -l.valor
                     ELSE 0 END
            ), 0) AS saldo_caixa
            FROM plano_contas pc
            LEFT JOIN lancamentos l ON l.id_conta_debito = pc.id OR l.id_conta_credito = pc.id
            WHERE pc.codigo_conta LIKE '1.1.%' OR pc.codigo_conta = '1.1'
        `);

        const [monthlyRows] = await query(`
            SELECT
                DATE_FORMAT(l.data_lancamento, '%Y-%m') AS periodo,
                pc.codigo_conta,
                COALESCE(SUM(CASE WHEN l.id_conta_credito = pc.id THEN l.valor ELSE 0 END), 0) AS total_credito,
                COALESCE(SUM(CASE WHEN l.id_conta_debito = pc.id THEN l.valor ELSE 0 END), 0) AS total_debito
            FROM lancamentos l
            JOIN plano_contas pc ON l.id_conta_debito = pc.id OR l.id_conta_credito = pc.id
            WHERE pc.codigo_conta LIKE '3.%' OR pc.codigo_conta = '3'
               OR pc.codigo_conta LIKE '4.%' OR pc.codigo_conta = '4'
            GROUP BY periodo, pc.codigo_conta
            ORDER BY periodo ASC
        `);

        const meses = [];
        const receitasOperacionais = {};
        const outrasReceitas = {};
        const custoMercadoria = {};
        const despesasOperacionais = {};
        const outrasDespesas = {};

        monthlyRows.forEach(row => {
            const periodo = row.periodo;
            if (!meses.includes(periodo)) meses.push(periodo);

            const codigo = String(row.codigo_conta || '');
            const credito = parseFloat(row.total_credito) || 0;
            const debito = parseFloat(row.total_debito) || 0;
            const valor = codigo.startsWith('3') ? credito - debito : debito - credito;

            if (codigo.startsWith('3.1') || codigo === '3.1') {
                receitasOperacionais[periodo] = (receitasOperacionais[periodo] || 0) + valor;
            } else if (codigo.startsWith('3.2') || codigo === '3.2') {
                outrasReceitas[periodo] = (outrasReceitas[periodo] || 0) + valor;
            } else if (codigo.startsWith('3')) {
                receitasOperacionais[periodo] = (receitasOperacionais[periodo] || 0) + valor;
            } else if (codigo.startsWith('4.1') || codigo === '4.1') {
                custoMercadoria[periodo] = (custoMercadoria[periodo] || 0) + valor;
            } else if (codigo.startsWith('4.2') || codigo === '4.2') {
                outrasDespesas[periodo] = (outrasDespesas[periodo] || 0) + valor;
            } else if (codigo.startsWith('4')) {
                despesasOperacionais[periodo] = (despesasOperacionais[periodo] || 0) + valor;
            }
        });

        res.json({
            total_vendas: parseFloat(vendas[0].total_vendas) || 0,
            total_contas_pagar: contasPagar[0].total,
            total_contas_pagar_valor: parseFloat(contasPagar[0].total_valor) || 0,
            saldo_caixa: parseFloat(saldoCaixa[0].saldo_caixa) || 0,
            evolucao_periodos: meses,
            evolucao_receitas_operacionais: meses.map(m => receitasOperacionais[m] || 0),
            evolucao_outras_receitas: meses.map(m => outrasReceitas[m] || 0),
            evolucao_custo_mercadoria: meses.map(m => custoMercadoria[m] || 0),
            evolucao_despesas_operacionais: meses.map(m => despesasOperacionais[m] || 0),
            evolucao_outras_despesas: meses.map(m => outrasDespesas[m] || 0)
        });
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/fornecedores', (req, res) => {
    console.log("BODY RECEBIDO:", JSON.stringify(req.body));
    let {
        razao_social, nome_fantasia, tipo_pessoa, cnpj, cpf,
        inscricao_estadual, inscricao_municipal, regime_tributario,
        email, telefone, nome_contato, ativo
    } = req.body;

    // 👇 INSIRA AQUI, logo abaixo da desestruturação do req.body
    tipo_pessoa = tipo_pessoa ? tipo_pessoa.toUpperCase().trim() : tipo_pessoa;

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
        email, telefone, nome_contato, ativo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        razao_social, nome_fantasia, tipo_pessoa, cnpj, cpf,
        inscricao_estadual, inscricao_municipal, regime_tributario,
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
app.delete('/api/fornecedores/:id', (req, res) => {
    db.query("DELETE FROM fornecedores WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Fornecedor excluído!' });
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
    cpf = (cpf && cpf.trim() !== '') ? cpf.trim() : null;
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


// ── ROTAS: ENDEREÇOS ──────────────────────────────────────────────
app.post('/api/enderecos', (req, res) => {
    const { id_cliente, id_fornecedor, logradouro, numero, bairro, cep, cidade, estado } = req.body;

    if (!id_cliente && !id_fornecedor) {
        return res.status(400).json({ error: "ID do cliente ou fornecedor é obrigatório para cadastrar endereço." });
    }

    const sql = `
        INSERT INTO enderecos (
            id_cliente, id_fornecedor, logradouro, numero, bairro, cep, cidade, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [id_cliente || null, id_fornecedor || null, logradouro, numero, bairro, cep, cidade, estado];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Erro ao cadastrar endereço:", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Endereço cadastrado com sucesso!', id: result.insertId });
    });
});

// ── ROTAS: LANÇAMENTOS CONTÁBEIS ──────────────────────────────────

// GET - Listar lançamentos
app.get('/api/lancamentos', (req, res) => {
    const sql = `
        SELECT 
            l.*,
            dc.nome_conta AS nome_conta_debito,
            cc.nome_conta AS nome_conta_credito
        FROM lancamentos l
        LEFT JOIN plano_contas dc ON l.id_conta_debito = dc.id
        LEFT JOIN plano_contas cc ON l.id_conta_credito = cc.id
        ORDER BY l.data_lancamento DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao listar lançamentos:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// POST - Criar novo lançamento

app.post('/api/lancamentos', (req, res) => {
    const {
        data_lancamento,
        conta_debito,
        conta_credito,
        valor,
        fornecedor,
        fornecedor_id,
        historico
    } = req.body;

    if (!data_lancamento || !conta_debito || !conta_credito || !valor) {
        return res.status(400).json({
            error: "Campos obrigatórios faltando"
        });
    }

    const buscarContaId = (codigo, callback) => {
        db.query(
            'SELECT id FROM plano_contas WHERE codigo_conta = ?',
            [codigo],
            (err, result) => {
                if (err) return callback(err);
                if (result.length === 0) return callback(new Error('Conta não encontrada para código: ' + codigo));
                callback(null, result[0].id);
            }
        );
    };

    buscarContaId(conta_debito, (err, idDebito) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        buscarContaId(conta_credito, (err2, idCredito) => {
            if (err2) {
                return res.status(500).json({ error: err2.message });
            }

            const sql = `
                INSERT INTO lancamentos (
                    data_lancamento,
                    id_conta_debito,
                    id_conta_credito,
                    valor,
                    historico,
                    fornecedor_id
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            const values = [
                data_lancamento,
                idDebito,
                idCredito,
                valor,
                historico || null,
                fornecedor_id || null
            ];

            db.query(sql, values, (err3, result) => {
                if (err3) {
                    console.error('Erro ao cadastrar lançamento:', err3);
                    return res.status(500).json({ error: err3.message });
                }

                const idLancamento = result.insertId;
                popularDiario(idLancamento);
                
                // Passar os dados com IDs resolvidos
                const dadosParaPagar = {
                    ...req.body,
                    id_conta_credito: idCredito,
                    id_conta_debito: idDebito
                };
                verificarEcriarContaPagar(idLancamento, dadosParaPagar);

                res.status(201).json({
                    message: 'Lançamento registrado com sucesso!',
                    id: idLancamento
                });
            });
        });
    });
});
// ── FUNÇÃO AUXILIAR: Criar automaticamente conta a pagar ──────────
function verificarEcriarContaPagar(idLancamento, dadosLancamento) {
    const {
        id_conta_credito,
        valor,
        data_lancamento,
        data_vencimento,
        data_emissao,
        fornecedor
    } = dadosLancamento;

    // Verificar se a conta de crédito é de "Contas a Pagar"
    // Você pode adaptar essa lógica de acordo com suas contas (ex: código 210 ou descrição contém "Pagar")
    db.query(
        'SELECT * FROM plano_contas WHERE id = ? AND (descricao LIKE "%pagar%" OR descricao LIKE "%débito%")',
        [id_conta_credito],
        (err, results) => {
            if (err) {
                console.error("Erro ao verificar conta:", err);
                return;
            }

            // Se a conta for de contas a pagar, criar o registro
            if (results && results.length > 0) {
                // Obter ID do fornecedor pelo nome (se existir)
                db.query(
                    'SELECT id FROM fornecedores WHERE razao_social = ? LIMIT 1',
                    [fornecedor],
                    (err, fornecedoresResults) => {
                        const fornecedor_id = fornecedoresResults && fornecedoresResults.length > 0 
                            ? fornecedoresResults[0].id 
                            : null;

                        const sqlContaPagar = `
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

                        const valuesContaPagar = [
                            idLancamento,
                            fornecedor_id,
                            dadosLancamento.historico || `Lançamento de pagamento`,
                            valor,
                            data_emissao || data_lancamento,
                            data_vencimento || data_lancamento,
                            'Pendente'
                        ];

                        db.query(sqlContaPagar, valuesContaPagar, (err) => {
                            if (err) {
                                console.error("Aviso: Não foi possível criar conta a pagar automática:", err);
                                // Não retorna erro, pois o lançamento foi criado com sucesso
                            } else {
                                console.log("✅ Conta a pagar criada automaticamente!");
                            }
                        });
                    }
                );
            }
        }
    );
}

function popularDiario(idLancamento) {
    const createTableSql = `
        CREATE TABLE IF NOT EXISTS diarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            id_lancamento INT NOT NULL,
            data_lancamento DATE NOT NULL,
            id_conta_debito INT NOT NULL,
            id_conta_credito INT NOT NULL,
            valor DECIMAL(15,2) NOT NULL,
            historico TEXT,
            fornecedor_id BIGINT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_diario_lancamento (id_lancamento)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    db.query(createTableSql, (err) => {
        if (err) {
            console.error('Erro ao criar tabela diarios:', err);
            return;
        }

        const insertSql = `
            INSERT IGNORE INTO diarios (
                id_lancamento,
                data_lancamento,
                id_conta_debito,
                id_conta_credito,
                valor,
                historico,
                fornecedor_id
            )
            SELECT
                l.id,
                l.data_lancamento,
                l.id_conta_debito,
                l.id_conta_credito,
                l.valor,
                l.historico,
                l.fornecedor_id
            FROM lancamentos l
            WHERE l.id = ?
        `;

        db.query(insertSql, [idLancamento], (err) => {
            if (err) {
                console.error('Erro ao popular registro de diário:', err);
            }
        });
    });
}

// ── ROTA: Gerar contas a pagar a partir de lançamentos existentes ──
app.post('/api/gerar-contas-pagar', (req, res) => {
    // Este endpoint permite popular contas a pagar com base em lançamentos existentes
    const sql = `
        SELECT DISTINCT
            l.id,
            l.data_lancamento,
            l.id_conta_credito,
            l.valor,
            l.fornecedor,
            l.historico,
            f.id AS fornecedor_id
        FROM lancamentos l
        LEFT JOIN fornecedores f ON l.fornecedor = f.razao_social
        WHERE l.id_conta_credito IN (
            SELECT id FROM plano_contas 
            WHERE descricao LIKE '%pagar%' OR descricao LIKE '%débito%'
        )
        AND l.id NOT IN (SELECT id_lancamento FROM contas_pagar)
        ORDER BY l.data_lancamento DESC
    `;

    db.query(sql, (err, lancamentosNaoProcessados) => {
        if (err) {
            console.error("Erro ao buscar lançamentos:", err);
            return res.status(500).json({ error: err.message });
        }

        if (lancamentosNaoProcessados.length === 0) {
            return res.json({ message: 'Nenhum lançamento pendente para popular contas a pagar' });
        }

        let processados = 0;
        let erros = [];

        lancamentosNaoProcessados.forEach(lancamento => {
            const sqlInsert = `
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

            db.query(sqlInsert, [
                lancamento.id,
                lancamento.fornecedor_id || null,
                lancamento.historico || 'Lançamento de contas a pagar',
                lancamento.valor,
                lancamento.data_lancamento,
                lancamento.data_lancamento,
                'Pendente'
            ], (err) => {
                if (err) {
                    erros.push({ lancamento_id: lancamento.id, erro: err.message });
                } else {
                    processados++;
                }
            });
        });

        // Aguardar um pouco para garantir que todas as queries sejam processadas
        setTimeout(() => {
            res.json({
                message: `Contas a pagar geradas com sucesso!`,
                processados: processados,
                total: lancamentosNaoProcessados.length,
                erros: erros
            });
        }, 500);
    });
});

// ── ROTAS: DIÁRIOS ────────────────────────────────────────────────

app.post('/api/diarios/popular', (req, res) => {
    const createTableSql = `
        CREATE TABLE IF NOT EXISTS diarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            id_lancamento INT NOT NULL,
            data_lancamento DATE NOT NULL,
            id_conta_debito INT NOT NULL,
            id_conta_credito INT NOT NULL,
            valor DECIMAL(15,2) NOT NULL,
            historico TEXT,
            fornecedor_id BIGINT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_diario_lancamento (id_lancamento)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    db.query(createTableSql, (err) => {
        if (err) {
            console.error('Erro ao criar tabela diarios:', err);
            return res.status(500).json({ error: err.message });
        }

        const insertSql = `
            INSERT IGNORE INTO diarios (
                id_lancamento,
                data_lancamento,
                id_conta_debito,
                id_conta_credito,
                valor,
                historico,
                fornecedor_id
            )
            SELECT
                l.id,
                l.data_lancamento,
                l.id_conta_debito,
                l.id_conta_credito,
                l.valor,
                l.historico,
                l.fornecedor_id
            FROM lancamentos l
            LEFT JOIN diarios d ON d.id_lancamento = l.id
            WHERE d.id_lancamento IS NULL
        `;

        db.query(insertSql, (err, result) => {
            if (err) {
                console.error('Erro ao popular diários:', err);
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: 'Diários populados com sucesso!',
                inseridos: result.affectedRows
            });
        });
    });
});

app.get('/api/diarios', (req, res) => {
    const sql = `
        SELECT
            d.*,
            f.razao_social AS fornecedor,
            pd.nome_conta AS conta_debito,
            pc.nome_conta AS conta_credito
        FROM diarios d
        LEFT JOIN fornecedores f ON d.fornecedor_id = f.id
        LEFT JOIN plano_contas pd ON d.id_conta_debito = pd.id
        LEFT JOIN plano_contas pc ON d.id_conta_credito = pc.id
        ORDER BY d.data_lancamento ASC, d.id ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao listar diários:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// ── ROTA: DRE ─────────────────────────────────────────────────────
app.get('/api/dre', (req, res) => {
    const sql = `
        SELECT
            pc.id,
            pc.codigo_conta,
            pc.nome_conta,
            pc.tipo_conta,
            COALESCE(SUM(CASE WHEN l.id_conta_debito  = pc.id THEN l.valor ELSE 0 END), 0) AS total_debito,
            COALESCE(SUM(CASE WHEN l.id_conta_credito = pc.id THEN l.valor ELSE 0 END), 0) AS total_credito
        FROM plano_contas pc
        LEFT JOIN lancamentos l ON (l.id_conta_debito = pc.id OR l.id_conta_credito = pc.id)
        GROUP BY pc.id, pc.codigo_conta, pc.nome_conta, pc.tipo_conta
        ORDER BY pc.codigo_conta
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao gerar DRE:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.post('/api/dre/confirmar', (req, res) => {
    const { total_receitas, total_custos, total_despesas, resultado_liquido, periodo } = req.body;

    const createSql = `
        CREATE TABLE IF NOT EXISTS dre_confirmados (
            id INT AUTO_INCREMENT PRIMARY KEY,
            periodo VARCHAR(20) NOT NULL,
            total_receitas DECIMAL(15,2) NOT NULL DEFAULT 0,
            total_custos DECIMAL(15,2) NOT NULL DEFAULT 0,
            total_despesas DECIMAL(15,2) NOT NULL DEFAULT 0,
            resultado_liquido DECIMAL(15,2) NOT NULL,
            confirmado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;

    db.query(createSql, (err) => {
        if (err) return res.status(500).json({ error: err.message });

        db.query(
            'INSERT INTO dre_confirmados (periodo, total_receitas, total_custos, total_despesas, resultado_liquido) VALUES (?, ?, ?, ?, ?)',
            [periodo || String(new Date().getFullYear()), total_receitas || 0, total_custos || 0, total_despesas || 0, resultado_liquido || 0],
            (err2, result) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.status(201).json({ message: 'DRE confirmado com sucesso!', id: result.insertId });
            }
        );
    });
});

// ── ROTAS ADICIONAIS DO INDEX.JS ───────────────────────────────────
app.get('/', (req, res) => {
    res.send('Servidor do Sistema ContabilCMRT rodando!');
});

// ── ROTA: LIVRO RAZÃO ─────────────────────────────────────────────
app.get('/api/livro-razao', (req, res) => {
    const sql = `
        SELECT 
            codigo_conta,
            nome_conta,
            data_movimento,
            debito,
            credito,
            historico,
            SUM(debito - credito) OVER (
                PARTITION BY id_conta
                ORDER BY data_movimento, id_lancamento
            ) AS saldo
        FROM vw_livro_razao
        ORDER BY codigo_conta, data_movimento, id_lancamento
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao listar livro razão:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// ── START DO SERVIDOR ─────────────────────────────────────────────
// IMPORTANTE: o app.listen sempre deve ser o ÚLTIMO item do arquivo
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});