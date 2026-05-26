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

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:');
        console.error('  Código  :', err.code);
        console.error('  Mensagem:', err.message);
        return;
    }
    console.log('Conectado ao MySQL com sucesso!');
    executarMigrations();
});

function executarMigrations() {
    // Verifica se a coluna já existe via information_schema (compatível com MySQL 5.x e 8.x)
    db.query(`
        SELECT COUNT(*) AS existe
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'lancamentos'
          AND COLUMN_NAME  = 'data_vencimento'
    `, (err, rows) => {
        if (err) { console.error('Migration check:', err.message); return; }

        const jaExiste = rows[0].existe > 0;

        const runUpdate = () => {
            db.query(`
                UPDATE lancamentos l
                SET l.data_vencimento = COALESCE(
                    (SELECT MIN(cp.data_vencimento)
                     FROM contas_pagar cp
                     WHERE cp.id_lancamento = l.id),
                    CASE
                        WHEN LOWER(l.historico) LIKE '%prazo%'
                        THEN DATE_ADD(l.data_lancamento, INTERVAL 30 DAY)
                        ELSE l.data_lancamento
                    END
                )
                WHERE l.data_vencimento IS NULL
            `, (err2, result) => {
                if (err2) { console.error('Migration update vencimento:', err2.message); return; }
                if (result.affectedRows > 0)
                    console.log(`Migration: ${result.affectedRows} lançamento(s) com data_vencimento preenchida.`);
            });
        };

        if (jaExiste) {
            runUpdate();
        } else {
            db.query(`ALTER TABLE lancamentos ADD COLUMN data_vencimento DATE NULL`, (err2) => {
                if (err2) { console.error('Migration ADD COLUMN:', err2.message); return; }
                console.log('Migration: coluna data_vencimento criada.');
                runUpdate();
            });
        }
    });
}

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

app.get('/api/dashboard/movimentacoes-diarias', async (req, res) => {
    const promiseDb = db.promise();
    try {
        const [[{ ano, mes }]] = await promiseDb.query(
            `SELECT YEAR(MAX(data_lancamento)) AS ano, MONTH(MAX(data_lancamento)) AS mes FROM diarios`
        );

        if (!ano || !mes) return res.json({ dias: [], entradas: [], saidas: [], mes_atual: '' });

        // Entradas: contas de caixa/banco (1.1.x) no débito → dinheiro entrando
        // Saídas:   contas de caixa/banco (1.1.x) no crédito → dinheiro saindo
        const [rows] = await promiseDb.query(`
            SELECT
                DAY(d.data_lancamento) AS dia,
                SUM(CASE WHEN pc_db.codigo_conta LIKE '1.1%' THEN d.valor ELSE 0 END) AS entradas,
                SUM(CASE WHEN pc_cr.codigo_conta LIKE '1.1%' THEN d.valor ELSE 0 END) AS saidas
            FROM diarios d
            LEFT JOIN plano_contas pc_db ON d.id_conta_debito  = pc_db.id
            LEFT JOIN plano_contas pc_cr ON d.id_conta_credito = pc_cr.id
            WHERE YEAR(d.data_lancamento) = ? AND MONTH(d.data_lancamento) = ?
              AND (pc_db.codigo_conta LIKE '1.1%' OR pc_cr.codigo_conta LIKE '1.1%')
            GROUP BY dia
            ORDER BY dia
        `, [ano, mes]);

        const daysInMonth = new Date(ano, mes, 0).getDate();
        const diasMap = {};
        rows.forEach(r => {
            diasMap[r.dia] = {
                entradas: parseFloat(r.entradas) || 0,
                saidas: parseFloat(r.saidas) || 0
            };
        });

        const dias = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const mesLabel = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        res.json({
            dias,
            entradas: dias.map(d => diasMap[d]?.entradas || 0),
            saidas:   dias.map(d => diasMap[d]?.saidas   || 0),
            mes_atual: mesLabel
        });
    } catch (error) {
        console.error('Erro ao buscar movimentações diárias:', error);
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

app.put('/api/clientes/:id', (req, res) => {
    const { razao_social, nome_fantasia, email, telefone, limite_credito } = req.body;
    const id = req.params.id;
    
    db.query(
        "UPDATE clientes SET razao_social = ?, nome_fantasia = ?, email = ?, telefone = ?, limite_credito = ? WHERE id = ?",
        [razao_social, nome_fantasia, email, telefone, limite_credito, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Cliente atualizado!' });
        }
    );
});

app.delete('/api/fornecedores/:id', (req, res) => {
    db.query("DELETE FROM fornecedores WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Fornecedor excluído!' });
    });
});

app.put('/api/fornecedores/:id', (req, res) => {
    const { razao_social, nome_fantasia, email, telefone, nome_contato, regime_tributario } = req.body;
    const id = req.params.id;
    
    db.query(
        "UPDATE fornecedores SET razao_social = ?, nome_fantasia = ?, email = ?, telefone = ?, nome_contato = ?, regime_tributario = ? WHERE id = ?",
        [razao_social, nome_fantasia, email, telefone, nome_contato, regime_tributario, id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Fornecedor atualizado!' });
        }
    );
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

app.post('/api/plano-contas', (req, res) => {
    const { codigo_conta, nome_conta, tipo_conta, natureza } = req.body;
    if (!codigo_conta || !nome_conta || !tipo_conta || !natureza) {
        return res.status(400).json({ error: 'Campos obrigatórios: codigo_conta, nome_conta, tipo_conta, natureza.' });
    }
    db.query(
        'INSERT INTO plano_contas (codigo_conta, nome_conta, tipo_conta, natureza) VALUES (?, ?, ?, ?)',
        [codigo_conta, nome_conta, tipo_conta, natureza],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Conta criada!', id: result.insertId });
        }
    );
});

app.delete('/api/plano-contas/:id', (req, res) => {
    db.query('DELETE FROM plano_contas WHERE id = ?', [req.params.id], (err, result) => {
        if (err) {
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ error: 'Esta conta possui lançamentos vinculados e não pode ser excluída.' });
            }
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Conta não encontrada.' });
        res.json({ message: 'Conta excluída!' });
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
        data_vencimento,
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
                    data_vencimento,
                    id_conta_debito,
                    id_conta_credito,
                    valor,
                    historico,
                    fornecedor_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const vencimento = data_vencimento || data_lancamento;
            const values = [
                data_lancamento,
                vencimento,
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

// ── ROTA: Limpar registros órfãos após deleção direta no banco ─────
app.delete('/api/sincronizar-deletados', (req, res) => {
    const promiseDb = db.promise();

    const deleteDiarios = `
        DELETE FROM diarios
        WHERE id_lancamento NOT IN (SELECT id FROM lancamentos)
    `;
    const deleteContasPagar = `
        DELETE FROM contas_pagar
        WHERE id_lancamento NOT IN (SELECT id FROM lancamentos)
    `;

    promiseDb.query(deleteDiarios)
        .then(([r1]) => promiseDb.query(deleteContasPagar).then(([r2]) => {
            res.json({
                message: 'Sincronização concluída.',
                diarios_removidos: r1.affectedRows,
                contas_pagar_removidas: r2.affectedRows
            });
        }))
        .catch(err => {
            console.error('Erro ao sincronizar deletados:', err);
            res.status(500).json({ error: err.message });
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

// ── ROTAS: CONTAS A RECEBER ───────────────────────────────────────
app.get('/api/contas-receber', async (req, res) => {
    const promiseDb = db.promise();
    try {
        await promiseDb.query(`
            CREATE TABLE IF NOT EXISTS contas_receber (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                cliente_id    BIGINT NULL,
                descricao     TEXT,
                valor         DECIMAL(15,2) NOT NULL,
                data_emissao  DATE,
                data_vencimento DATE NOT NULL,
                status        VARCHAR(50) DEFAULT 'Pendente',
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        const [[{ total }]] = await promiseDb.query('SELECT COUNT(*) AS total FROM contas_receber');
        if (total === 0) {
            await promiseDb.query(`
                INSERT INTO contas_receber (cliente_id, descricao, valor, data_emissao, data_vencimento, status) VALUES
                (19, 'Serviços de consultoria — Jan/2026',     20000.00, '2026-01-18', '2026-02-17', 'Pendente'),
                (14, 'Fornecimento de materiais — Jan/2026',   15000.00, '2026-01-15', '2026-03-15', 'Pendente'),
                (17, 'Prestação de serviços técnicos',          8500.00, '2026-01-26', '2026-03-25', 'Pendente'),
                (19, 'Contrato de manutenção anual',           30000.00, '2026-01-30', '2026-06-30', 'Pendente'),
                (14, 'Projeto de implementação',               12000.00, '2026-01-20', '2026-07-20', 'Pendente')
            `);
        }

        const [rows] = await promiseDb.query(`
            SELECT
                cr.id,
                cr.descricao,
                cr.valor,
                cr.data_emissao,
                cr.data_vencimento,
                COALESCE(f.razao_social, 'Cliente não informado') AS cliente,
                CASE
                    WHEN cr.status = 'Pago' THEN 'Pago'
                    WHEN cr.data_vencimento < CURDATE() THEN 'Vencido'
                    ELSE 'A Vencer'
                END AS status_real
            FROM contas_receber cr
            LEFT JOIN fornecedores f ON cr.cliente_id = f.id
            ORDER BY cr.data_vencimento ASC
        `);

        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar contas a receber:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── ROTAS: FUNCIONÁRIOS ───────────────────────────────────────────
app.get('/api/funcionarios', async (req, res) => {
    const promiseDb = db.promise();
    try {
        const [rows] = await promiseDb.query(`
            SELECT
                f.id, f.nome_completo, f.cpf, f.data_nascimento, f.sexo,
                f.data_admissao, f.salario, f.status,
                c.nome  AS cargo,
                d.nome  AS departamento,
                s.nome  AS setor,
                ct.telefone, ct.email,
                ct.contato_emergencia, ct.telefone_emergencia,
                e.logradouro, e.numero, e.bairro, e.cep, e.cidade, e.estado
            FROM funcionario f
            LEFT JOIN cargo       c  ON f.cargo_id        = c.id
            LEFT JOIN departamento d  ON f.departamento_id = d.id
            LEFT JOIN setor        s  ON f.setor_id        = s.id
            LEFT JOIN contato      ct ON f.contato_id      = ct.id
            LEFT JOIN enderecos    e  ON f.enderecos_id    = e.id_endereco
            ORDER BY f.nome_completo ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/funcionarios', async (req, res) => {
    const promiseDb = db.promise();
    const {
        nome_completo, cpf, data_nascimento, sexo,
        data_admissao, salario, status,
        cargo_id, departamento_id, setor_id,
        telefone, email, contato_emergencia, telefone_emergencia,
        logradouro, numero, bairro, cep, cidade, estado
    } = req.body;

    try {
        const [rContato] = await promiseDb.query(
            `INSERT INTO contato (telefone, email, contato_emergencia, telefone_emergencia)
             VALUES (?, ?, ?, ?)`,
            [telefone || null, email || null, contato_emergencia || null, telefone_emergencia || null]
        );
        const contato_id = rContato.insertId;

        const [rEnd] = await promiseDb.query(
            `INSERT INTO enderecos (logradouro, numero, bairro, cep, cidade, estado)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [logradouro || '', numero || '', bairro || '', cep || '', cidade || '', estado || '']
        );
        const enderecos_id = rEnd.insertId;

        const [rFunc] = await promiseDb.query(
            `INSERT INTO funcionario
             (nome_completo, cpf, data_nascimento, sexo, data_admissao, salario, status,
              cargo_id, departamento_id, setor_id, contato_id, enderecos_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome_completo, cpf, data_nascimento || null, sexo || null,
                data_admissao || null, salario || null, status || 'Ativo',
                cargo_id || null, departamento_id || null, setor_id || null,
                contato_id, enderecos_id
            ]
        );
        res.status(201).json({ id: rFunc.insertId, message: 'Funcionário cadastrado com sucesso!' });
    } catch (error) {
        console.error('Erro ao cadastrar funcionário:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/cargos', (req, res) => {
    db.query('SELECT * FROM cargo ORDER BY nome ASC', (err, r) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(r);
    });
});

app.get('/api/departamentos', (req, res) => {
    db.query('SELECT * FROM departamento ORDER BY nome ASC', (err, r) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(r);
    });
});

app.get('/api/setores', (req, res) => {
    db.query('SELECT * FROM setor ORDER BY nome ASC', (err, r) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(r);
    });
});

// ── ROTA: FLUXO DE CAIXA ─────────────────────────────────────────
app.get('/api/fluxo-caixa', async (req, res) => {
    const promiseDb = db.promise();
    try {
        const [rows] = await promiseDb.query(`
            SELECT
                l.id,
                l.data_lancamento          AS data,
                COALESCE(l.historico, '')  AS descricao,
                CASE
                    WHEN pc_d.codigo_conta LIKE '1.1%' AND pc_c.codigo_conta NOT LIKE '1.1%'
                        THEN COALESCE(pc_c.nome_conta, 'Sem conta')
                    WHEN pc_c.codigo_conta LIKE '1.1%' AND pc_d.codigo_conta NOT LIKE '1.1%'
                        THEN COALESCE(pc_d.nome_conta, 'Sem conta')
                    ELSE CONCAT(COALESCE(pc_d.nome_conta,'?'), ' → ', COALESCE(pc_c.nome_conta,'?'))
                END AS tipo,
                CASE WHEN pc_d.codigo_conta LIKE '1.1%' THEN l.valor ELSE 0 END AS entrada,
                CASE WHEN pc_c.codigo_conta LIKE '1.1%' THEN l.valor ELSE 0 END AS saida
            FROM lancamentos l
            LEFT JOIN plano_contas pc_d ON l.id_conta_debito  = pc_d.id
            LEFT JOIN plano_contas pc_c ON l.id_conta_credito = pc_c.id
            WHERE pc_d.codigo_conta LIKE '1.1%' OR pc_c.codigo_conta LIKE '1.1%'
            ORDER BY l.data_lancamento ASC, l.id ASC
        `);

        let saldo = 0;
        const resultado = rows.map(row => {
            saldo += parseFloat(row.entrada) - parseFloat(row.saida);
            return {
                id:        row.id,
                data:      row.data,
                descricao: row.descricao,
                tipo:      row.tipo,
                entrada:   parseFloat(row.entrada),
                saida:     parseFloat(row.saida),
                saldo
            };
        });

        res.json(resultado);
    } catch (err) {
        console.error('Erro ao carregar fluxo de caixa:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── ROTAS: USUÁRIOS DO SISTEMA ────────────────────────────────────
const crypto = require('crypto');

function hashSenha(senha) {
    return crypto.createHash('sha256').update(senha).digest('hex');
}

function criarTabelaUsuarios(cb) {
    db.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id           INT AUTO_INCREMENT PRIMARY KEY,
            nome         VARCHAR(150) NOT NULL,
            login        VARCHAR(80)  NOT NULL UNIQUE,
            email        VARCHAR(150) NULL,
            senha_hash   VARCHAR(64)  NOT NULL,
            nivel_acesso ENUM('administrador','gerente','supervisor','usuario') NOT NULL DEFAULT 'usuario',
            status       ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `, (err) => { if (cb) cb(err); });
}

app.get('/api/usuarios', (req, res) => {
    criarTabelaUsuarios(() => {
        db.query(
            'SELECT id, nome, login, email, nivel_acesso, status, created_at FROM usuarios ORDER BY nome ASC',
            (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(results);
            }
        );
    });
});

app.post('/api/usuarios', (req, res) => {
    const { nome, login, email, senha, nivel_acesso, status } = req.body;
    if (!nome || !login || !senha || !nivel_acesso)
        return res.status(400).json({ error: 'Campos obrigatórios: nome, login, senha, nivel_acesso.' });

    criarTabelaUsuarios(() => {
        db.query(
            `INSERT INTO usuarios (nome, login, email, senha_hash, nivel_acesso, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, login, email || null, hashSenha(senha), nivel_acesso, status || 'ativo'],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY')
                        return res.status(409).json({ error: 'Já existe um usuário com este login.' });
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: 'Usuário cadastrado com sucesso!', id: result.insertId });
            }
        );
    });
});

app.put('/api/usuarios/:id', (req, res) => {
    const { nome, login, email, senha, nivel_acesso, status } = req.body;
    if (!nome || !login || !nivel_acesso)
        return res.status(400).json({ error: 'Campos obrigatórios: nome, login, nivel_acesso.' });

    const atualizar = (senhaHash) => {
        const campos = senhaHash
            ? 'nome=?, login=?, email=?, senha_hash=?, nivel_acesso=?, status=?'
            : 'nome=?, login=?, email=?, nivel_acesso=?, status=?';
        const valores = senhaHash
            ? [nome, login, email || null, senhaHash, nivel_acesso, status || 'ativo', req.params.id]
            : [nome, login, email || null, nivel_acesso, status || 'ativo', req.params.id];

        db.query(`UPDATE usuarios SET ${campos} WHERE id = ?`, valores, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY')
                    return res.status(409).json({ error: 'Já existe um usuário com este login.' });
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
            res.json({ message: 'Usuário atualizado com sucesso!' });
        });
    };

    atualizar(senha ? hashSenha(senha) : null);
});

app.delete('/api/usuarios/:id', (req, res) => {
    db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ message: 'Usuário excluído com sucesso!' });
    });
});

// ── START DO SERVIDOR ─────────────────────────────────────────────
// IMPORTANTE: o app.listen sempre deve ser o ÚLTIMO item do arquivo
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});