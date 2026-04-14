async function salvarLancamento() {
    const formulario = {
        data: document.getElementById('data_contabil').value,
        id_debito: document.getElementById('conta_debito').value,
        id_credito: document.getElementById('conta_credito').value,
        valor: document.getElementById('valor_total').value,
        historico: document.getElementById('obs_historico').value
    };

    const response = await fetch('http://localhost:3000/lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
    });

    const resultado = await response.json();
    alert(resultado.message);
}