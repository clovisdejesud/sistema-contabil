# 📟 Cheat Sheet - Poblar Contas a Pagar

## ⚡ Links Principais

| O Quê? | Link |
|--------|------|
| 📋 Criar Lançamento | `http://localhost:3000/sistema-contabil/menu/lancamentos.html` |
| 👀 Ver Contas a Pagar | `http://localhost:3000/sistema-contabil/menu/contas-pagar.html` |
| 🔘 Sincronizar em Lote | `http://localhost:3000/sistema-contabil/menu/sincronizar-contas.html` |
| 📚 Servidor Status | `http://localhost:3000` |

---

## 🎯 3 Formas de Usar

```
1️⃣ AUTOMÁTICO (Recomendado)
   Criar lançamento → Conta Crédito = "Contas a Pagar" → Pronto!

2️⃣ BOTÃO
   Abra sincronizar-contas.html → Clique "Sincronizar" → Pronto!

3️⃣ API
   await gerarContasPagarDeLancamentos()
```

---

## 📊 APIs

```javascript
// GET - Listar lançamentos
fetch('http://localhost:3000/api/lancamentos')

// POST - Criar lançamento (cria conta a pagar automaticamente)
fetch('http://localhost:3000/api/lancamentos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data_lancamento: '2024-01-20',
    id_conta_debito: 1,
    id_conta_credito: 210,        // ← "Contas a Pagar"
    valor: 100.00,
    fornecedor: 'Empresa ABC',
    historico: 'Descrição',
    data_vencimento: '2024-02-20'
  })
})

// GET - Listar contas a pagar
fetch('http://localhost:3000/api/contas-pagar')

// POST - Sincronizar em lote
fetch('http://localhost:3000/api/gerar-contas-pagar', {
  method: 'POST'
})
```

---

## 🔧 Comandos MySQL

```sql
-- Verificar contas de desconto
SELECT * FROM plano_contas WHERE descricao LIKE '%pagar%';

-- Ver lançamentos
SELECT * FROM lancamentos ORDER BY id DESC LIMIT 5;

-- Ver contas a pagar
SELECT * FROM contas_pagar ORDER BY id DESC LIMIT 5;

-- Ver lançamentos não processados
SELECT * FROM lancamentos WHERE id NOT IN (
  SELECT id_lancamento FROM contas_pagar
);

-- Criar conta de contas a pagar (se não existir)
INSERT INTO plano_contas (codigo_conta, descricao, tipo) 
VALUES ('210', 'Contas a Pagar', 'Passivo');
```

---

## 🐛 Troubleshooting Rápido

```
❌ "Conexão recusada"
   → Node server.js rodando? Verifique porta 3000

❌ "Contas não aparecem"
   → Conta de crédito tem "pagar" na descrição? 
   → SELECT * FROM plano_contas WHERE descricao LIKE '%pagar%'

❌ "Erro ao salvar lançamento"
   → Todos os campos obrigatórios preenchidos?
   → Abra F12 console para ver detalhes

❌ "Fornecedor fica NULL"
   → Normal! Fornecedor existe na tabela?
   → Verify: SELECT * FROM fornecedores
```

---

## 📁 Arquivos Importantes

```
COMECE_AQUI.md                     ← 🎯 Comece por aqui!
README_PT.md                       ← Guia rápido
GUIA_CONTAS_PAGAR.md              ← Documentação técnica
FLUXO_CONTAS_PAGAR.txt            ← Diagrama
CHECKLIST_TESTES.md               ← Validar tudo
RESUMO_ALTERACOES.md              ← O que mudou
INDICE_ARQUIVOS.md                ← Índice de tudo
```

---

## ✅ Verificação Rápida (2 minutos)

```bash
# 1. Servidor rodando?
curl http://localhost:3000

# 2. Banco OK?
curl http://localhost:3000/api/plano-contas

# 3. Acesse sincronizar
# http://localhost:3000/sistema-contabil/menu/sincronizar-contas.html

# 4. Clique "Sincronizar Agora"

# 5. Pronto! ✅
```

---

## 💾 Estrutura de Dados

### Entrada: Lance Mento
```json
{
  "data_lancamento": "2024-01-20",
  "id_conta_debito": 1,              // Caixa/Banco
  "id_conta_credito": 210,           // ← Contas a Pagar
  "valor": 500.00,
  "fornecedor": "Empresa ABC",
  "historico": "Descrição",
  "data_vencimento": "2024-02-20"
}
```

### Saída: Conta a Pagar
```json
{
  "id_lancamento": 1,                // ← Link
  "fornecedor_id": 42,               // Link (se existir)
  "valor": 500.00,
  "data_vencimento": "2024-02-20",
  "status": "Pendente"
}
```

---

## 🎯 Fluxo Principal

```
┌─ Criar Lançamento
│  └─ Salvar no banco
│     └─ Sistema detecta "Contas a Pagar"
│        └─ Busca fornecedor
│           └─ Cria conta a pagar AUTOMATICAMENTE
│
└─ Resultado: Conta aparece em "Contas a Pagar"
```

---

## 🔄 Alternativa em Lote

```
┌─ Abrir sincronizar-contas.html
│  └─ Clique "Sincronizar Agora"
│     └─ Busca lançamentos não processados
│        └─ Cria todas as contas a pagar
│
└─ Resultado: Múltiplas contas criadas de uma vez
```

---

## 📝 Funções JavaScript

```javascript
// Listar lançamentos
buscarLancamentos()

// Criar lançamento
salvarLancamento(dados)

// Gerar contas a pagar em lote
gerarContasPagarDeLancamentos()

// Listar contas a pagar
buscarContasPagar()
```

---

## 🎨 UI Principal

| Página | Função |
|--------|--------|
| lancamentos.html | Criar lançamentos |
| contas-pagar.html | Ver contas (atualiza automaticamente) |
| sincronizar-contas.html | 🆕 Botão para sincronizar tudo |

---

## 🚀 Começar

```
1. O servidor está rodando?
   → Se não: node server.js

2. Abra lancamentos.html
   → Crie um teste

3. Abra contas-pagar.html
   → Atualize (F5)
   → Viu aparecer? ✅
```

---

## 📞 Referência Rápida

```
Seu objetivo: Poblar contas a pagar baseado em lançamentos

✅ Resolvido! 3 formas:
   1. Automático ao criar lançamento
   2. Botão sincronizar em lote
   3. API programática

📚 Ler: README_PT.md (5 min)
🧪 Testar: CHECKLIST_TESTES.md (15 min)
```

---

**Pronto? Comece em COMECE_AQUI.md ou sincronizar-contas.html!**

