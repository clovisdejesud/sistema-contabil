# 🔧 TROUBLESHOOTING RÁPIDO

## Problema: Contas não aparecem

### ❌ Erro 1: "Erro ao buscar dados do servidor"

**Causa:** Servidor não está rodando

**Solução:**
```bash
# Terminal:
node server.js

# Esperado:
# ✅ Conectado ao MySQL com sucesso!
# ✅ Servidor rodando em http://localhost:3000
```

---

### ❌ Erro 2: "Nenhuma conta a pagar encontrada"

**Causa:** Conta de crédito não é de "Contas a Pagar"

**Solução:**
```sql
-- Verificar:
SELECT * FROM plano_contas WHERE id = 210;

-- Se descrição NÃO contém "pagar", atualizar:
UPDATE plano_contas 
SET descricao = 'Contas a Pagar - Fornecedores' 
WHERE id = 210;
```

---

### ❌ Erro 3: Lançamento criado, mas conta não aparece

**Causa:** 
- Conta de crédito errada OU
- Banco não conectado OU
- Erro silencioso

**Solução:**
```
1. Verifique console do navegador (F12)
2. Use conta ID 210 como crédito
3. Teste com: http://localhost:3000/api/contas-pagar
```

---

## Problema: Sincronizar não funciona

### ❌ Erro: "Erro ao sincronizar"

**Causa:** Servidor/BD não acessível

**Solução:**
```bash
# Verificar servidor:
curl http://localhost:3000

# Esperado: "Servidor do Sistema ContabilCMRT rodando!"

# Se não funcionar:
node server.js
```

---

## Problema: Banco de dados

### ❌ Erro: "Can't connect to MySQL"

**Solução - Windows:**
```bash
# Abra Services (services.msc)
# Procure: MySQL
# Se parado → Iniciar
```

**Solução - Linha de comando:**
```bash
# Testar conexão:
mysql -u root -p fatec#2025 -h localhost

# Se erro, reinicie:
# Windows: net start MySQL80
```

---

## Problema: Dados/Configuração

### ❌ Erro: "Fornecedor fica NULL"

**Causa:** Fornecedor não existe em `fornecedores`

**Solução:**
```sql
-- Verificar:
SELECT * FROM fornecedores WHERE razao_social LIKE '%SEU_FORNECEDOR%';

-- Se não existir, criar:
INSERT INTO fornecedores (razao_social, ativo) 
VALUES ('Seu Fornecedor', 1);
```

---

### ❌ Erro: "Contas duplicadas"

**Causa:** Sincronizou 2x

**Solução:**
```sql
-- Verificar:
SELECT id_lancamento, COUNT(*) 
FROM contas_pagar 
GROUP BY id_lancamento 
HAVING COUNT(*) > 1;

-- Remover duplicada se necessário:
DELETE FROM contas_pagar 
WHERE id IN (1, 2);  -- Remover a que não quer
```

---

## Problema: Interface/Browser

### ❌ Erro: "Página não carrega"

**Solução:**
```
1. Refresh (F5)
2. Limpar cache (Ctrl+Shift+Delete)
3. Modo incógnito (Ctrl+Shift+N)
4. Verificar URL:
   http://localhost:3000/sistema-contabil/menu/sincronizar-contas.html
```

---

## Problema: Validação

### ❌ Erro: "Campos obrigatórios faltando"

**Solução:**
Certifique-se que preencheu:
- [x] Data do lançamento
- [x] Conta débito
- [x] Conta crédito ← **(IMPORTANTE: "Contas a Pagar")**
- [x] Valor
- [x] Fornecedor (opcional)

---

## CHECKLIST DE SOLUÇÕES RÁPIDAS

Se algo está errado, teste em ordem:

1. [ ] Servidor rodando?
   ```bash
   curl http://localhost:3000
   ```

2. [ ] BD conectado?
   ```sql
   mysql -u root -p fatec#2025
   ```

3. [ ] Conta de contas a pagar existe?
   ```sql
   SELECT * FROM plano_contas WHERE descricao LIKE '%pagar%';
   ```

4. [ ] Preencheu corretamente?
   - [ ] Conta crédito = Contas a Pagar
   - [ ] Valor > 0
   - [ ] Data válida

5. [ ] Browser OK?
   - [ ] Refresh (F5)
   - [ ] Cache limpo
   - [ ] Console limpo (F12)

---

## TESTES RÁPIDOS (via curl)

```bash
# 1. Testar servidor
curl http://localhost:3000

# 2. Listar blano de contas
curl http://localhost:3000/api/plano-contas

# 3. Listar lançamentos
curl http://localhost:3000/api/lancamentos

# 4. Listar contas a pagar
curl http://localhost:3000/api/contas-pagar

# 5. Sincronizar (em lote)
curl -X POST http://localhost:3000/api/gerar-contas-pagar
```

---

## COMANDOS MYSQL ÚTEIS

```sql
-- Ver todas as contas:
SELECT * FROM plano_contas;

-- Ver lançamentos:
SELECT * FROM lancamentos ORDER BY id DESC;

-- Ver contas a pagar:
SELECT * FROM contas_pagar ORDER BY id DESC;

-- Ver lançamentos NÃO processados:
SELECT l.* FROM lancamentos l
WHERE l.id NOT IN (SELECT id_lancamento FROM contas_pagar);

-- Limpar tudo (cuidado!):
DELETE FROM contas_pagar;
DELETE FROM lancamentos;
```

---

## RESETAR TUDO (Nuclear)

**Se estiver muito quebrado:**

```bash
# 1. Parar servidor
# Ctrl+C no terminal

# 2. Restartar MySQL
# Windows: net stop MySQL80 && net start MySQL80
# Linux: sudo systemctl restart mysql

# 3. Limpar dados (se quiser)
mysql -u root -p fatec#2025 sistema_contabil < reset.sql

# 4. Restartar servidor
node server.js
```

---

## DÚVIDAS?

| Problema | Arquivo |
|----------|---------|
| Não funciona | CHECKLIST_TESTES.md |
| Entender | GUIA_CONTAS_PAGAR.md |
| Referência | CHEAT_SHEET.md |
| Primeiros passos | QUICK_START.md |

---

## 📞 ÚLTIMO RECURSO

Se nada funcionar:

1. Abra o console (F12)
2. Procure por mensagens de erro vermelhas
3. Copie a mensagem de erro
4. Consulte a tabela acima
5. Se ainda não funcionar, veja CHECKLIST_TESTES.md

---

**Pronto? Volte a usar o sistema! 🚀**

