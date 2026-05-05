async function realizarLogin() {
    const userField = document.getElementById('usuario').value;
    const passField = document.getElementById('senha').value;

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: userField, senha: passField })
        });

        const data = await response.json();

        if (data.success) {
            alert("Bem-vindo ao ContabilCMRT!");
            window.location.href = "dashboard.html"; // Altere para sua página principal
        } else {
            alert("Erro: " + data.message);
        }
    } catch (error) {
        console.error("Erro ao conectar com o servidor:", error);
        alert("O servidor está desligado. Ligue o Node.js primeiro!");
    }
}