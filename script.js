// ==========================================
// 1. CONFIGURAÇÕES DO USUÁRIO E FIREBASE
// ==========================================

// ⚠️ SUBSTITUA PELO SEU E-MAIL DE ADMINISTRADOR (MANTENHA AS ASPAS)
const EMAIL_ADMIN = "admin@cema.com";

// ⚠️ COLE AS CHAVES DO FIREBASE AQUI DENTRO
const firebaseConfig = {
  apiKey: "AIzaSyADVsS_wCzlQv-mVRLf_tZOq7suWavbYTw",
  authDomain: "copa-play-ps4.firebaseapp.com",
  projectId: "copa-play-ps4",
  storageBucket: "copa-play-ps4.firebasestorage.app",
  messagingSenderId: "204861096387",
  appId: "1:204861096387:web:69fdef9e45f54eae487d76"
};

// ==========================================
// 2. MAPAS DE COORDENADAS (COLE NOS COLCHETES VAZIOS)
// ==========================================
const MAPA_MEDIO_125Q =[]; 
const MAPA_FUND_100Q =[]; 
const MAPA_FUND_105Q =[]; 

// ==========================================
// INICIALIZAÇÃO FIREBASE E VARIÁVEIS GLOBAIS
// ==========================================
if (Object.keys(firebaseConfig).length > 0) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth ? firebase.auth() : null;
const db = firebase.firestore ? firebase.firestore() : null;

let usuarioAtualRole = null; 
let configAtual = null; 
let imgAtual = new Image();
let gabaritoMestreDB = {};
let zoomLevel = 1.0; 
let historicoAlunos =[];
let estadoMap=0, calib={xA:0,yA:0,distX:0,distY:0}, indiceDisc=0, mapaTemp=[];

// ==========================================
// TABELAS DE ESCALA DE NOTAS
// ==========================================
const ESCALA_MEDIO_B1 =[ { min: 54, max: 100, nota: 10.0 }, { min: 50, max: 53, nota: 9.5 }, { min: 47, max: 49, nota: 9.0 }, { min: 43, max: 46, nota: 8.5 }, { min: 36, max: 42, nota: 8.0 }, { min: 34, max: 35, nota: 7.5 }, { min: 32, max: 33, nota: 7.0 }, { min: 29, max: 31, nota: 6.5 }, { min: 26, max: 28, nota: 6.0 }, { min: 23, max: 25, nota: 5.5 }, { min: 0,  max: 22, nota: 5.0 } ];
const ESCALA_MEDIO_B2 =[ { min: 38, max: 100, nota: 10.0 }, { min: 36, max: 37, nota: 9.5 }, { min: 34, max: 35, nota: 9.0 }, { min: 32, max: 33, nota: 8.0 }, { min: 30, max: 31, nota: 7.5 }, { min: 27, max: 29, nota: 7.0 }, { min: 25, max: 26, nota: 6.5 }, { min: 23, max: 24, nota: 6.0 }, { min: 20, max: 22, nota: 5.5 }, { min: 16, max: 19, nota: 5.0 }, { min: 0,  max: 15, nota: 4.0 } ];
const ESCALA_MEDIO_B3 =[ { min: 29, max: 100, nota: 10.0 }, { min: 27, max: 28, nota: 9.5 }, { min: 25, max: 26, nota: 9.0 }, { min: 23, max: 24, nota: 8.5 }, { min: 21, max: 22, nota: 8.0 }, { min: 19, max: 20, nota: 7.5 }, { min: 17, max: 18, nota: 7.0 }, { min: 15, max: 16, nota: 6.5 }, { min: 13, max: 14, nota: 6.0 }, { min: 11, max: 12, nota: 5.5 }, { min: 0,  max: 10, nota: 5.0 } ];
const ESCALA_MEDIO_B4 =[ { min: 10, max: 100, nota: 10.0 }, { min: 9, max: 9, nota: 9.0 }, { min: 8, max: 8, nota: 8.0 }, { min: 7, max: 7, nota: 7.0 }, { min: 6, max: 6, nota: 6.0 }, { min: 5, max: 5, nota: 5.0 }, { min: 0,  max: 4, nota: 4.0 } ];

const ESCALA_FUND_B1_B2 =[ { min: 38, max: 100, nota: 10.0 }, { min: 36, max: 37, nota: 9.5 }, { min: 34, max: 35, nota: 9.0 }, { min: 32, max: 33, nota: 8.0 }, { min: 30, max: 31, nota: 7.5 }, { min: 27, max: 29, nota: 7.0 }, { min: 25, max: 26, nota: 6.5 }, { min: 23, max: 24, nota: 6.0 }, { min: 20, max: 22, nota: 5.5 }, { min: 16, max: 19, nota: 5.0 }, { min: 0,  max: 15, nota: 4.0 } ];
const ESCALA_FUND_B3 =[ { min: 19, max: 100, nota: 10.0 }, { min: 18, max: 18, nota: 9.5 }, { min: 17, max: 17, nota: 9.0 }, { min: 16, max: 16, nota: 8.0 }, { min: 15, max: 15, nota: 7.5 }, { min: 14, max: 14, nota: 7.0 }, { min: 13, max: 13, nota: 6.5 }, { min: 11, max: 12, nota: 6.0 }, { min: 9,  max: 10, nota: 5.5 }, { min: 7,  max: 8, nota: 5.0 }, { min: 0,  max: 6, nota: 4.0 } ];
const ESCALA_FUND8_B4 =[ { min: 10, max: 100, nota: 10.0 }, { min: 9, max: 9, nota: 9.0 }, { min: 8, max: 8, nota: 8.0 }, { min: 7, max: 7, nota: 7.0 }, { min: 6, max: 6, nota: 6.0 }, { min: 5, max: 5, nota: 5.0 }, { min: 0,  max: 4, nota: 4.0 } ];
const ESCALA_FUND9_B4 =[ { min: 15, max: 100, nota: 10.0 }, { min: 14, max: 14, nota: 9.5 }, { min: 13, max: 13, nota: 9.0 }, { min: 12, max: 12, nota: 8.5 }, { min: 11, max: 11, nota: 8.0 }, { min: 10, max: 10, nota: 7.5 }, { min: 9,  max: 9, nota: 7.0 }, { min: 8,  max: 8, nota: 6.5 }, { min: 7,  max: 7, nota: 6.0 }, { min: 6,  max: 6, nota: 5.5 }, { min: 0,  max: 5, nota: 5.0 } ];

function calcularNotaPorEscala(pontos, escala) {
    for (let regra of escala) if (pontos >= regra.min && pontos <= regra.max) return regra.nota;
    return 0; 
}

// ==========================================
// ESTRUTURAS DE MATÉRIAS
// ==========================================
const MATERIAS_MEDIO =[ { nome: "Língua Portuguesa", inicio: 1,  qtd: 15 }, { nome: "Inglês", inicio: 16, qtd: 10 }, { nome: "Espanhol", inicio: 26, qtd: 10 }, { nome: "Artes", inicio: 36, qtd: 5 }, { nome: "Ed. Física", inicio: 41, qtd: 5 }, { nome: "História", inicio: 46, qtd: 10 }, { nome: "Geografia", inicio: 56, qtd: 10 }, { nome: "Sociologia", inicio: 66, qtd: 10 }, { nome: "Filosofia", inicio: 76, qtd: 10 }, { nome: "Física", inicio: 86, qtd: 10 }, { nome: "Química", inicio: 96, qtd: 10 }, { nome: "Biologia", inicio: 106, qtd: 10 }, { nome: "Matemática", inicio: 116, qtd: 10 } ];
const BLOCOS_MEDIO =[ { nome: "BLOCO 01 - Linguagens", materias:["Língua Portuguesa", "Inglês", "Espanhol", "Artes", "Ed. Física"] }, { nome: "BLOCO 02 - Ciências Humanas", materias:["História", "Geografia", "Sociologia", "Filosofia"] }, { nome: "BLOCO 03 - Ciências da Natureza", materias:["Física", "Química", "Biologia"] }, { nome: "BLOCO 04 - Matemática", materias:["Matemática"] } ];

const MATERIAS_FUND_GERAL =[ { nome: "Língua Portuguesa", inicio: 1,  qtd: 10 }, { nome: "Inglês", inicio: 11, qtd: 10 }, { nome: "Arte", inicio: 21, qtd: 10 }, { nome: "História", inicio: 31, qtd: 10 }, { nome: "Geografia", inicio: 41, qtd: 10 }, { nome: "Filosofia", inicio: 51, qtd: 10 }, { nome: "Ens. Religioso", inicio: 61, qtd: 10 }, { nome: "Matemática", inicio: 71, qtd: 10 }, { nome: "Geometria", inicio: 81, qtd: 10 }, { nome: "Ciências", inicio: 91, qtd: 10 } ];
const BLOCOS_FUND_GERAL =[ { nome: "BLOCO 01 - Linguagens", materias:["Língua Portuguesa", "Inglês", "Arte"] }, { nome: "BLOCO 02 - Ciências Humanas", materias:["História", "Geografia", "Filosofia", "Ens. Religioso"] }, { nome: "BLOCO 03 - Matemática", materias:["Matemática", "Geometria"] }, { nome: "BLOCO 04 - Ciências da Natureza", materias:["Ciências"] } ];

const MATERIAS_FUND_9 =[ { nome: "Língua Portuguesa", inicio: 1,  qtd: 10 }, { nome: "Inglês", inicio: 11, qtd: 10 }, { nome: "Arte", inicio: 21, qtd: 10 }, { nome: "História", inicio: 31, qtd: 10 }, { nome: "Geografia", inicio: 41, qtd: 10 }, { nome: "Filosofia", inicio: 51, qtd: 10 }, { nome: "Ens. Religioso", inicio: 61, qtd: 10 }, { nome: "Matemática", inicio: 71, qtd: 10 }, { nome: "Geometria", inicio: 81, qtd: 10 }, { nome: "Biologia", inicio: 91, qtd: 5 }, { nome: "Química", inicio: 96, qtd: 5 }, { nome: "Física", inicio: 101, qtd: 5 } ];
const BLOCOS_FUND_9 =[ { nome: "BLOCO 01 - Linguagens", materias:["Língua Portuguesa", "Inglês", "Arte"] }, { nome: "BLOCO 02 - Ciências Humanas", materias:["História", "Geografia", "Filosofia", "Ens. Religioso"] }, { nome: "BLOCO 03 - Matemática", materias:["Matemática", "Geometria"] }, { nome: "BLOCO 04 - Ciências da Natureza", materias:["Biologia", "Química", "Física"] } ];

const BANCO_DE_PROVAS = {
    "medio1": { nome: "1ª Série - Médio", materias: MATERIAS_MEDIO, blocos: BLOCOS_MEDIO, mapa: MAPA_MEDIO_125Q },
    "medio2": { nome: "2ª Série - Médio", materias: MATERIAS_MEDIO, blocos: BLOCOS_MEDIO, mapa: MAPA_MEDIO_125Q },
    "medio3A": { nome: "3ª Série A - Médio", materias: MATERIAS_MEDIO, blocos: BLOCOS_MEDIO, mapa: MAPA_MEDIO_125Q },
    "medio3B": { nome: "3ª Série B - Médio", materias: MATERIAS_MEDIO, blocos: BLOCOS_MEDIO, mapa: MAPA_MEDIO_125Q },
    "fund9A": { nome: "9º Ano A", materias: MATERIAS_FUND_9, blocos: BLOCOS_FUND_9, mapa: MAPA_FUND_105Q },
    "fund9B": { nome: "9º Ano B", materias: MATERIAS_FUND_9, blocos: BLOCOS_FUND_9, mapa: MAPA_FUND_105Q },
    "fund8": { nome: "8º Ano", materias: MATERIAS_FUND_GERAL, blocos: BLOCOS_FUND_GERAL, mapa: MAPA_FUND_100Q },
    "fund7": { nome: "7º Ano", materias: MATERIAS_FUND_GERAL, blocos: BLOCOS_FUND_GERAL, mapa: MAPA_FUND_100Q },
    "fund6": { nome: "6º Ano", materias: MATERIAS_FUND_GERAL, blocos: BLOCOS_FUND_GERAL, mapa: MAPA_FUND_100Q }
};

configAtual = BANCO_DE_PROVAS["medio1"];

// ==========================================
// LÓGICA DE LOGIN
// ==========================================
function fazerLogin() {
    if(!auth) return alert("Configure as chaves do Firebase no arquivo script.js primeiro!");
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
            
            // VERIFICA SE É O ADMIN PELO E-MAIL
            if(user.email.toLowerCase() === EMAIL_ADMIN.toLowerCase()) {
                usuarioAtualRole = 'admin';
                document.getElementById('adminScreen').style.display = 'flex';
                document.getElementById('professorScreen').style.display = 'none';
            } else {
                usuarioAtualRole = 'prof';
                document.getElementById('adminScreen').style.display = 'none';
                document.getElementById('professorScreen').style.display = 'flex';
            }
            trocarTurmaGlobal(); // Inicia o sistema carregando a 1ª turma
        } else {
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('adminScreen').style.display = 'none';
            document.getElementById('professorScreen').style.display = 'none';
        }
    });
}

// ==========================================
// LÓGICA DE SELECTS E GABARITO (FIREBASE)
// ==========================================
async function trocarTurmaGlobal() {
    const id = usuarioAtualRole === 'admin' ? document.getElementById('selTurmaAdmin').value : document.getElementById('selTurmaProf').value;
    
    if(document.getElementById('selTurmaAdmin')) document.getElementById('selTurmaAdmin').value = id;
    if(document.getElementById('selTurmaProf')) document.getElementById('selTurmaProf').value = id;

    configAtual = BANCO_DE_PROVAS[id];
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

// ==========================================
// INTERFACE E CANVAS DO ADMIN
// ==========================================
function mudarTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-'+tabName).classList.add('active');
    const buttons = document.querySelectorAll('.tab-btn');
    if(tabName=='corrigir') buttons[0].classList.add('active');
    if(tabName=='historico') { buttons[1].classList.add('active'); renderizarHistorico(); }
    if(tabName=='mapear') buttons[2].classList.add('active');
    if(tabName=='gabarito') buttons[3].classList.add('active');
}

const canvasEl = document.getElementById('canvas');
const ctx = canvasEl ? canvasEl.getContext('2d', { willReadFrequently: true }) : null; 

if(document.getElementById('uploadInput')) {
    document.getElementById('uploadInput').addEventListener('change', e => {
        const f = e.target.files[0]; if(!f) return;
        const r = new FileReader();
        r.onload = ev => { imgAtual.src = ev.target.result; imgAtual.onload = () => resetZoom(); }
        r.readAsDataURL(f);
    });
}

function redesenhar() {
    if(!imgAtual.src || !canvasEl) return;
    canvasEl.width = imgAtual.width; canvasEl.height = imgAtual.height;
    canvasEl.style.width = (imgAtual.width * zoomLevel) + "px";
    canvasEl.style.height = (imgAtual.height * zoomLevel) + "px";
    ctx.drawImage(imgAtual, 0, 0);
}

function ajustarZoom(d) { if(!imgAtual.src)return; zoomLevel+=d; if(zoomLevel<0.1)zoomLevel=0.1; redesenhar(); }
function resetZoom() { if(!imgAtual.src)return; zoomLevel = (document.querySelector('.canvas-area').clientWidth-60)/imgAtual.width; if(zoomLevel>1)zoomLevel=1; redesenhar(); }

// ==========================================
// MOTOR DE CORREÇÃO
// ==========================================
function executarCorrecao() {
    if(!imgAtual.src) return alert("Carregue a imagem da prova primeiro!");
    if(configAtual.mapa.length === 0) return alert("Esta turma ainda não foi mapeada! Por favor, cole as coordenadas no código.");

    const nomeAluno = document.getElementById('nomeAluno').value || "Aluno Não Identificado";
    const notaRedacao = parseFloat(document.getElementById('notaRedacao').value) || 0;

    let gabaritoUnificado = {};
    const txtFull = Object.values(gabaritoMestreDB).join(" ");
    const regex = /(\d+)[\s-.]*([A-ENX])/gi;
    let match;
    while ((match = regex.exec(txtFull)) !== null) gabaritoUnificado[parseInt(match[1])] = match[2].toUpperCase();

    if(Object.keys(gabaritoUnificado).length === 0) return alert("O gabarito desta turma está vazio na nuvem.");

    ctx.drawImage(imgAtual, 0, 0);
    let respAluno = {};
    
    configAtual.mapa.forEach(z => {
        const data = ctx.getImageData(z.x-(z.w/2), z.y-(z.h/2), z.w, z.h).data;
        let escuro = 0;
        for(let i=0; i<data.length; i+=16) if(((data[i]+data[i+1]+data[i+2])/3) < 140) escuro++;
        if((escuro/(data.length/16)) > 0.35) if(!respAluno[z.questao]) respAluno[z.questao] = z.alt;
    });

    let totalPontos = 0; 
    let htmlBlocos = "";
    let htmlPdf = "";
    let totalQuestoesProva = 0;
    
    const isEnsinoMedio = configAtual.nome.includes("Médio");
    const isFund9 = configAtual.nome.includes("9º");
    const isFund678 = configAtual.nome.includes("6º") || configAtual.nome.includes("7º") || configAtual.nome.includes("8º");

    // ===== NOVO: VARIÁVEIS PARA GUARDAR AS NOTAS DOS BLOCOS NO HISTÓRICO =====
    let notaBloco1 = 0;
    let notaBloco2 = 0;
    let notaBloco3 = 0;
    let notaBloco4 = 0;

    configAtual.blocos.forEach((bloco, index) => {
        let pontosB = 0; let totalQ = 0; let linhas = ""; let pdfLinhas = "";
        
        bloco.materias.forEach(nomeMat => {
            const disc = configAtual.materias.find(d => d.nome === nomeMat);
            if(disc) {
                let acertosM = 0;
                for(let q=disc.inicio; q<(disc.inicio+disc.qtd); q++) {
                    const alu = respAluno[q]; 
                    const prof = gabaritoUnificado[q];
                    const isNula = (prof === 'N' || prof === 'X');

                    if (isNula) {
                        acertosM++; 
                        const todasOpcoesQ = configAtual.mapa.filter(m => m.questao == q);
                        todasOpcoesQ.forEach(zOp => { ctx.lineWidth = 3; ctx.strokeStyle = "#007bff"; ctx.strokeRect(zOp.x-(zOp.w/2), zOp.y-(zOp.h/2), zOp.w, zOp.h); });
                        if(alu) { const zAlu = configAtual.mapa.find(m => m.questao==q && m.alt==alu); if(zAlu) { ctx.lineWidth = 6; ctx.strokeStyle = "#007bff"; ctx.strokeRect(zAlu.x-(zAlu.w/2), zAlu.y-(zAlu.h/2), zAlu.w, zAlu.h); } }
                    } else {
                        if(alu) { const z = configAtual.mapa.find(m => m.questao==q && m.alt==alu); if(z) { ctx.lineWidth = 5; if(prof && alu==prof) { ctx.strokeStyle="#0b7a25"; acertosM++; } else { ctx.strokeStyle="#c62828"; } ctx.strokeRect(z.x-(z.w/2), z.y-(z.h/2), z.w, z.h); } }
                        if(prof && alu!=prof) { const zC = configAtual.mapa.find(m => m.questao==q && m.alt==prof); if(zC) { ctx.lineWidth=4; ctx.strokeStyle="#ffc107"; ctx.strokeRect(zC.x-(zC.w/2), zC.y-(zC.h/2), zC.w, zC.h); } }
                    }
                }
                pontosB += acertosM; totalQ += disc.qtd;
                linhas += `<div class="bloco-row"><span>${nomeMat}</span> <b>${acertosM} / ${disc.qtd}</b></div>`;
                pdfLinhas += `<div class="pdf-row"><span>${nomeMat}</span> <span>${acertosM} / ${disc.qtd}</span></div>`;
            }
        });

        if(bloco.nome.includes("BLOCO 01") || bloco.nome.includes("Linguagens")) {
            pontosB += notaRedacao;
            totalQ += 10; 
            linhas += `<div class="bloco-row" style="background: #fff3cd; padding: 4px; border-radius: 3px; color: #856404;"><span>✍️ Redação</span> <b>${notaRedacao.toFixed(1)} / 10.0</b></div>`;
            pdfLinhas += `<div class="pdf-row" style="background: #eee; font-weight: bold; padding: 4px;"><span>Redação</span> <span>${notaRedacao.toFixed(1)} / 10.0</span></div>`;
        }

        let media = 0;
        if (isEnsinoMedio) {
            if (bloco.nome.includes("BLOCO 01") || bloco.nome.includes("Linguagens")) { media = calcularNotaPorEscala(pontosB, ESCALA_MEDIO_B1); } 
            else if (bloco.nome.includes("BLOCO 02") || bloco.nome.includes("Ciências Humanas")) { media = calcularNotaPorEscala(pontosB, ESCALA_MEDIO_B2); } 
            else if (bloco.nome.includes("BLOCO 03") || bloco.nome.includes("Ciências da Natureza")) { media = calcularNotaPorEscala(pontosB, ESCALA_MEDIO_B3); } 
            else if (bloco.nome.includes("BLOCO 04") || bloco.nome.includes("Matemática")) { media = calcularNotaPorEscala(pontosB, ESCALA_MEDIO_B4); } 
            else { media = totalQ > 0 ? (pontosB/totalQ)*10 : 0; }
        } else if (isFund9) {
            if (bloco.nome.includes("BLOCO 01") || bloco.nome.includes("Linguagens")) { media = calcularNotaPorEscala(pontosB, ESCALA_FUND_B1_B2); } 
            else if (bloco.nome.includes("BLOCO 02") || bloco.nome.includes("Ciências Humanas")) { media = calcularNotaPorEscala(pontosB, ESCALA_FUND_B1_B2); } 
            else if (bloco.nome.includes("BLOCO 03") || bloco.nome.includes("Matemática")) { media = calcularNotaPorEscala(pontosB, ESCALA_FUND_B3); } 
            else if (bloco.nome.includes("BLOCO 04") || bloco.nome.includes("Ciências da Natureza")) { media = calcularNotaPorEscala(pontosB, ESCALA_FUND9_B4); } 
            else { media = totalQ > 0 ? (pontosB/totalQ)*10 : 0; }
        } else if (isFund678) {
            if (bloco.nome.includes("BLOCO 01") || bloco.nome.includes("Linguagens")) { media = calcularNotaPorEscala(pontosB, ESCALA_FUND_B1_B2); } 
            else if (bloco.nome.includes("BLOCO 02") || bloco.nome.includes("Ciências Humanas")) { media = calcularNotaPorEscala(pontosB, ESCALA_FUND_B1_B2); } 
            else if (bloco.nome.includes("BLOCO 03") || bloco.nome.includes("Matemática")) { media = calcularNotaPorEscala(pontosB, ESCALA_FUND_B3); } 
            else if (bloco.nome.includes("BLOCO 04") || bloco.nome.includes("Ciências da Natureza")) { media = calcularNotaPorEscala(pontosB, ESCALA_FUND8_B4); } 
            else { media = totalQ > 0 ? (pontosB/totalQ)*10 : 0; }
        } else {
            media = totalQ > 0 ? (pontosB/totalQ)*10 : 0;
        }

        // ===== NOVO: Salva a nota ponderada no bloco correspondente =====
        if(index === 0) notaBloco1 = media;
        if(index === 1) notaBloco2 = media;
        if(index === 2) notaBloco3 = media;
        if(index === 3) notaBloco4 = media;

        htmlBlocos += `<div class="bloco-group"><div class="bloco-header">${bloco.nome}</div>${linhas}<div class="bloco-footer"><span>Total: <b>${pontosB.toFixed(1)}/${totalQ}</b></span> <span>Nota Ponderada: ${media.toFixed(1)}</span></div></div>`;
        htmlPdf += `<div class="pdf-bloco"><h3>${bloco.nome}</h3>${pdfLinhas}<div class="pdf-bloco-footer"><span>PONTOS: ${pontosB.toFixed(1)} / ${totalQ}</span><span>NOTA: ${media.toFixed(1)}</span></div></div>`;
        totalPontos += pontosB; totalQuestoesProva += totalQ;
    });

    let percentualAproveitamento = totalQuestoesProva > 0 ? (totalPontos / totalQuestoesProva) * 100 : 0;
    let classeCor = percentualAproveitamento >= 60 ? 'aprovado' : 'reprovado';

    htmlBlocos += `<div class="resumo-final ${classeCor}">PONTUAÇÃO TOTAL: ${totalPontos.toFixed(1)} / ${totalQuestoesProva}</div>`;
    document.getElementById('resultadoBoletim').innerHTML = htmlBlocos;
    document.getElementById('btnPdf').style.display = 'block';

    document.getElementById('pNome').innerText = nomeAluno;
    document.getElementById('pTurma').innerText = configAtual.nome;
    document.getElementById('pData').innerText = new Date().toLocaleDateString();
    document.getElementById('pdfBlocos').innerHTML = htmlPdf;
    
    const divNotaPdf = document.getElementById('pNotaFinal');
    divNotaPdf.innerText = `PONTUAÇÃO TOTAL DA PROVA: ${totalPontos.toFixed(1)} / ${totalQuestoesProva}`;
    divNotaPdf.className = `pdf-nota-final ${classeCor}`;
    
    document.getElementById('imgPrint').src = canvasEl.toDataURL("image/jpeg", 1.0);

    // ===== NOVO: Salva as notas dos blocos no histórico =====
    salvarAlunoNoHistorico({
        id: Date.now(), 
        data: new Date().toLocaleDateString(), 
        nome: nomeAluno, 
        turma: configAtual.nome, 
        redacao: notaRedacao.toFixed(1), 
        total: totalPontos.toFixed(1),
        b1: notaBloco1.toFixed(1),
        b2: notaBloco2.toFixed(1),
        b3: notaBloco3.toFixed(1),
        b4: notaBloco4.toFixed(1)
    });
}

// ==========================================
// HISTÓRICO NO FIREBASE
// ==========================================
async function carregarHistoricoDoFirebase() {
    if(!db) return;
    try {
        const snapshot = await db.collection("historico").get();
        historicoAlunos =[];
        snapshot.forEach(doc => { historicoAlunos.push(doc.data()); });
        historicoAlunos.sort((a,b) => a.id - b.id);
        renderizarHistorico();
    } catch(e) { console.error(e); historicoAlunos =[]; }
}

async function salvarAlunoNoHistorico(obj) {
    historicoAlunos.push(obj);
    if(db) { try { await db.collection("historico").doc(obj.id.toString()).set(obj); } catch(e) {} }
    renderizarHistorico();
}

async function limparHistoricoBD() { 
    if(confirm(`Apagar TODOS os alunos da turma ${configAtual.nome}?`)) { 
        const filtrados = historicoAlunos.filter(a => a.turma === configAtual.nome);
        historicoAlunos = historicoAlunos.filter(a => a.turma !== configAtual.nome);
        if(db) {
            try {
                const batch = db.batch();
                filtrados.forEach(a => { const ref = db.collection("historico").doc(a.id.toString()); batch.delete(ref); });
                await batch.commit();
            } catch(e){}
        }
        renderizarHistorico(); 
    } 
}

async function apagarItemHistorico(id) {
    if(confirm("Deseja excluir a nota deste aluno?")) {
        historicoAlunos = historicoAlunos.filter(a => a.id !== id);
        if(db) { try { await db.collection("historico").doc(id.toString()).delete(); } catch(e){} }
        renderizarHistorico();
    }
}

function renderizarHistorico() {
    const d = document.getElementById('tabelaHistorico');
    if(!d) return;
    const filtrados = historicoAlunos.filter(a => a.turma === configAtual.nome);
    if(filtrados.length===0) { d.innerHTML=`<p style='text-align:center;color:#999; padding: 20px;'>Nenhum aluno avaliado.</p>`; return; }
    let h = `<table class="historico-table"><thead><tr><th>Data</th><th>Nome do Aluno</th><th>Pontos</th><th style="text-align:center;">Ação</th></tr></thead><tbody>`;
    [...filtrados].reverse().forEach(a => h+=`<tr><td>${a.data}</td><td><strong>${a.nome}</strong></td><td><b>${a.total}</b></td><td style="text-align:center;"><button class="btn-apagar" onclick="apagarItemHistorico(${a.id})">🗑️</button></td></tr>`);
    d.innerHTML = h+"</tbody></table>";
}

function exportarExcel() {
    const filtrados = historicoAlunos.filter(a => a.turma === configAtual.nome);
    if(filtrados.length===0) return alert(`A turma está vazia.`);
    
    // ===== NOVO: Colunas dos Blocos adicionadas no Excel =====
    let csv = "DATA;NOME;TURMA;NOTA REDAÇÃO;NOTA BLOCO 1;NOTA BLOCO 2;NOTA BLOCO 3;NOTA BLOCO 4;ACERTOS GERAIS\n";
    
    filtrados.forEach(a => {
        // Puxa as notas salvas (ou 0 se for de correções muito antigas que não tinham isso)
        let nB1 = a.b1 || "0.0";
        let nB2 = a.b2 || "0.0";
        let nB3 = a.b3 || "0.0";
        let nB4 = a.b4 || "0.0";
        
        csv += `${a.data};${a.nome};${a.turma};${a.redacao};${nB1};${nB2};${nB3};${nB4};${a.total}\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csv], {type:'text/csv;charset=utf-8;'});
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `relatorio_${configAtual.nome.replace(/\s/g, '_')}.csv`; link.click();
}

// ==========================================
// MAPEAMENTO 
// ==========================================
function iniciarMapeamento() { if(!imgAtual.src) return alert("Carregue uma imagem!"); resetMapeamento(); }
function resetMapeamento() { estadoMap=1; indiceDisc=0; mapaTemp=[]; atualizarTextoMap(); }
function copiarCodigo() { document.getElementById('outputCodigo').select(); document.execCommand('copy'); const btn = document.getElementById('btnCopiar'); btn.innerText = "✅ Copiado!"; setTimeout(() => btn.innerText = "📋 Copiar Código", 2000); }

function atualizarTextoMap() {
    const txt = document.getElementById('instrucaoTexto'); const qtdPrimeira = configAtual.materias[0].qtd; const nomePrimeira = configAtual.materias[0].nome;
    if(estadoMap===1) txt.innerHTML = `<b>PASSO 1:</b> Clique <b>01-A</b> (${nomePrimeira})`; else if(estadoMap===2) txt.innerHTML = `<b>PASSO 2:</b> Clique <b>01-E</b> (Largura)`; else if(estadoMap===3) txt.innerHTML = `<b>PASSO 3:</b> Clique <b>${qtdPrimeira}-A</b> (Altura)`; else if(estadoMap===4 && indiceDisc < configAtual.materias.length) { txt.innerHTML = `<b>PASSO 4:</b> Clique Letra A de <b>${configAtual.materias[indiceDisc].nome}</b>`; } else if(indiceDisc >= configAtual.materias.length) txt.innerHTML = "<b>FIM! Copie o código gerado.</b>";
}

if(canvasEl) {
    canvasEl.addEventListener('mousedown', e => {
        if(!document.getElementById('tab-mapear').classList.contains('active') || !imgAtual.src) return;
        const rect = canvasEl.getBoundingClientRect(); const scaleX = canvasEl.width / rect.width; const scaleY = canvasEl.height / rect.height; const x = (e.clientX - rect.left) * scaleX; const y = (e.clientY - rect.top) * scaleY;
        ctx.strokeStyle = "blue"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x-10,y-10); ctx.lineTo(x+10,y+10); ctx.moveTo(x+10,y-10); ctx.lineTo(x-10,y+10); ctx.stroke();
        if(estadoMap === 1) { calib.xA=x; calib.yA=y; estadoMap=2; } else if(estadoMap === 2) { calib.distX = (x-calib.xA)/4; estadoMap=3; } else if(estadoMap === 3) { const qtdPrimeira = configAtual.materias[0].qtd; calib.distY = (y-calib.yA)/(qtdPrimeira - 1); estadoMap=4; } else if(estadoMap === 4) { if(indiceDisc < configAtual.materias.length) { gerarBlocoDisciplina(x, y, configAtual.materias[indiceDisc]); indiceDisc++; if(indiceDisc >= configAtual.materias.length) finalizarMapeamento(); } }
        atualizarTextoMap();
    });
}

function gerarBlocoDisciplina(xBase, yBase, config) {
    for(let i=0; i<config.qtd; i++) {
        let qNum = config.inicio + i; let y = yBase + (i * calib.distY);["A","B","C","D","E"].forEach((letra, idx) => {
            let x = xBase + (idx * calib.distX); mapaTemp.push({ id:`Q${qNum}-${letra}`, questao:qNum, alt:letra, x:Math.round(x), y:Math.round(y), w:Math.round(calib.distX*0.7), h:Math.round(calib.distY*0.7) });
            ctx.strokeStyle = "lime"; ctx.lineWidth = 2; ctx.strokeRect(x-(calib.distX*0.35), y-(calib.distY*0.35), calib.distX*0.7, calib.distY*0.7);
        });
    }
}

function finalizarMapeamento() { document.getElementById('areaCodigo').style.display='block'; document.getElementById('outputCodigo').value = JSON.stringify(mapaTemp); }
