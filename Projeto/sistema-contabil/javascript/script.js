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
    'contas-pagar': renderContasPagar,
    'fornecedores': renderFornecedores
  };

  content.innerHTML = pages[page] ? pages[page]() : 'Página não encontrada';

  // 🔥 Gatilhos de dados
  if (page === 'plano-contas') {
    setTimeout(carregarPlanoContas, 100);
  }

  if (page === 'contas-pagar') {
    setTimeout(carregarContasPagar, 100);
  }

  if (page === 'fornecedores') {                       
    setTimeout(buscarFornecedoresDoBanco, 100);       
}  

  lucide.createIcons();
}

function renderPage(page) { 
  const content = document.getElementById('page-content');

  if (!content) return; // 🔥 evita erro em outras páginas

  const pages = {
    dashboard: renderDashboard,
    'plano-contas': renderPlanoContas,
    'contas-pagar': renderContasPagar,
    'fornecedores': renderFornecedores
  };

  content.innerHTML = pages[page] ? pages[page]() : 'Página não encontrada';
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
  const tbody = document.getElementById('corpo-plano-contas');
  try {
    const response = await fetch('http://localhost:3000/api/plano-contas');
    if (!response.ok) throw new Error('Erro na API');
    const dados = await response.json();
    tbody.innerHTML = '';

    if (dados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhuma conta cadastrada.</td></tr>';
      return;
    }

    dados.forEach(c => {
      tbody.innerHTML += `
        <tr>
          <td>${c.codigo_conta}</td>
          <td>${c.nome_conta}</td>
          <td>${c.tipo_conta}</td>
          <td>${c.natureza}</td>
        </tr>`;
    });
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center;">Erro ao carregar dados.</td></tr>';
  }
}

function renderContasPagar() {
  return `
    <h2>Contas a Pagar</h2>
    <table border="1" width="100%">
      <thead>
        <tr>
          <th>Vencimento</th>
          <th>Valor</th>
          <th>Fornecedor</th>
          <th>Descrição</th>
        </tr>
      </thead>
      <tbody id="corpo-contas-pagar">
        <tr><td colspan="4">Carregando...</td></tr>
      </tbody>
    </table>
  `;
}

// ── CONTAS A PAGAR ───────────────────────
async function buscarContasPagar() {
    const response = await fetch('http://localhost:3000/api/contas-pagar');
    if (!response.ok) throw new Error('Erro na requisição');
    return await response.json();
}

async function carregarContasPagar() {
    try {
        let dados = await buscarContasPagar();
        const tbody = document.getElementById('corpo-contas-pagar');
        const hoje = new Date().toISOString().split('T')[0]; // Data atual (YYYY-MM-DD)

        tbody.innerHTML = '';

        if (!dados || dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Nenhuma conta encontrada.</td></tr>';
            return;
        }

        // --- LÓGICA DE ORDENAÇÃO ---
        dados.sort((a, b) => {
            // Converte para data para garantir comparação precisa
            const dataA = new Date(a.data_vencimento);
            const dataB = new Date(b.data_vencimento);
            return dataA - dataB; // Ordem crescente (mais antigas/vencidas primeiro)
        });

        // --- RENDERIZAÇÃO ---
        dados.forEach(c => {
            // Verifica se está vencido (comparando strings YYYY-MM-DD)
            const isVencido = c.data_vencimento < hoje && c.status !== 'PAGO';
            
            // Formata a data para PT-BR
            const dataFormatada = c.data_vencimento 
                ? new Date(c.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) 
                : '-';

            // Formata o valor para Moeda
            const valorFormatado = c.valor 
                ? Number(c.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                : '-';

            tbody.innerHTML += `
                <tr style="${isVencido ? 'color: #e63946; font-weight: bold;' : ''}">
                    <td>${isVencido ? '⚠️ ' : ''}${dataFormatada}</td>
                    <td>${valorFormatado}</td>
                    <td>${c.fornecedor ?? '-'}</td>
                    <td>${c.descricao ?? '-'}</td>
                </tr>
            `;
        });
    } catch (err) {
        document.getElementById('corpo-contas-pagar').innerHTML =
            `<tr><td colspan="4">❌ Erro ao carregar: ${err.message}</td></tr>`;
    }
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
  const content = document.getElementById('page-content');

  // Só roda se estiver na página principal
  if (content) {
    navigateTo('dashboard');
  }
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
// ── FORMULÁRIO DE CLIENTES ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCliente');
    if (!form) return;

    const tipoPessoa = form.tipo_pessoa;
    const campoDocumento = form.documento;

    // 🔁 Troca placeholder CPF/CNPJ
    tipoPessoa.addEventListener("change", () => {
        campoDocumento.value = "";

        if (tipoPessoa.value === "JURIDICA") {
            campoDocumento.placeholder = "00.000.000/0000-00";
        } else {
            campoDocumento.placeholder = "000.000.000-00";
        }
    });

    // 🎭 Máscara CPF/CNPJ
    campoDocumento.addEventListener("input", () => {
        let valor = campoDocumento.value.replace(/\D/g, "");

        if (tipoPessoa.value === "JURIDICA") {
            valor = valor
                .replace(/^(\d{2})(\d)/, "$1.$2")
                .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/\.(\d{3})(\d)/, ".$1/$2")
                .replace(/(\d{4})(\d)/, "$1-$2");
        } else {
            valor = valor
                .replace(/^(\d{3})(\d)/, "$1.$2")
                .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
                .replace(/\.(\d{3})(\d)/, ".$1-$2");
        }

        campoDocumento.value = valor;
    });

    // 🚀 Envio do formulário (AJUSTADO)
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const tipo = this.tipo_pessoa.value;
        const documentoLimpo = this.documento.value.replace(/\D/g, "");

        let cpf = null;
        let cnpj = null;

        if (tipo === "JURIDICA") {
            cnpj = documentoLimpo;
        } else {
            cpf = documentoLimpo;
        }

        const dados = {
            razao_social: this.razao_social.value,
            nome_fantasia: this.nome_fantasia.value,
            tipo_pessoa: tipo,
            cpf: cpf,
            cnpj: cnpj,
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

// ITEM 3: Listener para o formulário de Fornecedores (No script.js)
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'formFornecedor') {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const dados = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('http://localhost:3000/api/fornecedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (response.ok) {
                alert('Fornecedor cadastrado com sucesso!');
                e.target.reset();
            } else {
                alert('Erro ao salvar fornecedor.');
            }
        } catch (error) {
            console.error(error);
        }
    }
});

// ── FORNECEDORES ─────────────────────────────────────────────────
function renderFornecedores() {
    return `
    <div class="stat-card">
        <div class="card-header-contabil">
            <h2 style="font-size:16px; font-weight:700; color:var(--text); margin:0;">Cadastro de Fornecedores</h2>
            <button class="btn-novo" onclick="window.open('fornecedores/novo.html', '_blank')">+ Novo Fornecedor</button>
        </div>
        <hr style="border:0; border-top:1px solid var(--border); margin:20px 0;">
        <div style="overflow-x:auto;">
            <table class="tabela-contabil">
                <thead>
                    <tr>
                        <th>Razão Social / Fantasia</th>
                        <th>CPF/CNPJ</th>
                        <th>Regime Tributário</th>
                        <th>Contato (E-mail/Tel)</th>
                        <th>Cidade / UF</th>
                        <th>Status</th>
                        <th style="text-align:right;">Ações</th>
                    </tr>
                </thead>
                <tbody id="corpo-tabela-fornecedores">
                    <tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">Conectando ao servidor...</td></tr>
                </tbody>
            </table>
        </div>
    </div>`;
}

async function buscarFornecedoresDoBanco() {
    try {
        const response = await fetch('http://localhost:3000/api/fornecedores');
        if (!response.ok) throw new Error('Falha na comunicação com o servidor');

        const fornecedores = await response.json();
        const tbody = document.getElementById('corpo-tabela-fornecedores');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (fornecedores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Nenhum fornecedor cadastrado.</td></tr>';
            return;
        }

        fornecedores.forEach(f => {
            const documento = f.tipo_pessoa === 'JURIDICA' ? f.cnpj : f.cpf;
            const statusLabel = parseInt(f.ativo)
                ? '<span class="badge-ativo">Ativo</span>'
                : '<span class="badge-inativo">Inativo</span>';

            tbody.innerHTML += `
                <tr class="table-row-contabil">
                    <td>
                        <div style="font-weight:600; color:var(--text);">${f.razao_social}</div>
                        <div style="font-size:11px; color:var(--text-muted);">${f.nome_fantasia || '---'}</div>
                    </td>
                    <td style="font-family:'DM Mono'; font-size:12px;">${documento || '---'}</td>
                    <td style="font-size:12px;">${f.regime_tributario || '---'}</td>
                    <td style="font-size:12px;">
                        <div>${f.email || '---'}</div>
                        <div style="color:var(--text-muted);">${f.telefone || ''}</div>
                    </td>
                    <td style="font-size:12px;">
                        <div>${f.cidade || '---'}</div>
                        <div style="color:var(--text-muted); font-weight:600;">${f.estado || ''}</div>
                    </td>
                    <td>${statusLabel}</td>
                    <td style="text-align:right;">
                        <button class="btn-icon" onclick="editarFornecedor(${f.id})"><i data-lucide="pencil"></i></button>
                        <button class="btn-icon" onclick="deletarFornecedor(${f.id})"><i data-lucide="trash-2"></i></button>
                    </td>
                </tr>`;
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (error) {
        console.error("Erro:", error);
        document.getElementById('corpo-tabela-fornecedores').innerHTML =
            '<tr><td colspan="7" style="text-align:center; color:red; padding:20px;">Erro ao carregar dados do MySQL.</td></tr>';
    }
}

async function deletarFornecedor(id) {
    if (!confirm('Deseja realmente excluir este fornecedor?')) return;
    try {
        const response = await fetch(`http://localhost:3000/api/fornecedores/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Fornecedor excluído!');
            buscarFornecedoresDoBanco();
        } else {
            alert('Erro ao excluir.');
        }
    } catch (error) {
        alert('Erro ao conectar ao servidor: ' + error.message);
    }
}

function editarFornecedor(id) {
    window.open(`fornecedores/novo.html?id=${id}`, '_blank');
}

