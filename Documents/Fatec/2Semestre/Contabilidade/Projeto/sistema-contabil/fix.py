import re

with open(r'c:\Users\Clovis\Desktop\Projeto\sistema-contabil\javascript\script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the start of the try block for clientes
start_marker = "        try {\n            const response = await fetch('http://localhost:3000/api/clientes', {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },"

# Locate the end marker
end_marker = "        <hr style=\"border:0; border-top:1px solid var(--border); margin:20px 0;\">"

parts = content.split(start_marker)
if len(parts) != 2:
    print("Start marker not found correctly", len(parts))
else:
    sub_parts = parts[1].split(end_marker)
    if len(sub_parts) != 2:
        print("End marker not found correctly", len(sub_parts))
    else:
        replacement = """        try {
            const response = await fetch('http://localhost:3000/api/clientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const result = await response.json();

            if (response.ok) {
                // Salva o ID retornado pelo backend na memória do navegador
                localStorage.setItem('cliente_id', result.id || result.insertId);
                
                alert('✅ Cliente salvo com sucesso!\\n\\n🛑 ATENÇÃO: NÃO SAIA DESTA TELA!\\nÉ OBRIGATÓRIO clicar no botão "Cadastrar Endereço" agora para finalizar.');
                
                // Desabilita todos os inputs e selects para não preencher outro
                Array.from(form.elements).forEach(el => {
                    if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
                        el.disabled = true;
                    }
                });

                // Desabilita os botões de Salvar/Limpar
                const btnSalvar = document.querySelector('.btn-salvar');
                const btnLimpar = document.querySelector('.btn-limpar');
                if (btnSalvar) btnSalvar.disabled = true;
                if (btnLimpar) btnLimpar.disabled = true;

            } else {
                alert('Erro: ' + result.error);
            }
        } catch (error) {
            alert('Erro ao conectar ao servidor: ' + error.message);
        }
    });
});

// ── FORMULÁRIO DE FORNECEDORES ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const formForn = document.getElementById('formFornecedor');
    if (!formForn) return;

    // ⛔ Bloqueia o 'Enter' de submeter o formulário sem querer
    formForn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    const tipoPessoaForn = formForn.tipo_pessoa;
    const campoDocumentoForn = formForn.documento;

    // 🔁 Troca placeholder CPF/CNPJ
    tipoPessoaForn.addEventListener("change", () => {
        campoDocumentoForn.value = "";
        if (tipoPessoaForn.value === "JURIDICA") {
            campoDocumentoForn.placeholder = "00.000.000/0000-00";
        } else {
            campoDocumentoForn.placeholder = "000.000.000-00";
        }
    });

    // 🎭 Máscara CPF/CNPJ
    campoDocumentoForn.addEventListener("input", () => {
        let valor = campoDocumentoForn.value.replace(/\\D/g, "");

        if (tipoPessoaForn.value === "JURIDICA") {
            valor = valor
                .replace(/^(\\d{2})(\\d)/, "$1.$2")
                .replace(/^(\\d{2})\\.(\\d{3})(\\d)/, "$1.$2.$3")
                .replace(/\\.(\\d{3})(\\d)/, ".$1/$2")
                .replace(/(\\d{4})(\\d)/, "$1-$2");
        } else {
            valor = valor
                .replace(/^(\\d{3})(\\d)/, "$1.$2")
                .replace(/^(\\d{3})\\.(\\d{3})(\\d)/, "$1.$2.$3")
                .replace(/\\.(\\d{3})(\\d)/, ".$1-$2");
        }

        campoDocumentoForn.value = valor;
    });

    // 🚀 Envio do formulário
    formForn.addEventListener('submit', async function(e) {
        e.preventDefault();

        const tipo = this.tipo_pessoa.value;
        const documentoLimpo = this.documento.value.replace(/\\D/g, "");

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
            telefone: this.telefone.value,
            inscricao_municipal: this.inscricao_municipal.value,
            regime_tributario: this.regime_tributario.value,
            nome_contato: this.nome_contato.value,
            ativo: 1
        };

        try {
            const response = await fetch('http://localhost:3000/api/fornecedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            const result = await response.json();

            if (response.ok) {
                // Salva o ID retornado pelo backend na memória do navegador
                // Estamos reaproveitando "cliente_id" pois é o que enderecos.html lê
                localStorage.setItem('cliente_id', result.id || result.insertId);
                
                alert('✅ Fornecedor salvo com sucesso!\\n\\n🛑 ATENÇÃO: NÃO SAIA DESTA TELA!\\nÉ OBRIGATÓRIO clicar no botão "Cadastrar Endereço" agora para finalizar.');
                
                // Desabilita todos os inputs e selects para não preencher outro
                Array.from(formForn.elements).forEach(el => {
                    if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
                        el.disabled = true;
                    }
                });

                // Desabilita os botões de Salvar/Limpar
                const btnSalvar = document.querySelector('.btn-salvar');
                const btnLimpar = document.querySelector('.btn-limpar');
                if (btnSalvar) btnSalvar.disabled = true;
                if (btnLimpar) btnLimpar.disabled = true;

            } else {
                alert('Erro: ' + result.error);
            }
        } catch (error) {
            alert('Erro ao conectar ao servidor: ' + error.message);
        }
    });

});

// ── FORNECEDORES ─────────────────────────────────────────────────
function renderFornecedores() {
    return `
    <div class="stat-card">
        <div class="card-header-contabil">
            <h2 style="font-size:16px; font-weight:700; color:var(--text); margin:0;">Cadastro de Fornecedores</h2>
            <button class="btn-novo" onclick="window.open('fornecedores/novo.html', '_blank')">+ Novo Fornecedor</button>
        </div>
        <hr style="border:0; border-top:1px solid var(--border); margin:20px 0;">"""

        new_content = parts[0] + replacement + "\n" + sub_parts[1]
        
        # Add irParaEnderecoFornecedor() to the very end of the file
        if "function irParaEnderecoFornecedor()" not in new_content:
            new_content += """
function irParaEnderecoFornecedor() {
    const urlParams = new URLSearchParams(window.location.search);
    const fornecedorId = urlParams.get('fornecedor_id') || localStorage.getItem('cliente_id'); // Re-using cliente_id storage

    if (!fornecedorId) {
        alert('⚠️ Salve o fornecedor primeiro!');
        return;
    }
    window.location.href = `enderecos.html?cliente_id=${fornecedorId}`;
}
"""
        with open(r'c:\Users\Clovis\Desktop\Projeto\sistema-contabil\javascript\script.js', 'w', encoding='utf-8') as fw:
            fw.write(new_content)
        print("Successfully fixed script.js")
