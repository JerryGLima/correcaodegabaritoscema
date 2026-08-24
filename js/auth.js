// ==========================================
// LÓGICA DE LOGIN E INICIALIZAÇÃO DA SESSÃO
// ==========================================
function fazerLogin() {
    if(!auth) return alert("Não foi possível iniciar o Firebase. Verifique js/config.js e a conexão com a internet.");

    const email = document.getElementById('txtEmail').value.trim().toLowerCase();
    const senha = document.getElementById('txtSenha').value;
    const btn = document.getElementById('btnLogin');

    if(!email || !senha) return alert("Preencha todos os campos.");
    btn.innerText = "Verificando...";
    btn.disabled = true;

    auth.signInWithEmailAndPassword(email, senha)
        .catch(error => {
            console.error("Erro no login:", error);
            alert("Acesso negado. E-mail ou senha incorretos.");
        })
        .finally(() => {
            btn.innerText = "Entrar";
            btn.disabled = false;
        });
}

function fazerLogout() {
    if(auth) auth.signOut();
}

async function inicializarDadosDaSessao() {
    // Os alunos são necessários tanto no painel administrativo quanto
    // na correção do professor. Por isso a leitura não depende do perfil.
    try {
        await carregarAlunosDoFirebase();
    } catch (e) {
        console.error("Falha ao inicializar alunos:", e);
    }

    // Mantém as demais rotinas existentes sincronizadas com a turma atual.
    try {
        trocarTurmaGlobal();
    } catch (e) {
        console.error("Falha ao inicializar turma/gabarito:", e);
    }
}

if(auth) {
    auth.onAuthStateChanged(async user => {
        const loginScreen = document.getElementById('loginScreen');
        const adminScreen = document.getElementById('adminScreen');
        const professorScreen = document.getElementById('professorScreen');

        if (user) {
            loginScreen.style.display = 'none';

            if((user.email || '').toLowerCase() === EMAIL_ADMIN.toLowerCase()) {
                usuarioAtualRole = 'admin';
                adminScreen.style.display = 'flex';
                professorScreen.style.display = 'none';
            } else {
                usuarioAtualRole = 'prof';
                adminScreen.style.display = 'none';
                professorScreen.style.display = 'flex';
            }

            await inicializarDadosDaSessao();
        } else {
            usuarioAtualRole = null;
            alunosDB = [];
            loginScreen.style.display = 'flex';
            adminScreen.style.display = 'none';
            professorScreen.style.display = 'none';
        }
    });
}
