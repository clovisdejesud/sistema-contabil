const API_URL = 'http://localhost:3000';

// 🔹 Plano de contas
async function buscarPlanoContas() {
  const res = await fetch(`${API_URL}/contas`);
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