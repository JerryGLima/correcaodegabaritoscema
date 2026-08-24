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
        renderizarEstatisticas(); 
        renderizarTabelaPAC();
    } catch(e) { console.error(e); historicoAlunos =[]; }
}

// Salva o resultado de uma correção no histórico. Se já existir uma correção
// anterior para o MESMO aluno na MESMA turma, o registro antigo é
// automaticamente substituído pelo novo (evita duplicados no Histórico,
// no Ranking e na Tabela PAC).
async function salvarAlunoNoHistorico(obj) {
    const existente = historicoAlunos.find(a => a.nome === obj.nome && a.turma === obj.turma);

    if(!db) {
        console.error('Firestore indisponível: histórico não persistido.');
        return { ok:false, mensagem:'Firebase/Firestore indisponível.' };
    }

    try {
        // V2.6: gravação atômica. A versão antiga só é removida se a nova também for gravada.
        const batch = db.batch();
        if(existente) batch.delete(db.collection('historico').doc(existente.id.toString()));
        batch.set(db.collection('historico').doc(obj.id.toString()), obj);
        await batch.commit();

        if(existente) historicoAlunos = historicoAlunos.filter(a => a.id !== existente.id);
        historicoAlunos.push(obj);
        renderizarHistorico();
        renderizarEstatisticas();
        renderizarTabelaPAC();
        return { ok:true };
    } catch(e) {
        console.error('Falha ao salvar histórico no Firebase:', e);
        return { ok:false, mensagem:e?.message || 'Erro ao salvar no Firebase.' };
    }
}

async function limparHistoricoBD() { 
    if(!confirm(`Apagar TODOS os alunos da turma ${configAtual.nome}?`)) return;
    const filtrados = historicoAlunos.filter(a => a.turma === configAtual.nome);
    if(!filtrados.length) return alert('Não há registros nesta turma.');
    if(!db) return alert('Firebase indisponível. Nenhum registro foi apagado.');

    try {
        const batch = db.batch();
        filtrados.forEach(a => batch.delete(db.collection('historico').doc(a.id.toString())));
        await batch.commit();
        historicoAlunos = historicoAlunos.filter(a => a.turma !== configAtual.nome);
        renderizarHistorico(); 
        renderizarEstatisticas();
        renderizarTabelaPAC();
        alert('Histórico da turma apagado com sucesso.');
    } catch(e) {
        console.error(e);
        alert('Não foi possível apagar o histórico. Nenhum dado local foi removido.');
    }
} 

async function apagarItemHistorico(id) {
    if(!confirm("Deseja excluir a nota deste aluno?")) return;
    if(!db) return alert('Firebase indisponível. O registro não foi apagado.');
    try {
        await db.collection('historico').doc(id.toString()).delete();
        historicoAlunos = historicoAlunos.filter(a => a.id !== id);
        renderizarHistorico();
        renderizarEstatisticas();
        renderizarTabelaPAC();
    } catch(e) {
        console.error(e);
        alert('Não foi possível excluir esta correção. Tente novamente.');
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
    let csv = "DATA;NOME;TURMA;NOTA REDAÇÃO;LINGUAGENS;HUMANAS;MATEMÁTICA;NATUREZA;ACERTOS GERAIS\n";
    filtrados.forEach(a => {
        let nB1 = a.b1 || "0.0"; let nB2 = a.b2 || "0.0"; let nB3 = a.b3 || "0.0"; let nB4 = a.b4 || "0.0";
        csv += `${a.data};${a.nome};${a.turma};${a.redacao};${nB1};${nB2};${nB3};${nB4};${a.total}\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], {type:'text/csv;charset=utf-8;'});
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `relatorio_${configAtual.nome.replace(/\s/g, '_')}.csv`; link.click();
}
