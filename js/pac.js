// ==========================================
// MÓDULO TABELA GERAL POR ÁREA (MODELO PAC)
// ==========================================

// Agrupa todas as correções salvas por aluno e calcula a média de cada
// área de conhecimento (Linguagem, Ciências Humanas, Matemática, Ciências da Natureza).
// Cuidado: nos blocos do Ensino Médio a ordem é B1=Linguagens, B2=Humanas,
// B3=Natureza, B4=Matemática; no Fundamental é B1=Linguagens, B2=Humanas,
// B3=Matemática, B4=Natureza. Por isso o mapeamento abaixo depende da turma.
function calcularMediasPorAreaConhecimento() {
    const filtrados = historicoAlunos.filter(a => a.turma === configAtual.nome);
    const isEnsinoMedio = configAtual.nome.includes("Médio");

    const porAluno = {};
    filtrados.forEach(a => {
        if(!porAluno[a.nome]) porAluno[a.nome] = { nome: a.nome, linguagem:[], humanas:[], matematica:[], natureza:[] };

        const b1 = parseFloat(a.b1) || 0;
        const b2 = parseFloat(a.b2) || 0;
        const b3 = parseFloat(a.b3) || 0;
        const b4 = parseFloat(a.b4) || 0;

        porAluno[a.nome].linguagem.push(b1);
        porAluno[a.nome].humanas.push(b2);
        if(isEnsinoMedio) {
            porAluno[a.nome].natureza.push(b3);
            porAluno[a.nome].matematica.push(b4);
        } else {
            porAluno[a.nome].matematica.push(b3);
            porAluno[a.nome].natureza.push(b4);
        }
    });

    const media = arr => arr.length ? (arr.reduce((s,v) => s+v, 0) / arr.length) : 0;

    return Object.values(porAluno).map(al => ({
        nome: al.nome,
        linguagem: media(al.linguagem),
        humanas: media(al.humanas),
        matematica: media(al.matematica),
        natureza: media(al.natureza)
    })).sort((a, b) => a.nome.localeCompare(b.nome));
}

function renderizarTabelaPAC() {
    const div = document.getElementById('tabelaPAC');
    if(!div) return;

    const dados = calcularMediasPorAreaConhecimento();
    if(dados.length === 0) {
        div.innerHTML = `<p style="padding:10px; color:#999;">Sem dados suficientes para gerar a tabela desta turma.</p>`;
        return;
    }

    let h = `<table class="historico-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th style="text-align:center;">Linguagem</th>
                        <th style="text-align:center;">Ciências Humanas</th>
                        <th style="text-align:center;">Matemática</th>
                        <th style="text-align:center;">Ciências da Natureza</th>
                    </tr>
                </thead>
                <tbody>`;
    dados.forEach(a => {
        h += `<tr>
                <td><strong>${a.nome}</strong></td>
                <td style="text-align:center;">${a.linguagem.toFixed(1)}</td>
                <td style="text-align:center;">${a.humanas.toFixed(1)}</td>
                <td style="text-align:center;">${a.matematica.toFixed(1)}</td>
                <td style="text-align:center;">${a.natureza.toFixed(1)}</td>
              </tr>`;
    });
    h += `</tbody></table>`;
    div.innerHTML = h;
}

function exportarTabelaPAC() {
    const dados = calcularMediasPorAreaConhecimento();
    if(dados.length === 0) return alert("Não há dados suficientes para gerar a tabela desta turma.");

    if(typeof XLSX === 'undefined') {
        alert("Biblioteca de exportação Excel não carregou. Verifique sua conexão com a internet e tente novamente.");
        return;
    }

    // Segue o mesmo modelo do arquivo de tabelas do PAC:
    // linha 1 = nome da turma, linha 2 = cabeçalho, linhas seguintes = alunos.
    const linhas =[
        [configAtual.nome, "", "", "", ""],
        ["Nome", "Linguagem", "Ciencias Humanas", "Matemática e suas tecnologias", "Ciencias da Natureza"]
    ];

    dados.forEach(a => {
        linhas.push([
            a.nome,
            Number(a.linguagem.toFixed(1)),
            Number(a.humanas.toFixed(1)),
            Number(a.matematica.toFixed(1)),
            Number(a.natureza.toFixed(1))
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(linhas);
    ws['!cols'] =[{wch:35}, {wch:15}, {wch:18}, {wch:28}, {wch:18}];
    ws['!merges'] =[{ s: {r:0, c:0}, e: {r:0, c:4} }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notas");

    XLSX.writeFile(wb, `tabela_PAC_${configAtual.nome.replace(/\s/g, '_')}.xlsx`);
}
