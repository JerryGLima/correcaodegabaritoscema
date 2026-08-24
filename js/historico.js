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

    if(existente) {
        historicoAlunos = historicoAlunos.filter(a => a.id !== existente.id);
        if(db) { try { await db.collection("historico").doc(existente.id.toString()).delete(); } catch(e) {} }
    }

    historicoAlunos.push(obj);
    if(db) { try { await db.collection("historico").doc(obj.id.toString()).set(obj); } catch(e) {} }
    renderizarHistorico();
    renderizarEstatisticas();
    renderizarTabelaPAC();
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
        renderizarEstatisticas();
        renderizarTabelaPAC();
    } 
}

async function apagarItemHistorico(id) {
    if(confirm("Deseja excluir a nota deste aluno?")) {
        historicoAlunos = historicoAlunos.filter(a => a.id !== id);
        if(db) { try { await db.collection("historico").doc(id.toString()).delete(); } catch(e){} }
        renderizarHistorico();
        renderizarEstatisticas();
        renderizarTabelaPAC();
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
