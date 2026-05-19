const API_URL = 'http://localhost:3000';

// 🔹 Plano de contas
async function buscarPlanoContas() {
  const res = await fetch(`${API_URL}/api/plano-contas`);
  return await res.json();
}

// 🔹 Contas a pagar
async function buscarContasPagar() {
  const res = await fetch(`${API_URL}/api/contas-pagar`);
  return await res.json();
}
// 🔹 Salvar conta
async function salvarConta(dados) {
  await fetch(`${API_URL}/api/contas-pagar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
}

//Lançamentos
//Salvar Lançamento Contábil (Débito/Crédito)
async function salvarLancamento(dados) {
  const res = await fetch(`${API_URL}/api/lancamentos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Erro ao salvar lançamento');
  }
  
  return await res.json();
}

// 🔹 Listar Lançamentos Contábeis
async function buscarLancamentos() {
  const res = await fetch(`${API_URL}/api/lancamentos`);
  if (!res.ok) throw new Error('Erro ao buscar lançamentos');
  return await res.json();
}

// 🔹 Gerar Contas a Pagar a partir de Lançamentos
async function gerarContasPagarDeLancamentos() {
  const res = await fetch(`${API_URL}/api/gerar-contas-pagar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Erro ao gerar contas a pagar');
  }
  
  return await res.json();
}

// 🔹 Buscar diário de lançamentos por dia
async function buscarDiarios() {
  const res = await fetch(`${API_URL}/api/diarios`);
  if (!res.ok) throw new Error('Erro ao buscar diário');
  return await res.json();
}

// 🔹 Popular diário com lançamentos
async function popularDiarios() {
  const res = await fetch(`${API_URL}/api/diarios/popular`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Erro ao popular diário');
  }
  
  return await res.json();
}

//Clientes
async function cadastrarEmpresa(dados) {
    const resposta = await fetch('http://localhost:3000/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
    
    if (resposta.ok) {
        alert("Empresa cadastrada com sucesso!");
    }
}

async function buscarClientes() {
  const res = await fetch(`${API_URL}/api/clientes`);
  if (!res.ok) throw new Error('Erro ao buscar clientes');
  return await res.json();
}

async function buscarFornecedores() {
  const res = await fetch(`${API_URL}/api/fornecedores`);
  if (!res.ok) throw new Error('Erro ao buscar fornecedores');
  return await res.json();
}

// 🔹 Dashboard
async function buscarDashboard() {
  const res = await fetch(`${API_URL}/api/dashboard`);
  if (!res.ok) throw new Error('Erro ao buscar indicadores do dashboard');
  return await res.json();
}

// 🔹 Livro Razão
async function buscarLivroRazao() {
  const res = await fetch(`${API_URL}/api/livro-razao`);
  return await res.json();
}

// 🔹 DRE
async function buscarDRE() {
  const res = await fetch(`${API_URL}/api/dre`);
  if (!res.ok) throw new Error('Erro ao buscar DRE');
  return await res.json();
}

async function confirmarDRE(dados) {
  const res = await fetch(`${API_URL}/api/dre/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro ao confirmar DRE');
  }
  return await res.json();
}

function normalizarTexto(texto) {
  return texto
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, "")
    .trim();
}