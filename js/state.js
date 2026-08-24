// CEMA - Aplicação principal
// Regras, telas, correção, histórico e gestão.

// INICIALIZAÇÃO FIREBASE E VARIÁVEIS GLOBAIS
// ==========================================
if (Object.keys(firebaseConfig).length > 0) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth ? firebase.auth() : null;
const db = firebase.firestore ? firebase.firestore() : null;

let usuarioAtualRole = null; 
let configAtual = BANCO_DE_PROVAS["medio1"]; 
let imgAtual = new Image();
let gabaritoMestreDB = {};
let zoomLevel = 1.0; 
let historicoAlunos =[];
let alunosDB =[]; // Guarda a lista de alunos cadastrados
let estadoMap=0, calib={xA:0,yA:0,distX:0,distY:0}, indiceDisc=0, mapaTemp=[];
let correcaoPendente = null;

// V2.6 - trava para evitar correções/salvamentos duplicados por clique repetido
let correcaoEmAndamento = false;
const VERSAO_SISTEMA = "2.6";
