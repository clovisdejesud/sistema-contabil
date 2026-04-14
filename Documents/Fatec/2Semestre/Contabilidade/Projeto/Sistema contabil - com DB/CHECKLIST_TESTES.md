# ✅ Checklist de Implementação e Testes

## 📋 Pou-Pou-Pourri de Verificação

### ✅ Verificação Inicial do Servidor

- [ ] Servidor está rodando? 
  Terminal: `node server.js`
  Verificar: `http://localhost:3000` retorna "Servidor do Sistema ContabilCMRT rodando!"

- [ ] Banco de dados está conectado?
  Terminal deve mostrar: "Conectado ao MySQL com sucesso!"

- [ ] Tabelas existem?
  ```sql
  SHOW TABLES FROM sistema_contabil;
  -- Deve incluir: lancamentos, contas_pagar, plano_contas, fornecedores
  ```

### ✅ Verificação de Conta de Contas a Pagar

- [ ] Conta de contas a pagar existe no plano_contas?
  ```sql
  SELECT * FROM plano_contas WHERE descricao LIKE '%pagar%';
  -- Deve retornar pelo menos uma linha
  ```

- [ ] A descrição contém "pagar" ou "débito"?
  Se não, atualize:
  ```sql
  UPDATE plano_contas SET descricao = 'Contas a Pagar' WHERE id = 210;
  ```

### ✅ Teste 1: Criar Lançamento Manual

- [ ] Abra o navegador e vá para: `http://localhost:3000/sistema-contabil/menu/lancamentos.html`

- [ ] Preencha o formulário:
  - Data: hoje
  - Conta Débito: Caixa (ID 1)
  - Conta Crédito: Contas a Pagar (ID 210)
  - Valor: 100.00
  - Fornecedor: "Teste Fornecedor"
  - Vencimento: daqui a 30 dias

- [ ] Clique em "Salvar Lançamento"

- [ ] Verifique console do navegador (F12) para erros

### ✅ Teste 2: Verificar Criação Automática

- [ ] Vá para: `http://localhost:3000/sistema-contabil/menu/contas-pagar.html`

- [ ] Atualize a página (F5)

- [ ] Você vê a conta recém-criada na tabela?
  Procure por:
  - ✓ Data de vencimento correta
  - ✓ Fornecedor "Teste Fornecedor"
  - ✓ Valor 100.00
  - ✓ Status "Pendente"

### ✅ Teste 3: Sincronização em Lote

- [ ] Vá para: `http://localhost:3000/sistema-contabil/menu/sincronizar-contas.html`

- [ ] Clique em "Sincronizar Agora"

- [ ] Você vê mensagem de sucesso?
  Esperado: "✅ Sincronização realizada com sucesso!"

- [ ] Quantas contas foram criadas?
  Anote o número para referência

### ✅ Teste 4: Verificação no Banco de Dados

Abra seu cliente MySQL e verifique:

```sql
-- Ver lançamentos criados
SELECT * FROM lancamentos ORDER BY id DESC LIMIT 5;

-- Ver contas a pagar criadas
SELECT cp.*, f.razao_social 
FROM contas_pagar cp
LEFT JOIN fornecedores f ON cp.fornecedor_id = f.id
ORDER BY cp.id DESC LIMIT 5;

-- Verificar se há registros órfãos (sem lançamento)
SELECT * FROM contas_pagar WHERE id_lancamento IS NULL;
```

### ✅ Teste 5: Filtrar por Status

- [ ] Em "Contas a Pagar", há filtros de status?

- [ ] Teste os filtros:
  - [ ] Mostrar "Pendente"
  - [ ] Mostrar "Pago"
  - [ ] Mostrar "Cancelado"

### ✅ Teste 6: Editar/Atualizar Status

- [ ] Em "Contas a Pagar", você consegue:
  - [ ] Clicar em uma linha
  - [ ] Abrir detalhes
  - [ ] Mudar status para "Pago"
  - [ ] Salvar

---

## 🚀 Testes Avançados

### Teste 7: Múltiplos Fornecedores

- [ ] Crie 3 lançamentos diferentes com fornecedores diferentes
- [ ] Sincronize contas a pagar
- [ ] Verifique se todos aparecem com os fornecedores corretos

### Teste 8: Valores Grandes

- [ ] Crie um lançamento com valor: 9999999.99
- [ ] Verifique formatação em "Contas a Pagar"
- [ ] Deve exibir: R$ 9.999.999,99

### Teste 9: Datas Vencidas

- [ ] Crie um lançamento com data de vencimento ontem
- [ ] Em "Contas a Pagar", a linha deve ter aviso ⚠️

### Teste 10: Fornecedor Não Cadastrado

- [ ] Crie um lançamento com fornecedor que não existe
- [ ] Sincronize
- [ ] Verifique se a conta é criada com fornecedor_id = NULL

---

## 🔧 Troubleshooting Rápido

### ❌ "Erro ao buscar dados do servidor"
**Solução:**
```bash
# Verifique se servidor está rodando
netstat -an | grep 3000

# Reinicie o servidor
node server.js
```

### ❌ "Não autorizado" (403/401)
**Solução:**
```sql
-- Verifique se usuário MySQL tem permissões
GRANT ALL PRIVILEGES ON sistema_contabil.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### ❌ "Erro de conexão com banco de dados"
**Solução:**
```bash
# Verifique se MySQL está rodando
mysql -u root -p

# Se não existir BD, crie:
CREATE DATABASE sistema_contabil;
```

### ❌ "Contas não aparecem depois de 5 segundos"
**Solução:**
```bash
# Abra console (F12) e execute:
fetch('http://localhost:3000/api/contas-pagar').then(r => r.json()).then(d => console.log(d))
```

---

## 📊 Pontuação de Sucesso

Total de checklist: **35+ itens**

**95-100% ✅** - Sistema totalmente funcional
**85-94% ⚠️** - Funcional com pequenos ajustes
**<85% ❌** - Precisa de mais investigação

---

## 📞 Próximos Passos Recomendados

Após passar em todos os testes:

1. **Adicionar botão ao menu principal**
   ```html
   <a href="sincronizar-contas.html">📊 Sincronizar Contas</a>
   ```

2. **Integrar formulário melhorado**
   - Use o arquivo `EXEMPLO_FORMULARIO_LANCAMENTO.html`
   - Copie o código para `lancamentos.html`

3. **Criar relatórios de contas a pagar**
   - Filtro por período
   - Filtro por status
   - Exportar para PDF/Excel

4. **Implementar automação adicional**
   - Alertas de vencimento próximo
   - Envio de notificações
   - Integração com extrato bancário

---

## 📝 Logs para Monitorar

### Log do Servidor
```
✅ Conectado ao MySQL com sucesso!
✅ Servidor rodando em http://localhost:3000
✅ Conta a pagar criada automaticamente!
```

### Log do Navegador (F12 Console)
```
Deve haver algumas requisições GET/POST
Procure por "Erro ao..." para problemas
```

---

## 🎓 Documentação de Referência

Consultae quando necessário:
- `GUIA_CONTAS_PAGAR.md` - Guia completo técnico
- `RESUMO_ALTERACOES.md` - O que foi implementado
- `FLUXO_CONTAS_PAGAR.txt` - Fluxo visual de dados
- `EXEMPLO_FORMULARIO_LANCAMENTO.html` - Exemplo de integração

---

**Última atualização:** 13 de Abril de 2026
**Status:** ✅ Sistema pronto para testes

