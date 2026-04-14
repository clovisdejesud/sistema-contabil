# 🎯 Como Poblar Contas a Pagar a Partir de Lançamentos

## ⚡ TL;DR (Resumo Ultra-Rápido)

Sua pergunta foi respondida! Agora você tem **3 formas** de fazer isso:

### 1️⃣ Automático (Recomendado)
Quando você cria um lançamento via `lancamentos.html`, se a conta de crédito for **"Contas a Pagar"**, a tabela é populada automaticamente. Sem fazer nada extra! ✨

### 2️⃣ Manual em Lote
Acesse: `http://localhost:3000/sistema-contabil/menu/sincronizar-contas.html`
Clique em "Sincronizar Agora" e pronto! Todas as contas são criadas automaticamente.

### 3️⃣ Via API (Para Integração)
```javascript
await gerarContasPagarDeLancamentos()
```

---

## 🔧 O Que Foi Implementado?

### Arquivos Modificados:
- ✅ **server.js** - Implementadas rotas de lançamentos e geração de contas

### Arquivos Criados:
- ✅ **sincronizar-contas.html** - Página para sincronizar em lote
- ✅ **GUIA_CONTAS_PAGAR.md** - Documentação técnica completa
- ✅ **RESUMO_ALTERACOES.md** - O que mudou
- ✅ **FLUXO_CONTAS_PAGAR.txt** - Diagrama do fluxo
- ✅ **CHECKLIST_TESTES.md** - Como testar tudo
- ✅ **EXEMPLO_FORMULARIO_LANCAMENTO.html** - Template de formulário
- ✅ **api.js** - Atualizado com novas funções

---

## 🚀 Como Usar?

### Passo 1: Ciência que Funciona Automaticamente
Quando você cria um lançamento em `lancamentos.html` com:
- **Conta de Crédito:** Uma conta de "Contas a Pagar"
- Os outros campos preenchidos

Uma entrada aparece automaticamente em `contas-pagar.html`!

### Passo 2: Testar Sincronização Manual
1. Acesse: `http://localhost:3000/sistema-contabil/menu/sincronizar-contas.html`
2. Clique no botão "Sincronizar Agora"
3. Veja as contas sendo criadas

### Passo 3: Verificar Resultado
1. Vá em "Contas a Pagar"
2. Atualize a página (F5)
3. Veja a tabela preenchida!

---

## 🎯 Requisitos Mínimos

✅ Conta de **"Contas a Pagar"** deve estar no plano_contas:
```sql
-- Verifique:
SELECT * FROM plano_contas WHERE descricao LIKE '%pagar%';

-- Se não existir, execute:
INSERT INTO plano_contas (codigo_conta, descricao, tipo) 
VALUES ('210', 'Contas a Pagar', 'Passivo');
```

✅ Fornecedor deve estar cadastrado (opcional, mas recomendado):
```sql
SELECT * FROM fornecedores WHERE razao_social = 'Seu Fornecedor';
```

---

## 📊 Estrutura de Dados

### Tabela: `lancamentos`
Campos principais:
- `id_lancamento` - ID único
- `id_conta_debito` - Conta que debita (ex: Caixa)
- `id_conta_credito` - Conta que credita (**"Contas a Pagar"** para popular tabela)
- `valor` - Valor da transação
- `fornecedor` - Nome do fornecedor
- `data_lancamento` - Data do movimento

### Tabela: `contas_pagar`
É populada com:
- `id_lancamento` - Link para o lançamento
- `fornecedor_id` - Link para fornecedor (se existir)
- `valor` - Valor copiado do lançamento
- `data_vencimento` - Data do vencimento
- `status` - Padrão: "Pendente"
- `descricao` - Descrição copiada do lançamento

---

## 🔗 APIs Disponíveis

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/lancamentos` | GET | Listar lançamentos |
| `/api/lancamentos` | POST | Criar lançamento (cria conta a pagar se aplicável) |
| `/api/contas-pagar` | GET | Listar contas a pagar |
| `/api/contas-pagar` | POST | Criar conta a pagar manualmente |
| `/api/gerar-contas-pagar` | POST | Gerar contas a pagar em lote |

---

## 💡 Exemplos Práticos

### Criar um Lançamento (e popular contas a pagar):
```javascript
await salvarLancamento({
  data_lancamento: "2024-01-20",      // Data de hoje
  id_conta_debito: 1,                 // ID da conta que debita
  id_conta_credito: 210,              // ID de "Contas a Pagar" ⭐
  valor: 500.00,                      // Valor
  fornecedor: "Empresa ABC",          // Nome do fornecedor
  historico: "Compra de materiais",   // Descrição
  data_vencimento: "2024-02-20",      // Para daqui a 30 dias
  data_emissao: "2024-01-20"          // Data de emissão
});
```

✨ **Resultado:** Uma nova linha aparece em "Contas a Pagar"!

### Gerar em Lote:
```javascript
const resultado = await gerarContasPagarDeLancamentos();
console.log(`${resultado.processados} contas criadas`);
```

---

## ⚙️ Configuração

### Alterar Detecção de Conta
Se sua conta de "Contas a Pagar" não é detectada, edite em `server.js`:

```javascript
// Procure por (linha ~290):
WHERE descricao LIKE '%pagar%' OR descricao LIKE '%débito%'

// Altere para sua descrição, ex:
WHERE descricao LIKE '%a_pagar%'
```

### Customizar Status Padrão
```javascript
// Em server.js, função verificarEcriarContaPagar:
status: 'Pendente'  // Altere para 'Outro Status'
```

---

## 🐛 Problemas Comuns

### ❌ "Contas não são criadas automaticamente"
- [ ] Verifique se a conta de crédito contém "pagar" na descrição
- [ ] Confirme que o servidor está rodando
- [ ] Abra console (F12) para ver mensagens de erro

### ❌ "Fornecedor fica NULL"
- [ ] Verifique se o fornecedor existe em `fornecedores`
- [ ] O nome deve ser exatamente igual ao preenchido no formulário
- [ ] Isso é OK, a conta a pagar será criada mesmo assim

### ❌ "Erro 501 - Not Implemented"
- [ ] Você está usando uma versão antiga de `server.js`
- [ ] Substitua o arquivo ou copie as novas rotas

---

## 📁 Arquivos Importantes

Consulte esses arquivos conforme necessário:

| Arquivo | Quando Usar |
|---------|------------|
| `GUIA_CONTAS_PAGAR.md` | Entender detalhes técnicos |
| `FLUXO_CONTAS_PAGAR.txt` | Visualizar o fluxo de dados |
| `CHECKLIST_TESTES.md` | Testar se está funcionando |
| `EXEMPLO_FORMULARIO_LANCAMENTO.html` | Integrar formulário melhorado |
| `RESUMO_ALTERACOES.md` | Ver todas as mudanças |

---

## ✅ Seu Sistema Agora Pode:

✓ Criar lançamentos contábeis
✓ Popular **contas a pagar automaticamente** (🎯 Sua pergunta!)
✓ Sincronizar em lote
✓ Listar e filtrar contas
✓ Atualizar status

---

## 🚀 Próximos Passos

1. **Teste tudo** - Siga o `CHECKLIST_TESTES.md`
2. **Integre o formulário melhorado** - Use `EXEMPLO_FORMULARIO_LANCAMENTO.html`
3. **Adicione ao menu** - Coloque link para `sincronizar-contas.html`
4. **Customize** - Ajuste detecções e status conforme sua necessidade

---

## 📞 Dúvidas?

Leia nesta ordem:
1. `GUIA_CONTAS_PAGAR.md` - Documentação
2. `FLUXO_CONTAS_PAGAR.txt` - Entender o fluxo
3. `CHECKLIST_TESTES.md` - Testar

---

**Resposta rápida à sua pergunta:** A tabela `contas_pagar` é automaticamente populada quando você cria um lançamento com conta de crédito de "Contas a Pagar" ou você pode usar o botão "Sincronizar Agora" para gerar tudo de uma vez! ✨

