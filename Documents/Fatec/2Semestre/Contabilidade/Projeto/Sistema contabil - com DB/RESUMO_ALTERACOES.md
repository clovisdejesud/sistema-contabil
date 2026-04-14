# 🔧 Resumo das Alterações - Sistema de Contas a Pagar

## ✅ O que foi implementado?

### 1. **Servidor (server.js)**
   - ✅ Implementada rota **GET `/api/lancamentos`** - Lista todos os lançamentos
   - ✅ Implementada rota **POST `/api/lancamentos`** - Cria novo lançamento
   - ✅ Criada função **`verificarEcriarContaPagar()`** - Cria automaticamente contas a pagar ao salvar lançamento
   - ✅ Implementada rota **POST `/api/gerar-contas-pagar`** - Gera em lote todas as contas a pagar pendentes

### 2. **API Client (api.js)**
   - ✅ Adicionada função `buscarLancamentos()` - Busca lançamentos do servidor
   - ✅ Adicionada função `gerarContasPagarDeLancamentos()` - Gera contas em lote

### 3. **Interface (Novo arquivo)**
   - ✅ Criado `sincronizar-contas.html` - Página para sincronizar contas a pagar com botão interativo

### 4. **Documentação**
   - ✅ Criado `GUIA_CONTAS_PAGAR.md` - Guia completo de uso

---

## 🎯 Como usar?

### **Opção 1: Automático** (Recomendado)
Quando você cria um lançamento na aba "Lançamento Contábil", se a conta de crédito for de contas a pagar, a entrada é criada automaticamente.

### **Opção 2: Manual (em lote)**
1. Acesse: `http://localhost:3000/sistema-contabil/menu/sincronizar-contas.html`
2. Clique no botão "Sincronizar Agora"
3. As contas serão criadas automaticamente

### **Opção 3: Via Console JavaScript**
```javascript
await gerarContasPagarDeLancamentos()
```

---

## 📋 Estrutura de Dados

### Campo `id_conta_credito` deve estar associado a uma conta de "Contas a Pagar"
Verifique sua tabela `plano_contas`:
```sql
SELECT * FROM plano_contas WHERE descricao LIKE '%pagar%';
```

Se não existir, crie:
```sql
INSERT INTO plano_contas (codigo_conta, descricao, tipo) 
VALUES ('210', 'Contas a Pagar - Fornecedores', 'Passivo');
```

---

## 🚀 Próximos Passos

1. **Teste a funcionalidade:**
   - Crie um lançamento em lancamentos.html
   - Verifique se aparece em contas-pagar.html

2. **Adicione um link no menu:**
   ```html
   <a href="sincronizar-contas.html">📊 Sincronizar Contas</a>
   ```

3. **Customize a detecção:**
   - Edite `verification em server.js (linha ~290)
   - Altere a lógica de detecção se necessário

---

## ⚙️ Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/lancamentos` | Lista lançamentos |
| POST | `/api/lancamentos` | Cria lançamento |
| POST | `/api/gerar-contas-pagar` | Gera contas em lote |
| GET | `/api/contas-pagar` | Lista contas a pagar |
| POST | `/api/contas-pagar` | Cria conta manualmente |

---

## 🐛 Verificação de Erros

### Contas não aparecem?
1. Verifique o console (F12) para erros JavaScript
2. Confirme que o servidor está rodando: `http://localhost:3000`
3. Verifique a conta de crédito no `plano_contas`

### Erro "Campos obrigatórios faltando"?
Certifique-se que todos estes campos estão preenchidos:
- `data_lancamento`
- `id_conta_debito`
- `id_conta_credito`
- `valor`

---

## 📝 Notas Importantes

- **Auto-detecção:** O sistema detecta automaticamente contas de "Contas a Pagar" pela descrição
- **Fornecedor:** Se o fornecedor existe em `fornecedores`, será linkado automaticamente
- **Status:** Contas criadas automaticamente têm status "Pendente"
- **Sem duplicação:** Lançamentos já processados não serão re-processados

---

## 📞 Dúvidas ou Problemas?

- Consulte `GUIA_CONTAS_PAGAR.md` para detalhes técnicos
- Verifique os logs do servidor no terminal
- Use a página `sincronizar-contas.html` para testes manuais

