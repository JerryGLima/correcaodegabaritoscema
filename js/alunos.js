// ==========================================
// MÓDULO DE GESTÃO DE ALUNOS (FIREBASE)
// ==========================================

async function carregarAlunosDoFirebase() {
    if(!db) return;
    try {
        const snapshot = await db.collection("alunos").get();
        alunosDB =[];
        snapshot.forEach(doc => { 
            let aluno = doc.data();
            aluno.id = doc.id; 
            alunosDB.push(aluno); 
        });
        
        const optGroupsAdmin = document.getElementById('selTurmaAdmin').innerHTML;
        document.getElementById('novoTurmaAluno').innerHTML = optGroupsAdmin;
        document.getElementById('turmaDestinoTransferencia').innerHTML = optGroupsAdmin;
        
        atualizarListasDeAlunosUI();
    } catch(e) {
        console.error("Erro ao carregar alunos do Firebase", e);
        alunosDB = [];
        atualizarListasDeAlunosUI();
        const mensagem = e && e.code === 'permission-denied'
            ? "O Firebase recusou a leitura da coleção de alunos. Verifique as regras do Firestore para este usuário."
            : "Não foi possível carregar os alunos do Firebase. Verifique a internet e abra o sistema pelo Live Server.";
        console.warn(mensagem);
    }
}

function atualizarListasDeAlunosUI() {
    const turmaSelecionada = configAtual.nome; 
    let alunosDaTurma = alunosDB.filter(a => a.turma === turmaSelecionada);
    
    // Organiza em ordem alfabética
    alunosDaTurma.sort((a, b) => a.nome.localeCompare(b.nome));

    const selectCorrecao = document.getElementById('nomeAluno');
    if(selectCorrecao) {
        selectCorrecao.innerHTML = "";
        if(alunosDaTurma.length === 0) {
            selectCorrecao.innerHTML = `<option value="">-- Nenhum aluno cadastrado nesta turma --</option>`;
        } else {
            alunosDaTurma.forEach(a => { selectCorrecao.innerHTML += `<option value="${a.nome}">${a.nome}</option>`; });
        }
    }

    const divTabela = document.getElementById('tabelaAlunos');
    const spanTotal = document.getElementById('totalAlunosTurma');
    if(!divTabela) return;

    if(spanTotal) {
        spanTotal.innerHTML = `<span style="background: var(--primary); color: white; padding: 4px 10px; border-radius: 12px; font-weight: bold;">Total: ${alunosDaTurma.length}</span>`;
    }

    if(alunosDaTurma.length === 0) {
        divTabela.innerHTML = `<p style='text-align:center;color:#999; padding: 20px;'>Sem alunos. Adicione acima.</p>`;
        return;
    }

    // NOVA TABELA COM CHECKBOX PARA SELEÇÃO
    let h = `<table class="historico-table">
                <thead>
                    <tr>
                        <th style="width: 30px; text-align: center;"><input type="checkbox" onchange="document.querySelectorAll('.chk-aluno').forEach(c => c.checked = this.checked)" title="Selecionar Todos"></th>
                        <th style="width: 40px; text-align: center;">Nº</th>
                        <th>Nome do Aluno</th>
                        <th style="text-align:center; width: 100px;">Ações</th>
                    </tr>
                </thead>
                <tbody>`;
    
    alunosDaTurma.forEach((a, index) => {
        h += `<tr>
            <td style="text-align: center;"><input type="checkbox" class="chk-aluno" value="${a.id}"></td>
            <td style="text-align: center; color: #666; font-weight: bold;">${index + 1}</td>
            <td><strong>${a.nome}</strong></td>
            <td style="text-align:center;">
                <button class="btn-apagar" style="color:#0056b3;" onclick="editarAluno('${a.id}', '${a.nome}')" title="Editar">✏️</button>
                <button class="btn-apagar" onclick="excluirAluno('${a.id}', '${a.nome}')" title="Excluir">🗑️</button>
            </td>
        </tr>`;
    });
    
    h += `</tbody></table>`;
    divTabela.innerHTML = h;
}

async function cadastrarAluno() {
    const nomeInput = document.getElementById('novoNomeAluno');
    const turmaInput = document.getElementById('novoTurmaAluno');
    const nome = nomeInput.value.trim().toUpperCase(); 
    const codigoTurma = turmaInput.value;
    const nomeTurma = BANCO_DE_PROVAS[codigoTurma].nome; 

    if(!nome) return alert("Digite o nome do aluno!");

    const novoAluno = { nome: nome, turma: nomeTurma, dataCadastro: new Date().toISOString() };
    
    try {
        const docRef = await db.collection("alunos").add(novoAluno);
        novoAluno.id = docRef.id;
        alunosDB.push(novoAluno);
        
        nomeInput.value = ""; 
        atualizarListasDeAlunosUI();
    } catch(e) { alert("Erro ao salvar no banco de dados."); }
}

async function excluirAluno(id, nome) {
    if(confirm(`Tem certeza que deseja EXCLUIR o aluno ${nome}?`)) {
        try {
            await db.collection("alunos").doc(id).delete();
            alunosDB = alunosDB.filter(a => a.id !== id);
            atualizarListasDeAlunosUI();
        } catch(e) { alert("Erro ao excluir."); }
    }
}

async function editarAluno(id, nomeAtual) {
    let novoNome = prompt("Editar nome do aluno:", nomeAtual);
    if(novoNome && novoNome.trim() !== "" && novoNome !== nomeAtual) {
        novoNome = novoNome.trim().toUpperCase();
        try {
            await db.collection("alunos").doc(id).update({ nome: novoNome });
            let index = alunosDB.findIndex(a => a.id === id);
            if(index > -1) alunosDB[index].nome = novoNome;
            atualizarListasDeAlunosUI();
        } catch(e) { alert("Erro ao editar."); }
    }
}

// NOVA FUNÇÃO: MOVE APENAS OS ALUNOS SELECIONADOS
async function transferirTurmaSelecionados() {
    const checkboxes = document.querySelectorAll('.chk-aluno:checked');
    if(checkboxes.length === 0) return alert("Selecione pelo menos um aluno marcando a caixinha ao lado do nome!");

    const turmaAtual = configAtual.nome;
    const codigoDestino = document.getElementById('turmaDestinoTransferencia').value;
    const turmaDestino = BANCO_DE_PROVAS[codigoDestino].nome;

    if(turmaAtual === turmaDestino) return alert("A turma de destino não pode ser igual à atual!");

    if(confirm(`Você vai mover ${checkboxes.length} aluno(s) do ${turmaAtual} para o ${turmaDestino}. Confirma?`)) {
        const btn = document.querySelector("button[onclick='transferirTurmaSelecionados()']");
        if(btn) btn.innerText = "Movendo...";
        
        try {
            const batch = db.batch();
            
            checkboxes.forEach(chk => {
                const idAluno = chk.value;
                const ref = db.collection("alunos").doc(idAluno);
                batch.update(ref, { turma: turmaDestino });
                
                // Atualiza na memória para refletir na tela
                let alunoIndex = alunosDB.findIndex(a => a.id === idAluno);
                if(alunoIndex > -1) alunosDB[alunoIndex].turma = turmaDestino; 
            });
            
            await batch.commit();
            alert("Sucesso! Alunos transferidos.");
            atualizarListasDeAlunosUI();
            if(btn) btn.innerText = "Mover Selecionados 🚀";
        } catch(e) { 
            alert("Erro ao transferir alunos em massa."); 
            console.error(e); 
            if(btn) btn.innerText = "Mover Selecionados 🚀";
        }
    }
}
