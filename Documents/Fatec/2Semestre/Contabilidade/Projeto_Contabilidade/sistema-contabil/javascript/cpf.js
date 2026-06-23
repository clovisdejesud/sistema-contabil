function separarDigitos(cpf) {
    const vetor = [];
    for (let i = 0; i < 9; i++) {
        vetor[i] = parseInt(cpf[i], 10);
    }
    return vetor;
}

function primeiroDigitoVerificador(vetor) {
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += vetor[i] * (10 - i);
    }
    soma %= 11;
    return soma < 2 ? 0 : 11 - soma;
}

function segundoDigitoVerificador(vetor, digito1) {
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += vetor[i] * (11 - i);
    }
    soma += digito1 * 2;
    soma %= 11;
    return soma < 2 ? 0 : 11 - soma;
}

function validarCPF() {
    const cpf = document.getElementById('cpf-input').value.replace(/\D/g, '');
    const resultado = document.getElementById('cpf-resultado');

    if (cpf.length !== 11) {
        resultado.textContent = 'CPF incompleto.';
        return false;
    }

    const vetor = separarDigitos(cpf);
    const digito1 = primeiroDigitoVerificador(vetor);
    const digito2 = segundoDigitoVerificador(vetor, digito1);

    if (digito1 === parseInt(cpf[9], 10) && digito2 === parseInt(cpf[10], 10)) {
        resultado.textContent = '';
        return true;
    }

    resultado.textContent = 'CPF inválido!';
    return false;
}