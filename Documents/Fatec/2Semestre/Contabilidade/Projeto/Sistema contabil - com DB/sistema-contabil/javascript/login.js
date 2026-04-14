function validarLogin() {
    
var userInput = document.getElementById("login");
var passInput = document.getElementById("senha");

    if(!userInput || !passInput) {
        console.error("Verifique Login/Senha!");
        return;
    }
var user = userInput.value.trim();
var pass = passInput.value.trim();


    if (user === "admin" && pass === "admin") {
        window.location.href = "prototipo.html";
    } else if (user === "" || pass === "") {
        alert("Por favor, preencha todos os campos!");
    } else {
        alert("Login ou senha incorretos! Tente novamente");
            passInput.value = "";
            passInput.focus();
    }
}