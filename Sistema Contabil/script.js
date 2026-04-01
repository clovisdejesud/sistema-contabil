// ── State ──────────────────────────────────────────────────────────────
let currentPage = 'dashboard';
let notifOpen = false;

// ── Navigation ─────────────────────────────────────────────────────────
function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.sidebar-item[data-page]').forEach(el => el.classList.remove('active'));
  const activeEl = document.querySelector(`.sidebar-item[data-page="${page}"]`);
  if (activeEl) activeEl.classList.add('active');
  renderPage(page);
}

function toggleMenu(id, btn) {
  const menu = document.getElementById(id);
  menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
  btn.classList.toggle('collapsed');
}

function toggleNotif() {
  notifOpen = !notifOpen;
  document.getElementById('notif-panel').style.display = notifOpen ? 'block' : 'none';
}

document.addEventListener('click', (e) => {
  if (notifOpen && !e.target.closest('#notif-panel') && !e.target.closest('button[onclick="toggleNotif()"]')) {
    notifOpen = false;
    document.getElementById('notif-panel').style.display = 'none';
  }
});

// ── Page Metadata ───────────────────────────────────────────────────────
const pageMeta = {
  'dashboard':       { title: 'Dashboard',             breadcrumb: 'Visão geral do sistema' },
  'clientes':        { title: 'Clientes',              breadcrumb: 'Cadastro → Clientes' },
  'fornecedores':    { title: 'Fornecedores',          breadcrumb: 'Cadastro → Fornecedores' },
  'funcionarios':    { title: 'Funcionários',          breadcrumb: 'Cadastro → Funcionários' },
  'produtos':        { title: 'Produtos / Serviços',   breadcrumb: 'Cadastro → Produtos' },
  'plano-contas':    { title: 'Plano de Contas',       breadcrumb: 'Cadastro → Plano de Contas' },
  'contas-pagar':    { title: 'Contas a Pagar',        breadcrumb: 'Financeiro → Contas a Pagar' },
  'contas-receber':  { title: 'Contas a Receber',      breadcrumb: 'Financeiro → Contas a Receber' },
  'fluxo-caixa':     { title: 'Fluxo de Caixa',        breadcrumb: 'Financeiro → Fluxo de Caixa' },
  'conciliacao':     { title: 'Conciliação Bancária',  breadcrumb: 'Financeiro → Conciliação' },
  'lancamentos':     { title: 'Lançamentos Contábeis', breadcrumb: 'Contabilidade → Lançamentos' },
  'balancete':       { title: 'Balancete',             breadcrumb: 'Contabilidade → Balancete' },
  'dre':             { title: 'DRE',                   breadcrumb: 'Contabilidade → Demonstração do Resultado' },
  'livro-diario':    { title: 'Livro Diário',          breadcrumb: 'Contabilidade → Livro Diário' },
  'livro-razao':     { title: 'Livro Razão',           breadcrumb: 'Contabilidade → Livro Razão' },
  'folha':           { title: 'Folha de Pagamento',    breadcrumb: 'RH → Folha de Pagamento' },
  'ponto':           { title: 'Relatórios de Ponto',   breadcrumb: 'RH → Relatórios de Ponto' },
  'relat-vendas':    { title: 'Relatório de Vendas',   breadcrumb: 'Relatórios → Vendas' },
  'relat-compras':   { title: 'Relatório de Compras',  breadcrumb: 'Relatórios → Compras' },
  'relat-despesas':  { title: 'Relatório de Despesas', breadcrumb: 'Relatórios → Despesas' },
  'balanco':         { title: 'Balanço Patrimonial',   breadcrumb: 'Relatórios → Balanço' },
  'config':          { title: 'Configurações',         breadcrumb: 'Sistema → Configurações' },
};

// ── Render Page ─────────────────────────────────────────────────────────
function renderPage(page) {
  const meta = pageMeta[page] || { title: page, breadcrumb: '' };
  document.getElementById('page-title').textContent = meta.title;
  document.getElementById('page-breadcrumb').textContent = meta.breadcrumb;
  const content = document.getElementById('page-content');

  const renders = {
    'dashboard': renderDashboard,
    'clientes': () => renderCadastroTable('Clientes', ['Nome','CNPJ/CPF','Cidade','Contato','Status'], [
      ['Tech Solutions Ltda.','12.345.678/0001-99','São Paulo','(11) 9 9999-1111','<span class="badge" style="background:#30c97e22; color:#30c97e; padding:2px 8px; border-radius:10px; font-size:11px;">Ativo</span>'],
      ['Maria Consultoria S.A.','98.765.432/0001-11','Rio de Janeiro','(21) 9 8888-2222','<span class="badge" style="background:#30c97e22; color:#30c97e; padding:2px 8px; border-radius:10px; font-size:11px;">Ativo</span>'],
      ['Comércio Norte Ltda.','11.222.333/0001-44','Manaus','(92) 9 7777-3333','<span class="badge" style="background:#f5a62322; color:#f5a623; padding:2px 8px; border-radius:10px; font-size:11px;">Inativo</span>'],
    ]),
    'fornecedores': () => renderCadastroTable('Fornecedores', ['Razão Social','CNPJ','Segmento','Contato','Status'], [
      ['Distribuidora Alfa','22.333.444/0001-55','Materiais','(11) 3333-4444','<span class="badge" style="background:#30c97e22; color:#30c97e; padding:2px 8px; border-radius:10px; font-size:11px;">Ativo</span>'],
      ['Papelaria Beta Ltda.','33.444.555/0001-66','Escritório','(11) 4444-5555','<span class="badge" style="background:#30c97e22; color:#30c97e; padding:2px 8px; border-radius:10px; font-size:11px;">Ativo</span>'],
    ]),
    'funcionarios': () => renderCadastroTable('Funcionários', ['Nome','CPF','Cargo','Departamento','Admissão'], [
      ['Carlos Silva','123.456.789-00','Contador','Financeiro','01/03/2021'],
      ['Ana Souza','987.654.321-00','Analista','RH','15/07/2022'],
      ['João Pereira','456.789.123-00','Assistente','Administrativo','10/01/2023'],
    ]),
    'produtos': () => renderCadastroTable('Produtos / Serviços', ['Código','Descrição','Tipo','Unid.','Preço'], [
      ['P001','Consultoria Contábil','Serviço','Hr','R$ 250,00'],
      ['P002','Software de Gestão','Produto','Unid.','R$ 1.800,00'],
      ['P003','Auditoria Anual','Serviço','Cj.','R$ 8.500,00'],
    ]),
    'plano-contas': renderPlanoContas,
    'contas-pagar': () => renderContasTable('Contas a Pagar', 'pagar'),
    'contas-receber': () => renderContasTable('Contas a Receber', 'receber'),
    'fluxo-caixa': renderFluxoCaixa,
    'conciliacao': renderConciliacao,
    'lancamentos': renderLancamentos,
    'balancete': renderBalancete,
    'dre': renderDRE,
    'livro-diario': renderLivroDiario,
    'livro-razao': renderLivroRazao,
    'folha': renderFolha,
    'ponto': renderPonto,
    'relat-vendas': renderRelatVendas,
    'relat-compras': () => renderGenericRelat('Compras', 'Distribuidora Alfa', 'Papelaria Beta', 'Fornec. Gama'),
    'relat-despesas': renderRelatDespesas,
    'balanco': renderBalanco,
    'config': renderConfig,
  };

  if (renders[page]) {
    content.innerHTML = renders[page]();

    // --- ADICIONE ESTE BLOCO ABAIXO ---
    // Se a página aberta for 'contas-pagar', dispara as funções de banco de dados
    if (page === 'contas-pagar') {
      // Usamos um pequeno atraso (timeout) para garantir que o HTML 
      // já apareceu na tela antes de tentarmos preencher a tabela
      setTimeout(() => {
        console.log("Página de Contas a Pagar detectada. Buscando dados...");
        if (typeof carregarCategoriasNoSelect === 'function') carregarCategoriasNoSelect();
        if (typeof buscarContasPagarDoBanco === 'function') buscarContasPagarDoBanco();
      }, 100);
    }
    // ----------------------------------

  } else {
    content.innerHTML = `<div style="color:var(--text-muted);padding:40px;text-align:center;">Página em desenvolvimento</div>`;
  }

  // Atualiza os ícones da biblioteca Lucide, se houver
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

  // --- ADICIONADO: Gatilho para carregar dados do Banco de Dados ---
  if (page === 'contas-pagar') {
    // Timeout pequeno para garantir que o HTML foi injetado antes de buscar os IDs
    setTimeout(() => {
      carregarCategoriasNoSelect();
      buscarContasPagarDoBanco();
    }, 50);
  }
  
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ── Component Helpers ───────────────────────────────────────────────────
function cardHeader(title, btn = '') {
  return `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
    <h2 style="font-size:15px;font-weight:700;color:var(--text);margin:0;">${title}</h2>
    ${btn ? `<button style="background:linear-gradient(135deg,#4f8ef7,#7c5cfc);border:none;border-radius:8px;padding:7px 14px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;">${btn}</button>` : ''}
  </div>`;
}

function tableWrap(headers, rows) {
  return `<div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid var(--border);">
          ${headers.map(h => `<th style="text-align:left;padding:10px 12px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">${h}</th>`).join('')}
          <th style="text-align:right;padding:10px 12px;font-size:11px;font-weight:700;color:var(--text-muted);">Ações</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `<tr style="border-bottom:1px solid var(--border);">
          ${r.map(c => `<td style="padding:11px 12px;font-size:13px;color:var(--text);">${c}</td>`).join('')}
          <td style="padding:11px 12px;text-align:right;">
            <button style="color:var(--text-muted);margin-right:8px;"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
            <button style="color:var(--text-muted);"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// ── DASHBOARD (COMPLETO) ────────────────────────────────────────────────
function renderDashboard() {
  return `
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
    ${[
      { label:'Receita Total', value:'R$ 148.320', icon:'trending-up', color:'#30c97e', delta:'+12,4%' },
      { label:'Contas a Pagar', value:'R$ 32.100', icon:'arrow-up-circle', color:'#f25c5c', delta:'8 vencimentos' },
      { label:'Contas a Receber', value:'R$ 67.540', icon:'arrow-down-circle', color:'#4f8ef7', delta:'12 em aberto' },
      { label:'Saldo em Caixa', value:'R$ 84.210', icon:'wallet', color:'#7c5cfc', delta:'+5,1%' },
    ].map(k => `
    <div style="background:var(--surface); padding:18px; border-radius:14px; border:1px solid var(--border);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;">
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">${k.label}</div>
          <div style="font-size:22px;font-weight:700;color:var(--text);font-family:'DM Mono',monospace;">${k.value}</div>
          <div style="font-size:11px;color:${k.color};margin-top:4px;">${k.delta}</div>
        </div>
        <div style="width:38px;height:38px;border-radius:10px;background:${k.color}22;display:flex;align-items:center;justify-content:center;">
          <i data-lucide="${k.icon}" style="width:18px;height:18px;color:${k.color};"></i>
        </div>
      </div>
    </div>`).join('')}
  </div>

  <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:24px;">
    <div style="background:var(--surface); padding:20px; border-radius:14px; border:1px solid var(--border);">
      ${cardHeader('Receita vs Despesa — 2025')}
      <div style="display:flex;align-items:flex-end;gap:14px;height:130px;padding-top:10px;">
        ${[{m:'Jan',r:72,d:55}, {m:'Fev',r:85,d:60}, {m:'Mar',r:68,d:52}, {m:'Abr',r:91,d:63}, {m:'Mai',r:100,d:71}, {m:'Jun',r:88,d:58}].map(b => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;height:100%;">
          <div style="flex:1;width:100%;display:flex;align-items:flex-end;gap:3px;">
            <div style="flex:1;height:${b.r}%;background:linear-gradient(180deg,#4f8ef7,#7c5cfc);border-radius:2px;"></div>
            <div style="flex:1;height:${b.d}%;background:rgba(242,92,92,0.65);border-radius:2px;"></div>
          </div>
          <div style="font-size:10px;color:var(--text-muted);">${b.m}</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="background:var(--surface); padding:20px; border-radius:14px; border:1px solid var(--border);">
      ${cardHeader('Distribuição de Custos')}
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${[{cat:'Pessoal',pct:42,c:'#4f8ef7'}, {cat:'Fornec.',pct:28,c:'#7c5cfc'}, {cat:'Impostos',pct:18,c:'#f5a623'}].map(d => `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>${d.cat}</span><span>${d.pct}%</span></div>
          <div style="height:6px;background:var(--surface2);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${d.pct}%;background:${d.c};"></div></div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// ── DRE (COMPLETO) ──────────────────────────────────────────────────────
function renderDRE() {
  const sections = [
    { title:'RECEITA BRUTA', items:[['Vendas de Serviços','148.320,00']], sign:'+', bold:true },
    { title:'(-) DEDUÇÕES', items:[['Impostos sobre Vendas','(14.832,00)']], sign:'-', bold:false },
    { title:'RECEITA LÍQUIDA', items:[], total:'133.488,00', sign:'=', bold:true },
    { title:'(-) CUSTOS', items:[['Custo dos Serviços Prestados','(62.000,00)']], sign:'-', bold:false },
    { title:'LUCRO BRUTO', items:[], total:'71.488,00', sign:'=', bold:true },
    { title:'(-) DESPESAS OPERACIONAIS', items:[['Adm.','(18.400,00)'],['Pessoal','(28.400,00)']], sign:'-', bold:false },
    { title:'LUCRO LÍQUIDO', items:[], total:'24.688,00', sign:'=', bold:true },
  ];
  return `<div style="background:var(--surface); padding:24px; border-radius:14px; border:1px solid var(--border);">
    ${cardHeader('Demonstração do Resultado — Jun/2025')}
    ${sections.map(s => `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;padding:8px 12px;background:${s.bold?'var(--surface2)':'transparent'};border-radius:8px;">
          <span style="font-weight:${s.bold?700:500};">${s.title}</span>
          ${s.total?`<span style="font-family:'DM Mono';">R$ ${s.total}</span>`:''}
        </div>
        ${s.items.map(i => `<div style="display:flex;justify-content:space-between;padding:6px 28px;font-size:13px;border-bottom:1px solid var(--border);"><span>${i[0]}</span><span style="font-family:'DM Mono';">R$ ${i[1]}</span></div>`).join('')}
      </div>`).join('')}
  </div>`;
}

// ── FOLHA DE PAGAMENTO (COMPLETO) ─────────────────────────────────────────
function renderFolha() {
  return `<div style="background:var(--surface); padding:24px; border-radius:14px; border:1px solid var(--border);">
    ${cardHeader('Folha de Pagamento — Junho 2025','Processar Folha')}
    ${tableWrap(['Funcionário','Cargo','Salário Bruto','Líquido'],[
      ['Carlos Silva','Contador','R$ 7.500','R$ 5.488'],
      ['Ana Souza','Analista','R$ 5.200','R$ 3.928'],
      ['João Pereira','Assistente','R$ 3.800','R$ 2.992'],
    ])}
    <div style="margin-top:20px;display:flex;gap:12px;">
        <div style="background:var(--surface2);padding:15px;border-radius:10px;flex:1;text-align:center;">
            <div style="font-size:11px;color:var(--text-muted);">Total Bruto</div>
            <div style="font-size:18px;font-weight:700;">R$ 16.500</div>
        </div>
        <div style="background:var(--surface2);padding:15px;border-radius:10px;flex:1;text-align:center;">
            <div style="font-size:11px;color:var(--text-muted);">Total Líquido</div>
            <div style="font-size:18px;font-weight:700;color:var(--success);">R$ 12.408</div>
        </div>
    </div>
  </div>`;
}



// ── RESTE DAS FUNÇÕES (PLACEHOLDERS REAIS) ───────────────────────────────
function renderPlanoContas() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Plano de Contas')} <p>Lógica de árvore de contas aqui...</p></div>`; }
function renderContasTable(t, type) {
  // Se for "pagar", renderiza o formulário e a tabela conectada ao banco
  if (type === 'pagar') {
    return `
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
      
      <div style="background: var(--surface); padding: 20px; border-radius: 14px; border: 1px solid var(--border); height: fit-content;">
        ${cardHeader('Novo Lançamento')}
        <form id="meuFormPagar" style="display: flex; flex-direction: column; gap: 12px;">
          <div>
            <label style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:4px;">Descrição</label>
            <input type="text" id="desc" required style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface2); color:var(--text);">
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:4px;">Vencimento</label>
              <input type="date" id="data_vencimento" required style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface2); color:var(--text);">
            </div>
            <div>
              <label style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:4px;">Valor (R$)</label>
              <input type="number" step="0.01" id="valor" required style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface2); color:var(--text);">
            </div>
          </div>

          <div>
            <label style="display:block; font-size:12px; color:var(--text-muted); margin-bottom:4px;">Plano de Contas</label>
            <select id="plano_conta_id" required style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--surface2); color:var(--text);">
              <option value="">Carregando categorias...</option>
            </select>
          </div>

          <input type="hidden" id="data_emissao" value="${new Date().toISOString().split('T')[0]}">
          <input type="hidden" id="fornecedor" value="Geral">

          <button type="submit" style="margin-top:10px; background:linear-gradient(135deg,#4f8ef7,#7c5cfc); color:white; border:none; padding:10px; border-radius:8px; font-weight:600; cursor:pointer;">
            Confirmar Lançamento
          </button>
        </form>
      </div>

      <div style="background: var(--surface); padding: 20px; border-radius: 14px; border: 1px solid var(--border);">
        ${cardHeader(t)}
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid var(--border);">
                <th style="text-align:left; padding:12px; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Vencimento</th>
                <th style="text-align:left; padding:12px; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Descrição</th>
                <th style="text-align:left; padding:12px; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Valor</th>
                <th style="text-align:left; padding:12px; font-size:11px; color:var(--text-muted); text-transform:uppercase;">Status</th>
              </tr>
            </thead>
            <tbody id="corpo-contas-pagar">
              <tr><td colspan="4" style="text-align:center; padding:20px; color:var(--text-muted);">Carregando dados...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  // Fallback para Contas a Receber (que faremos depois)
  return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader(t)} <p>Módulo de Contas a ${type} em desenvolvimento.</p></div>`;
}
function renderFluxoCaixa() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Fluxo de Caixa')}</div>`; }
function renderConciliacao() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Conciliação')}</div>`; }
function renderLancamentos() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Lançamentos')}</div>`; }
function renderBalancete() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Balancete')}</div>`; }
function renderLivroDiario() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Livro Diário')}</div>`; }
function renderLivroRazao() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Livro Razão')}</div>`; }
function renderPonto() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Relatório de Ponto')}</div>`; }
function renderRelatVendas() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Vendas')}</div>`; }
function renderRelatDespesas() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Despesas')}</div>`; }
function renderGenericRelat(t) { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader(t)}</div>`; }
function renderBalanco() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Balanço Patrimonial')}</div>`; }
function renderConfig() { return `<div style="background:var(--surface); padding:20px; border-radius:14px;">${cardHeader('Configurações')}</div>`; }

function renderCadastroTable(title, headers, rows) {
  return `<div style="background:var(--surface); padding:20px; border-radius:14px; border:1px solid var(--border);">
    ${cardHeader(title, '+ Novo')}
    ${tableWrap(headers, rows)}
  </div>`;
}

// ── FUNÇÕES DE INTEGRAÇÃO COM BANCO DE DADOS (NOVO BLOCO) ────────────────

// 1. Busca as categorias do Plano de Contas para o formulário
async function carregarCategoriasNoSelect() {
    try {
        const response = await fetch('http://localhost:3000/contas');
        const contas = await response.json();
        const select = document.getElementById('plano_conta_id');
        
        if (!select) return;

        select.innerHTML = '<option value="">Selecione uma conta...</option>';
        contas.forEach(conta => {
            if(conta.tipo_conta === 'Analítica') {
                const option = document.createElement('option');
                option.value = parseInt(conta.id);
                option.textContent = `${conta.codigo_conta} - ${conta.nome_conta}`;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

// 2. Busca a lista de contas a pagar (ordenada por vencimento)
async function buscarContasPagarDoBanco() {
    try {
        const response = await fetch('http://localhost:3000/api/contas-pagar');
        if (!response.ok) throw new Error('Erro na rede');
        
        const dados = await response.json();
        const tbody = document.getElementById('corpo-contas-pagar');
        
        if (!tbody) return;

        tbody.innerHTML = ''; // ISSO AQUI TIRA O "CARREGANDO..."

        if (dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Nenhum lançamento no banco.</td></tr>';
            return;
        }

        dados.forEach(item => {
            let classe = item.status === 'Atrasado' ? 'badge-red' : (item.status === 'Pago' ? 'badge-green' : 'badge-orange');
            
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 12px; font-family: 'DM Mono';">${new Date(item.data_vencimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                    <td style="padding: 12px;">${item.descricao}</td>
                    <td style="padding: 12px; font-weight: 700;">R$ ${parseFloat(item.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                    <td style="padding: 12px;"><span class="badge ${classe}">${item.status}</span></td>
                </tr>`;
        });
    } catch (error) {
        console.error("Erro ao buscar:", error);
        document.getElementById('corpo-contas-pagar').innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Erro ao conectar com o servidor.</td></tr>';
    }
}

// 3. Listener para o formulário (Delegated)
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'meuFormPagar') {
        e.preventDefault();
        
        const dados = {
            data_emissao: document.getElementById('data_emissao').value,
            data_vencimento: document.getElementById('data_vencimento').value,
            descricao: document.getElementById('desc').value,
            valor: document.getElementById('valor').value,
            fornecedor: document.getElementById('fornecedor').value,
            plano_conta_id: document.getElementById('plano_conta_id').value
        };

        try {
            const response = await fetch('http://localhost:3000/api/contas-pagar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (response.ok) {
                alert('Lançamento realizado!');
                e.target.reset();
                buscarContasPagarDoBanco();
            }
        } catch (error) {
            alert('Erro na conexão com o servidor.');
        }
    }
});

// ── INIT ─────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  navigateTo('dashboard');
});