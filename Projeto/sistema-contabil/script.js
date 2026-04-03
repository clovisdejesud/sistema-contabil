let currentPage = 'dashboard';

// ── NAVIGAÇÃO ─────────────────────────────
function navigateTo(page) {
  currentPage = page;

  document.querySelectorAll('.sidebar-item')
    .forEach(el => el.classList.remove('active'));

  document.querySelector(`[data-page="${page}"]`)
    ?.classList.add('active');

  renderPage(page);
}

// ── RENDERIZAÇÃO ─────────────────────────
function renderPage(page) {
  const content = document.getElementById('page-content');

  const pages = {
    dashboard: renderDashboard,
    'plano-contas': renderPlanoContas,
    'contas-pagar': renderContasPagar
  };

  content.innerHTML = pages[page] ? pages[page]() : 'Página não encontrada';

  // 🔥 Gatilhos de dados
  if (page === 'plano-contas') {
    setTimeout(carregarPlanoContas, 100);
  }

  if (page === 'contas-pagar') {
    setTimeout(carregarContasPagar, 100);
  }

  lucide.createIcons();
}

// ── DASHBOARD ────────────────────────────
function renderDashboard() {
  return `<h1>Dashboard</h1>`;
}

// ── PLANO DE CONTAS ──────────────────────
function renderPlanoContas() {
  return `
    <h2>Plano de Contas</h2>
    <table border="1" width="100%">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nome</th>
          <th>Tipo</th>
          <th>Natureza</th>
        </tr>
      </thead>
      <tbody id="corpo-plano-contas">
        <tr><td colspan="4">Carregando...</td></tr>
      </tbody>
    </table>
  `;
}

async function carregarPlanoContas() {
  const dados = await buscarPlanoContas();

  const tbody = document.getElementById('corpo-plano-contas');
  tbody.innerHTML = '';

  dados.forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td>${c.codigo_conta}</td>
        <td>${c.nome_conta}</td>
        <td>${c.tipo_conta}</td>
        <td>${c.natureza}</td>
      </tr>
    `;
  });
}

// ── CONTAS A PAGAR ───────────────────────
function renderContasPagar() {
  return `
    <h2>Contas a Pagar</h2>

    <form id="form">
      <input placeholder="Descrição" id="desc">
      <input placeholder="Valor" id="valor">
      <button type="submit">Salvar</button>
    </form>

    <table border="1" width="100%">
      <tbody id="corpo-contas-pagar">
        <tr><td>Carregando...</td></tr>
      </tbody>
    </table>
  `;
}

async function carregarContasPagar() {
  const dados = await buscarContasPagar();

  const tbody = document.getElementById('corpo-contas-pagar');
  tbody.innerHTML = '';

  dados.forEach(c => {
    tbody.innerHTML += `
      <tr>
        <td>${c.data_vencimento}</td>
        <td>${c.valor}</td>
        <td>${c.fornecedor}</td>
        <td>${c.descricao}</td>
      </tr>
    `;
  });
}

// ── FORM SUBMIT ──────────────────────────
document.addEventListener('submit', async (e) => {
  if (e.target.id === 'form') {
    e.preventDefault();

    const dados = {
      descricao: document.getElementById('desc').value,
      valor: document.getElementById('valor').value
    };

    await salvarConta(dados);

    alert('Salvo!');
    carregarContasPagar();
  }
   else if (e.target.id === 'form-lancamento') {
        const dados = {
            data_lancamento: document.getElementById('lan_data').value,
            id_conta_debito: document.getElementById('lan_debito').value,
            id_conta_credito: document.getElementById('lan_credito').value,
            valor: document.getElementById('lan_valor').value,
            historico: document.getElementById('lan_historico').value
        };

        try {
            
            alert('Lançamento realizado!');
            e.target.reset();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    }
});

// ── INIT ────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  navigateTo('dashboard');
});

