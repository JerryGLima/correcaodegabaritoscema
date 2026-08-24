// ==========================================
// LÓGICA DE LOGIN
// ==========================================
function fazerLogin() {
    if(!auth) return alert("Configure as chaves do Firebase no arquivo js/config.js primeiro!");
    const email = document.getElementById('txtEmail').value.trim().toLowerCase();
    const senha = document.getElementById('txtSenha').value;
    const btn = document.getElementById('btnLogin');
    
    if(!email || !senha) return alert("Preencha todos os campos.");
    btn.innerText = "Verificando...";

    auth.signInWithEmailAndPassword(email, senha).catch(error => {
        alert("Acesso negado. E-mail ou senha incorretos.");
        btn.innerText = "Entrar";
    });
}

function fazerLogout() { 
    if(auth) auth.signOut(); 
}

if(auth) {
    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('loginScreen').style.display = 'none';
            
            if(user.email.toLowerCase() === EMAIL_ADMIN.toLowerCase()) {
                usuarioAtualRole = 'admin';
                document.getElementById('adminScreen').style.display = 'flex';
                document.getElementById('professorScreen').style.display = 'none';
            } else {
                usuarioAtualRole = 'prof';
                document.getElementById('adminScreen').style.display = 'none';
                document.getElementById('professorScreen').style.display = 'flex';
            }
            trocarTurmaGlobal();
            
            if(usuarioAtualRole === 'admin') carregarAlunosDoFirebase();

        } else {
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('adminScreen').style.display = 'none';
            document.getElementById('professorScreen').style.display = 'none';
        }
    });
}
