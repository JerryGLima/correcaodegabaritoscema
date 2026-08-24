// ==========================================
// LÓGICA DE SELECTS E GABARITO (FIREBASE)
// ==========================================
async function trocarTurmaGlobal() {
    const id = usuarioAtualRole === 'admin' ? document.getElementById('selTurmaAdmin').value : document.getElementById('selTurmaProf').value;
    
    if(document.getElementById('selTurmaAdmin')) document.getElementById('selTurmaAdmin').value = id;
    if(document.getElementById('selTurmaProf')) document.getElementById('selTurmaProf').value = id;

    configAtual = BANCO_DE_PROVAS[id];
    if(typeof carregarMapeamentoSalvo === 'function') await carregarMapeamentoSalvo(id);
    document.querySelectorAll('.lblModeloNome').forEach(e => e.innerText = configAtual.nome);
    
    try {
        if(db) {
            const doc = await db.collection("gabaritos").doc(id).get();
            gabaritoMestreDB = doc.exists ? doc.data() : {};
        }
    } catch(e) { console.error(e); gabaritoMestreDB = {}; }
    
    povoarSelectDisciplinas();
    if(document.getElementById('selDisciplinaAdmin')) document.getElementById('selDisciplinaAdmin').selectedIndex = 0; 
    if(document.getElementById('selDisciplinaProf')) document.getElementById('selDisciplinaProf').selectedIndex = 0; 
    
    carregarTextoGabarito(); 
    atualizarUISelect();

    if(usuarioAtualRole === 'admin') {
        carregarHistoricoDoFirebase();
        atualizarListasDeAlunosUI();
        if(document.getElementById('tab-mapear') && document.getElementById('tab-mapear').classList.contains('active')) resetMapeamento();
    }
}

function povoarSelectDisciplinas() {
    const selAdmin = document.getElementById('selDisciplinaAdmin');
    const selProf = document.getElementById('selDisciplinaProf');
    
    if(selAdmin) selAdmin.innerHTML = "";
    if(selProf) selProf.innerHTML = "";

    configAtual.materias.forEach(d => { 
        if(selAdmin) { let o = document.createElement('option'); o.value = d.nome; o.text = d.nome; selAdmin.appendChild(o); }
        if(selProf) { let o = document.createElement('option'); o.value = d.nome; o.text = d.nome; selProf.appendChild(o); }
    });
}

function carregarTextoGabarito() {
    const selectId = usuarioAtualRole === 'admin' ? 'selDisciplinaAdmin' : 'selDisciplinaProf';
    const txtAreaId = usuarioAtualRole === 'admin' ? 'txtGabaritoAdmin' : 'txtGabaritoProf';
    const sel = document.getElementById(selectId);
    
    if(!sel || !sel.value) return;
    document.getElementById(txtAreaId).value = gabaritoMestreDB[sel.value] || "";
    
    if(document.getElementById('selDisciplinaAdmin')) document.getElementById('selDisciplinaAdmin').value = sel.value;
    if(document.getElementById('selDisciplinaProf')) document.getElementById('selDisciplinaProf').value = sel.value;
}

async function salvarGabaritoDB() {
    const selectId = usuarioAtualRole === 'admin' ? 'selDisciplinaAdmin' : 'selDisciplinaProf';
    const txtAreaId = usuarioAtualRole === 'admin' ? 'txtGabaritoAdmin' : 'txtGabaritoProf';
    const btnId = usuarioAtualRole === 'admin' ? 'btnSalvarGabaritoAdmin' : 'btnSalvarGabaritoProf';
    
    const discNome = document.getElementById(selectId).value;
    const texto = document.getElementById(txtAreaId).value.toUpperCase();
    const idTurma = document.getElementById('selTurmaAdmin').value; 

    gabaritoMestreDB[discNome] = texto;
    const btn = document.getElementById(btnId);
    const oldText = btn.innerHTML;
    btn.innerHTML = "Salvando...";

    if(db) {
        try {
            await db.collection("gabaritos").doc(idTurma).set(gabaritoMestreDB);
            atualizarUISelect();
            btn.innerHTML = "✅ Salvo!";
            btn.style.background = "var(--success)";
        } catch (e) {
            btn.innerHTML = "❌ Erro";
            btn.style.background = "red";
        }
    }
    setTimeout(() => { btn.innerHTML = oldText; btn.style.background = "#0056b3"; }, 2000);
}

function atualizarUISelect() {
    const selects =[document.getElementById('selDisciplinaAdmin'), document.getElementById('selDisciplinaProf')];
    let total = 0;
    selects.forEach(sel => {
        if(sel) {
            for(let i=0; i<sel.options.length; i++) {
                const val = sel.options[i].value;
                const nomePuro = val.replace("✅ ", "").replace("❌ ", "");
                if(gabaritoMestreDB[nomePuro] && gabaritoMestreDB[nomePuro].trim() !== "") {
                    sel.options[i].text = `✅ ${nomePuro}`;
                    sel.options[i].value = nomePuro; 
                } else {
                    sel.options[i].text = `❌ ${nomePuro}`;
                    sel.options[i].value = nomePuro; 
                }
            }
        }
    });
    try { total = Object.values(gabaritoMestreDB).join(" ").match(/[A-ENX]/gi)?.length || 0; } catch(e){}
    if(document.getElementById('totalGabaritoAdmin')) document.getElementById('totalGabaritoAdmin').innerText = total + " resp.";
    if(document.getElementById('totalGabaritoProf')) document.getElementById('totalGabaritoProf').innerText = total + " resp.";
}

async function limparMateriaDB() {
    const selectId = usuarioAtualRole === 'admin' ? 'selDisciplinaAdmin' : 'selDisciplinaProf';
    const txtAreaId = usuarioAtualRole === 'admin' ? 'txtGabaritoAdmin' : 'txtGabaritoProf';
    const discNome = document.getElementById(selectId).value;
    const idTurma = document.getElementById('selTurmaAdmin').value;

    if(confirm(`Apagar as respostas de ${discNome} do banco de dados?`)) {
        gabaritoMestreDB[discNome] = "";
        if(db) { try { await db.collection("gabaritos").doc(idTurma).set(gabaritoMestreDB); } catch(e){} }
        document.getElementById(txtAreaId).value = ""; 
        atualizarUISelect();
    }
}
