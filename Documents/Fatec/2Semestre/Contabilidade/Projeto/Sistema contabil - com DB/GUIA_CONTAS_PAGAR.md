# 📋 Guia: Poblando Contas a Pagar a Partir de Lançamentos

## 🎯 O que foi implementado?

Agora você tem **3 formas** de popular a tabela de **Contas a Pagar** baseada em **Lançamentos**:

---

## 1️⃣ **Automático ao Criar Lançamento** ✨

Quando você cria um lançamento contábil com uma **conta de crédito de contas a pagar**, uma entrada automática é criada em **contas_pagar**.

### Como funciona:
- Você registra um lançamento em `lancamentos.html`
- Sistema detecta se a conta de crédito é de "contas a pagar"
- Automaticamente cria um registro em `contas_pagar`

### Dados enviados no formulário:
```javascript
{
  data_lancamento: "2024-01-15",           // Data do lançamento
  id_conta_debito: 1,                      // ID da conta que debita
  id_conta_credito: 210,                   // ID da conta que credita (CONTAS A PAGAR)
  valor: 1000.00,                          // Valor da transação
  fornecedor: "Empresa XYZ",               // Nome do fornecedor
  historico: "Compra de materiais",        // Histórico/Descrição
  data_vencimento: "2024-02-15",           // Data de vencimento
  data_emissao: "2024-01-15"               // Data de emissão
}
```

---

## 2️⃣ **Gerar em Lote** 🚀

Você pode gerar todas as contas a pagar de lançamentos existentes de uma vez.

### Via API:
```javascript
// No console do navegador ou em seu JavaScript
await gerarContasPagarDeLancamentos()
  .then(resultado => {
    console.log(`✅ ${resultado.processados} contas criadas`);
  })
  .catch(erro => console.error(erro));
```

### Via cURL (Terminal):
```bash
curl -X POST http://localhost:3000/api/gerar-contas-pagar \
  -H "Content-Type: application/json"
```

### Resposta esperada:
```json
{
  "message": "Contas a pagar geradas com sucesso!",
  "processados": 5,
  "total": 5,
  "erros": []
}
```

---

## 3️⃣ **Manual via Formulário** 📝

Você pode continuar criando contas a pagar manualmente através de `contas-pagar.html` em **"Nova Conta"**.

---

## 🔧 Configuração das Contas

Para que a detecção automática funcione, certifique-se de que suas contas de **contas a pagar** no `plano_contas` tenham:
- **Descrição** contendo: `"pagar"` ou `"débito"` (case-insensitive)

**Exemplo:**
```sql
INSERT INTO plano_contas VALUES (210, 'Contas a Pagar - Fornecedores', 'pagar');
```

---

## 📊 Estrutura das Tabelas

### Tabela: `lancamentos`
```sql
CREATE TABLE lancamentos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  data_lancamento DATE NOT NULL,
  id_conta_debito INT NOT NULL,
  id_conta_credito INT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  fornecedor VARCHAR(255),
  historico TEXT,
  FOREIGN KEY (id_conta_debito) REFERENCES plano_contas(id),
  FOREIGN KEY (id_conta_credito) REFERENCES plano_contas(id)
);
```

### Tabela: `contas_pagar`
```sql
CREATE TABLE contas_pagar (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_lancamento INT NOT NULL,
  fornecedor_id INT,
  descricao TEXT,
  valor DECIMAL(12,2) NOT NULL,
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  status ENUM('Pendente', 'Pago', 'Cancelado') DEFAULT 'Pendente',
  FOREIGN KEY (id_lancamento) REFERENCES lancamentos(id),
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
);
```

---

## 🖥️ Endpoints da API

### GET `/api/lancamentos`
Retorna todos os lançamentos cadastrados.

**Resposta:**
```json
[
  {
    "id": 1,
    "data_lancamento": "2024-01-15",
    "id_conta_debito": 1,
    "id_conta_credito": 210,
    "valor": 1000.00,
    "fornecedor": "Empresa XYZ",
    "historico": "Compra de materiais",
    "nome_conta_debito": "Caixa",
    "nome_conta_credito": "Contas a Pagar"
  }
]
```

### POST `/api/lancamentos`
Cria um novo lançamento (e popula contas_pagar automaticamente).

**Request:**
```json
{
  "data_lancamento": "2024-01-15",
  "id_conta_debito": 1,
  "id_conta_credito": 210,
  "valor": 1000.00,
  "fornecedor": "Empresa XYZ",
  "historico": "Compra de materiais",
  "data_vencimento": "2024-02-15",
  "data_emissao": "2024-01-15"
}
```

### POST `/api/gerar-contas-pagar`
Popula contas a pagar com todos os lançamentos ainda não processados.

**Resposta:**
```json
{
  "message": "Contas a pagar geradas com sucesso!",
  "processados": 5,
  "total": 5,
  "erros": []
}
```

---

## 💡 Exemplo Prático

### Passo 1: Criar um Lançamento
```javascript
await salvarLancamento({
  data_lancamento: "2024-01-20",
  id_conta_debito: 5,        // Estoque
  id_conta_credito: 210,     // Contas a Pagar
  valor: 500.00,
  fornecedor: "Fornecedor ABC",
  historico: "Compra de matéria-prima",
  data_vencimento: "2024-02-20",
  data_emissao: "2024-01-20"
});
```

### Passo 2: Conta é criada automaticamente em `contas_pagar` ✅

### Passo 3: Visualizar em "Contas a Pagar"
- Vai aparecer automaticamente na tabela com:
  - **Vencimento:** 2024-02-20
  - **Fornecedor:** Fornecedor ABC
  - **Descrição:** Compra de matéria-prima
  - **Valor:** R$ 500,00
  - **Status:** Pendente

---

## ⚙️ Troubleshooting

### ❌ Contas não aparecem em "Contas a Pagar"
1. Verifique se a conta de crédito tem "pagar" ou "débito" na descrição
2. Verifique o console do navegador (F12) para erros
3. Verifique se o fornecedor existe em `fornecedores`

### ❌ Erro "Campos obrigatórios faltando"
- Certifique-se que todos os campos obrigatórios foram preenchidos:
  - `data_lancamento`
  - `id_conta_debito`
  - `id_conta_credito`
  - `valor`

---

## 📝 Próximos Passos Recomendados

1. Testar com dados reais
2. Criar um botão "Gerar Contas a Pagar" na interface para uso manual
3. Adicionar filtros de data/fornecedor
4. Implementar histórico de alterações

