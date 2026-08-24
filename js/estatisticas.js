// ==========================================
// MÓDULO DE ESTATÍSTICAS (RANKING E ERROS)
// ==========================================
function renderizarEstatisticas() {
    const divRanking = document.getElementById('rankingTurma');
    const divErros = document.getElementById('estatisticasErros');
    if(!divRanking || !divErros) return;

    let filtrados = historicoAlunos.filter(a => a.turma === configAtual.nome);

    if(filtrados.length === 0) {
        divRanking.innerHTML = `<p style="padding: 10px; color: #999;">Sem dados para gerar ranking.</p>`;
        divErros.innerHTML = `<p style="padding: 10px; color: #999;">Sem dados de correção.</p>`;
        return;
    }

    // RANKING
    filtrados.sort((a, b) => b.total - a.total);
    let htmlRanking = `<table class="historico-table" style="background: transparent;"><tbody>`;
    let qtdRanking = filtrados.length > 10 ? 10 : filtrados.length;
    for(let i=0; i < qtdRanking; i++) {
        let medalha = "🏅";
        if(i === 0) medalha = "🥇"; else if(i === 1) medalha = "🥈"; else if(i === 2) medalha = "🥉";
        htmlRanking += `<tr><td style="width:30px; text-align:center; font-size: 1.2rem;">${medalha}</td><td><strong>${filtrados[i].nome}</strong></td><td style="text-align:right;"><b>${filtrados[i].total} pts</b></td></tr>`;
    }
    htmlRanking += `</tbody></table>`;
    divRanking.innerHTML = htmlRanking;

    // RAIO-X DE ERROS
    let contagemErros = {}; 
    filtrados.forEach(aluno => {
        if(aluno.erros && Array.isArray(aluno.erros)) {
            aluno.erros.forEach(q => {
                if(!contagemErros[q]) contagemErros[q] = 0;
                contagemErros[q]++;
            });
        }
    });

    let listaErros = Object.keys(contagemErros).map(q => {
        return { questao: q, quantidade: contagemErros[q] };
    });
    listaErros.sort((a, b) => b.quantidade - a.quantidade);

    if(listaErros.length === 0) {
        divErros.innerHTML = `<p style="padding: 10px; color: #28a745;">Nenhum erro registrado.</p>`;
        return;
    }

    let topErros = listaErros.slice(0, 15);
    let htmlErros = `<table class="historico-table" style="background: transparent;"><tbody>`;
    topErros.forEach((item, index) => {
        let icone = index < 3 ? "🔥" : "⚠️"; 
        
        let nomeMatErro = "Múltiplas";
        configAtual.materias.forEach(m => {
            if(item.questao >= m.inicio && item.questao < (m.inicio + m.qtd)) { nomeMatErro = m.nome; }
        });

        htmlErros += `<tr><td style="width:30px; text-align:center;">${icone}</td><td>Questão <b>${item.questao}</b><br><small style="color:#666;">${nomeMatErro}</small></td><td style="text-align:right; color:#dc3545;"><b>${item.quantidade} erros</b></td></tr>`;
    });
    htmlErros += `</tbody></table>`;
    divErros.innerHTML = htmlErros;
}
