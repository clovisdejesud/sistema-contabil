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

//Clientes
// ── Função de Renderização da Interface ────────────────────────────────
function renderClientes() {
    // Agenda a busca de dados assim que o HTML for injetado
    setTimeout(() => {
        buscarClientesDoBanco();
    }, 100);

    return `
    <div class="stat-card">
        <div class="card-header-contabil">
            <h2 style="font-size:16px; font-weight:700; color:var(--text); margin:0;">Cadastro de Clientes</h2>
            <button class="btn-novo" onclick="abrirModalCliente()">+ Novo Cliente</button>
        </div>

        <hr style="border:0; border-top:1px solid var(--border); margin:20px 0;">

        <div style="overflow-x:auto;">
            <table class="tabela-contabil">
                <thead>
                    <tr>
                        <th>Razão Social / Fantasia</th>
                        <th>CPF/CNPJ</th>
                        <th>Contato (E-mail/Tel)</th>
                        <th>Limite de Crédito</th>
                        <th>Status</th>
                        <th style="text-align:right;">Ações</th>
                    </tr>
                </thead>
                <tbody id="corpo-tabela-clientes">
                    <tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">Conectando ao servidor...</td></tr>
                </tbody>
            </table>
        </div>
    </div>`;
}

// ── Função de Integração com o Backend (MySQL) ───────────────────────
async function buscarClientesDoBanco() {
    try {
        const response = await fetch('http://localhost:3000/api/clientes');
        if (!response.ok) throw new Error('Falha na comunicação com o servidor');
        
        const clientes = await response.json();
        const tbody = document.getElementById('corpo-tabela-clientes');
        
        if (!tbody) return;
        tbody.innerHTML = ''; 

        if (clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Nenhum cliente cadastrado.</td></tr>';
            return;
        }

        clientes.forEach(c => {
            // Lógica para decidir qual documento exibir
            const documento = c.tipo_pessoa === 'JURIDICA' ? c.cnpj : c.cpf;
            const statusLabel = c.ativo ? '<span class="badge-ativo">Ativo</span>' : '<span class="badge-inativo">Inativo</span>';
            
            tbody.innerHTML += `
                <tr class="table-row-contabil">
                    <td>
                        <div style="font-weight:600; color:var(--text);">${c.razao_social}</div>
                        <div style="font-size:11px; color:var(--text-muted);">${c.nome_fantasia || '---'}</div>
                    </td>
                    <td style="font-family:'DM Mono'; font-size:12px;">${documento}</td>
                    <td style="font-size:12px;">
                        <div>${c.email}</div>
                        <div style="color:var(--text-muted);">${c.celular || c.telefone || ''}</div>
                    </td>
                    <td style="font-weight:700; color:rgb(0, 0, 139);">
                        R$ ${parseFloat(c.limite_credito || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                    <td>${statusLabel}</td>
                    <td style="text-align:right;">
                        <button class="btn-icon" onclick="editarCliente(${c.id})"><i data-lucide="pencil"></i></button>
                        <button class="btn-icon" onclick="deletarCliente(${c.id})"><i data-lucide="trash-2"></i></button>
                    </td>
                </tr>`;
        });

        // Recarrega os ícones da biblioteca Lucide
        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (error) {
        console.error("Erro:", error);
        document.getElementById('corpo-tabela-clientes').innerHTML = 
            '<tr><td colspan="6" style="text-align:center; color:red; padding:20px;">Erro ao carregar dados do MySQL.</td></tr>';
    }
}

//Clientes
// ── FORMULÁRIO DE CLIENTES ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCliente');
    if (!form) return; // só executa se estiver na página de clientes

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const dados = {
            razao_social: this.razao_social.value,
            nome_fantasia: this.nome_fantasia.value,
            tipo_pessoa: this.tipo_pessoa.value,
            documento: this.documento.value,
            inscricao_estadual: this.inscricao_estadual.value,
            email: this.email.value,
            celular: this.celular.value,
            limite_credito: this.limite_credito.value,
            inscricao_municipal: this.inscricao_municipal.value,
            data_nascimento: this.data_nascimento.value
        };

        try {
            const response = await fetch('http://localhost:3000/api/clientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Cliente cadastrado com sucesso!');
                form.reset();
            } else {
                alert('Erro: ' + result.error);
            }
        } catch (error) {
            alert('Erro ao conectar ao servidor: ' + error.message);
        }
    });
});

