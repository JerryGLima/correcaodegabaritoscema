// ==========================================
// INTERFACE E CANVAS DO ADMIN
// ==========================================
function mudarTab(tabName, btnElement) {
    document.querySelectorAll('.tab-content').forEach(d => d.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('tab-'+tabName).classList.add('active');
    if(btnElement) btnElement.classList.add('active');
    
    if(tabName === 'historico') renderizarHistorico();
    if(tabName === 'estatisticas') { renderizarEstatisticas(); renderizarTabelaPAC(); }
    if(tabName === 'alunos') atualizarListasDeAlunosUI();
}

const canvasEl = document.getElementById('canvas');
const ctx = canvasEl ? canvasEl.getContext('2d', { willReadFrequently: true }) : null; 

function definirStatusCorrecao(texto, tipo='info') {
    const el = document.getElementById('statusCorrecao');
    if(!el) return;
    el.textContent = texto;
    el.className = 'status-correcao ' + tipo;
}

function travarBotaoCorrecao(travar) {
    const btn = document.getElementById('btnCorrigirAgora');
    if(!btn) return;
    btn.disabled = !!travar;
    btn.textContent = travar ? '⏳ PROCESSANDO...' : '✅ CORRIGIR AGORA';
}

if(document.getElementById('uploadInput')) {
    document.getElementById('uploadInput').addEventListener('change', e => {
        const f = e.target.files[0]; if(!f) return;
        if(!f.type || !f.type.startsWith('image/')) {
            e.target.value = '';
            definirStatusCorrecao('Arquivo inválido. Selecione uma imagem do cartão-resposta.', 'erro');
            return alert('Selecione um arquivo de imagem válido.');
        }
        const r = new FileReader();
        r.onerror = () => {
            definirStatusCorrecao('Não foi possível abrir a imagem selecionada.', 'erro');
            alert('Não foi possível abrir essa imagem. Tente outro arquivo.');
        };
        r.onload = ev => {
            imgAtual = new Image();
            imgAtual.onload = () => {
                resetZoom();
                document.getElementById('btnPdf').style.display = 'none';
                document.getElementById('resultadoBoletim').innerHTML = 'Aguardando correção...';
                definirStatusCorrecao(`Imagem carregada (${imgAtual.width} × ${imgAtual.height}px).`, 'ok');
            };
            imgAtual.onerror = () => {
                definirStatusCorrecao('A imagem está corrompida ou em formato não suportado.', 'erro');
                alert('A imagem não pôde ser carregada.');
            };
            imgAtual.src = ev.target.result;
        };
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
function montarGabaritoUnificado() {
    const gabaritoUnificado = {};
    const txtFull = Object.values(gabaritoMestreDB).join(" ");
    const regex = /(\d+)[\s-.]*([A-ENX])/gi;
    let match;
    while ((match = regex.exec(txtFull)) !== null) {
        gabaritoUnificado[parseInt(match[1])] = match[2].toUpperCase();
    }
    return gabaritoUnificado;
}

function validarImagemParaLeitura() {
    if(!imgAtual.src || !configAtual || !Array.isArray(configAtual.mapa) || !configAtual.mapa.length) {
        return { ok: false, mensagem: 'Não há imagem ou mapa de leitura disponível.' };
    }

    const margem = OMR_CONFIG.MARGEM_SEGURANCA_MAPA || 0;
    const foraDaImagem = configAtual.mapa.some(z => {
        const esquerda = z.x - (z.w / 2) - margem;
        const direita = z.x + (z.w / 2) + margem;
        const topo = z.y - (z.h / 2) - margem;
        const base = z.y + (z.h / 2) + margem;
        return esquerda < 0 || topo < 0 || direita > imgAtual.width || base > imgAtual.height;
    });

    if(foraDaImagem) {
        return {
            ok: false,
            mensagem: 'A imagem parece estar cortada, redimensionada demais ou incompatível com o modelo desta turma. Carregue o cartão completo antes de corrigir.'
        };
    }

    return { ok: true };
}

function analisarMarcacoesOMR() {
    ctx.drawImage(imgAtual, 0, 0);
    const respostas = {};
    const confianca = {};

    configAtual.mapa.forEach(z => {
        const x = Math.max(0, Math.round(z.x-(z.w/2)));
        const y = Math.max(0, Math.round(z.y-(z.h/2)));
        const w = Math.max(1, Math.round(z.w));
        const h = Math.max(1, Math.round(z.h));
        const data = ctx.getImageData(x, y, w, h).data;
        let escuro = 0;
        let amostras = 0;
        for(let i=0; i<data.length; i+=16) {
            amostras++;
            if(((data[i]+data[i+1]+data[i+2])/3) < OMR_CONFIG.LIMITE_PIXEL_ESCURO) escuro++;
        }
        const taxa = amostras ? escuro/amostras : 0;
        if(!confianca[z.questao]) confianca[z.questao] = {};
        confianca[z.questao][z.alt] = taxa;
        if(taxa > OMR_CONFIG.PERCENTUAL_MARCADO) {
            if(!respostas[z.questao]) respostas[z.questao] = [];
            respostas[z.questao].push(z.alt);
        }
    });

    return { respostas, confianca };
}

function detectarQuestoesParaRevisao(respostas, confianca, gabaritoUnificado) {
    const questoes = [];
    Object.keys(gabaritoUnificado).map(Number).sort((a,b)=>a-b).forEach(q => {
        const marcadas = respostas[q] || [];
        const taxas = confianca[q] || {};
        const ranking = Object.entries(taxas).sort((a,b)=>b[1]-a[1]);
        const maior = ranking[0] ? ranking[0][1] : 0;
        const segundaMaior = ranking[1] ? ranking[1][1] : 0;
        const diferenca = maior - segundaMaior;
        let motivo = '';

        if(marcadas.length > 1) {
            motivo = 'Mais de uma alternativa foi detectada';
        } else if(
            maior >= OMR_CONFIG.PERCENTUAL_MINIMO_PARA_COMPARAR &&
            segundaMaior >= OMR_CONFIG.PERCENTUAL_MINIMO_PARA_COMPARAR &&
            diferenca < OMR_CONFIG.DIFERENCA_MINIMA_ENTRE_ALTERNATIVAS
        ) {
            motivo = 'Duas alternativas ficaram muito próximas na leitura';
        } else if(marcadas.length === 0 && maior >= OMR_CONFIG.PERCENTUAL_DUVIDOSO) {
            motivo = 'Marcação fraca ou pouco nítida';
        } else if(marcadas.length === 0) {
            motivo = 'Nenhuma alternativa foi identificada';
        }

        if(motivo) {
            questoes.push({
                questao: q,
                motivo,
                detectadas: marcadas,
                sugestao: ranking[0] ? ranking[0][0] : '',
                maiorTaxa: maior,
                segundaSugestao: ranking[1] ? ranking[1][0] : '',
                segundaTaxa: segundaMaior,
                ranking
            });
        }
    });
    return questoes;
}

async function executarCorrecao() {
    if(correcaoEmAndamento) return;
    if(!imgAtual.src) return alert("Carregue a imagem da prova primeiro!");
    if(!configAtual?.mapa?.length) return alert("Esta turma ainda não foi mapeada!");

    const campoAluno = document.getElementById('nomeAluno');
    const nomeAluno = campoAluno.value || "Aluno Não Identificado";
    const campoRedacao = document.getElementById('notaRedacao');
    const textoRedacao = String(campoRedacao.value ?? '').trim();
    const notaRedacao = textoRedacao === '' ? 0 : Number(textoRedacao);

    if(!Number.isFinite(notaRedacao) || notaRedacao < 0 || notaRedacao > 10) {
        definirStatusCorrecao('A nota da redação deve estar entre 0 e 10.', 'erro');
        campoRedacao.focus();
        return alert('Digite uma nota de redação válida entre 0 e 10.');
    }

    if(!campoAluno.value) {
        if(!confirm("Você não selecionou um aluno na lista. Deseja corrigir mesmo assim como 'Aluno Não Identificado'?")) return;
    }

    const gabaritoUnificado = montarGabaritoUnificado();
    if(Object.keys(gabaritoUnificado).length === 0) return alert("O gabarito desta turma está vazio na nuvem.");

    // V2.6: não permite corrigir com gabarito parcialmente preenchido.
    const questoesEsperadas = configAtual.materias.flatMap(d => Array.from({length:Number(d.qtd)}, (_,i)=>Number(d.inicio)+i));
    const faltandoGabarito = questoesEsperadas.filter(q => !gabaritoUnificado[q]);
    if(faltandoGabarito.length) {
        const amostra = faltandoGabarito.slice(0, 15).join(', ');
        definirStatusCorrecao(`Gabarito incompleto: ${faltandoGabarito.length} questão(ões) sem resposta.`, 'erro');
        return alert(`Não é seguro corrigir com o gabarito incompleto.\n\nQuestões sem resposta: ${amostra}${faltandoGabarito.length>15?'...':''}`);
    }

    const validacaoImagem = validarImagemParaLeitura();
    if(!validacaoImagem.ok) {
        definirStatusCorrecao(validacaoImagem.mensagem, 'erro');
        return alert(validacaoImagem.mensagem);
    }

    const existente = campoAluno.value ? historicoAlunos.find(a => a.nome === nomeAluno && a.turma === configAtual.nome) : null;
    if(existente && !confirm(`Já existe uma correção salva para ${nomeAluno} em ${configAtual.nome}.\n\nAo continuar, a correção anterior será substituída. Deseja continuar?`)) return;

    correcaoEmAndamento = true;
    travarBotaoCorrecao(true);
    definirStatusCorrecao('Lendo o cartão-resposta...', 'info');

    try {
        const leitura = analisarMarcacoesOMR();
        const pendencias = detectarQuestoesParaRevisao(leitura.respostas, leitura.confianca, gabaritoUnificado);

        correcaoPendente = {
            nomeAluno,
            notaRedacao,
            gabaritoUnificado,
            respostas: leitura.respostas,
            confianca: leitura.confianca,
            pendencias,
            revisoesManuais: {}
        };

        if(pendencias.length > 0) {
            definirStatusCorrecao(`${pendencias.length} questão(ões) precisam de conferência manual.`, 'aviso');
            abrirRevisaoManual();
            return;
        }

        await finalizarCorrecao(leitura.respostas, gabaritoUnificado, nomeAluno, notaRedacao, {});
        correcaoPendente = null;
    } catch(e) {
        console.error('Erro durante a correção:', e);
        definirStatusCorrecao('Ocorreu um erro durante a correção. Nada foi salvo.', 'erro');
        alert('Ocorreu um erro durante a correção. Tente novamente.');
    } finally {
        if(!correcaoPendente) {
            correcaoEmAndamento = false;
            travarBotaoCorrecao(false);
        }
    }
}

function obterCropQuestao(q) {
    const itens = configAtual.mapa.filter(m => m.questao === q);
    if(!itens.length) return '';
    const margemX = 35, margemY = 28;
    const minX = Math.max(0, Math.min(...itens.map(i => i.x-i.w/2)) - margemX);
    const maxX = Math.min(imgAtual.width, Math.max(...itens.map(i => i.x+i.w/2)) + margemX);
    const minY = Math.max(0, Math.min(...itens.map(i => i.y-i.h/2)) - margemY);
    const maxY = Math.min(imgAtual.height, Math.max(...itens.map(i => i.y+i.h/2)) + margemY);
    const w = Math.max(1, maxX-minX), h = Math.max(1, maxY-minY);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(imgAtual, minX, minY, w, h, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.92);
}

function abrirRevisaoManual() {
    if(!correcaoPendente) return;
    const modal = document.getElementById('modalRevisao');
    const lista = document.getElementById('listaRevisao');
    const img = document.getElementById('imgRevisaoCompleta');
    const contador = document.getElementById('contadorRevisao');

    img.src = imgAtual.src;
    contador.innerText = `${correcaoPendente.pendencias.length} questão(ões) para conferir`;
    lista.innerHTML = '';

    correcaoPendente.pendencias.forEach(item => {
        const q = item.questao;
        const prof = correcaoPendente.gabaritoUnificado[q] || '-';
        const detectada = item.detectadas.length ? item.detectadas.join(', ') : 'nenhuma';
        const div = document.createElement('div');
        div.className = 'revisao-item';
        div.dataset.questao = q;
        div.innerHTML = `
            <div class="revisao-item-topo">
                <div>
                    <strong>Questão ${q}</strong>
                    <small>${item.motivo}</small>
                </div>
                <span class="revisao-status" id="statusRev${q}">Pendente</span>
            </div>
            <img class="revisao-crop" src="${obterCropQuestao(q)}" alt="Recorte da questão ${q}">
            <div class="revisao-info">Leitura automática: <b>${detectada}</b> · Gabarito oficial: <b>${prof}</b></div>
            <div class="revisao-info revisao-confianca">${item.ranking && item.ranking.length ? 'Leitura: ' + item.ranking.slice(0, 3).map(([alt, taxa]) => `${alt} ${(taxa*100).toFixed(0)}%`).join(' · ') : ''}</div>
            <div class="revisao-opcoes" id="opcoesRev${q}">
                ${['A','B','C','D','E'].map(a => `<button type="button" onclick="marcarRespostaManual(${q}, '${a}', this)">${a}</button>`).join('')}
                <button type="button" class="btn-branco" onclick="marcarRespostaManual(${q}, '', this)">EM BRANCO</button>
            </div>`;
        lista.appendChild(div);
    });

    modal.style.display = 'flex';
    document.body.classList.add('modal-aberto');
}

function marcarRespostaManual(q, alternativa, botao) {
    if(!correcaoPendente) return;
    correcaoPendente.revisoesManuais[q] = alternativa;
    document.querySelectorAll(`#opcoesRev${q} button`).forEach(b => b.classList.remove('selecionado'));
    botao.classList.add('selecionado');
    const status = document.getElementById(`statusRev${q}`);
    status.innerText = alternativa ? `Marcada: ${alternativa}` : 'Confirmada em branco';
    status.classList.add('ok');
}

function cancelarRevisaoManual() {
    document.getElementById('modalRevisao').style.display = 'none';
    document.body.classList.remove('modal-aberto');
    correcaoPendente = null;
    correcaoEmAndamento = false;
    travarBotaoCorrecao(false);
    definirStatusCorrecao('Conferência cancelada. Nenhuma correção foi salva.', 'aviso');
}

async function confirmarRevisaoManual() {
    if(!correcaoPendente) return;
    const faltando = correcaoPendente.pendencias.filter(p => !Object.prototype.hasOwnProperty.call(correcaoPendente.revisoesManuais, p.questao));
    if(faltando.length) {
        return alert(`Confira todas as questões antes de salvar. Faltam: ${faltando.map(x=>x.questao).join(', ')}`);
    }

    const respostasFinais = {...correcaoPendente.respostas};
    Object.entries(correcaoPendente.revisoesManuais).forEach(([q, alt]) => {
        respostasFinais[Number(q)] = alt ? [alt] : [];
    });

    document.getElementById('modalRevisao').style.display = 'none';
    document.body.classList.remove('modal-aberto');
    const p = correcaoPendente;
    correcaoPendente = null;
    definirStatusCorrecao('Salvando correção conferida...', 'info');
    try {
        await finalizarCorrecao(respostasFinais, p.gabaritoUnificado, p.nomeAluno, p.notaRedacao, p.revisoesManuais);
    } catch(e) {
        console.error(e);
        definirStatusCorrecao('Não foi possível concluir a correção.', 'erro');
        alert('Não foi possível concluir a correção. Tente novamente.');
    } finally {
        correcaoEmAndamento = false;
        travarBotaoCorrecao(false);
    }
}

async function finalizarCorrecao(respAluno, gabaritoUnificado, nomeAluno, notaRedacao, revisoesManuais = {}) {
    ctx.drawImage(imgAtual, 0, 0);
    let totalPontos = 0; 
    let htmlBlocos = "";
    let htmlPdf = "";
    let totalQuestoesProva = 0;
    
    let errosDoAluno =[];
    let notaBloco1 = 0, notaBloco2 = 0, notaBloco3 = 0, notaBloco4 = 0;
    
    const isEnsinoMedio = configAtual.nome.includes("Médio");
    const isFund9 = configAtual.nome.includes("9º");
    const isFund678 = configAtual.nome.includes("6º") || configAtual.nome.includes("7º") || configAtual.nome.includes("8º");

    configAtual.blocos.forEach((bloco, index) => {
        let pontosB = 0; let totalQ = 0; let linhas = ""; let pdfLinhas = "";
        
        bloco.materias.forEach(nomeMat => {
            const disc = configAtual.materias.find(d => d.nome === nomeMat);
            if(disc) {
                let acertosM = 0;
                for(let q=disc.inicio; q<(disc.inicio+disc.qtd); q++) {
                    const marcadas = respAluno[q] || [];
                    const duplaMarcacao = marcadas.length > 1;
                    const alu = marcadas.length === 1 ? marcadas[0] : undefined;
                    const prof = gabaritoUnificado[q];
                    const isNula = (prof === 'N' || prof === 'X');

                    if (duplaMarcacao) {
                        // Mais de uma alternativa marcada na mesma questão = errada automaticamente
                        marcadas.forEach(letraMarcada => {
                            const zDup = configAtual.mapa.find(m => m.questao==q && m.alt==letraMarcada);
                            if(zDup) { ctx.lineWidth = 5; ctx.strokeStyle = "#c62828"; ctx.strokeRect(zDup.x-(zDup.w/2), zDup.y-(zDup.h/2), zDup.w, zDup.h); }
                        });
                        errosDoAluno.push(q);
                        if(prof && !isNula) { const zC = configAtual.mapa.find(m => m.questao==q && m.alt==prof); if(zC) { ctx.lineWidth=4; ctx.strokeStyle="#ffc107"; ctx.strokeRect(zC.x-(zC.w/2), zC.y-(zC.h/2), zC.w, zC.h); } }
                    } else if (isNula) {
                        acertosM++; 
                        const todasOpcoesQ = configAtual.mapa.filter(m => m.questao == q);
                        todasOpcoesQ.forEach(zOp => { ctx.lineWidth = 3; ctx.strokeStyle = "#007bff"; ctx.strokeRect(zOp.x-(zOp.w/2), zOp.y-(zOp.h/2), zOp.w, zOp.h); });
                        if(alu) { const zAlu = configAtual.mapa.find(m => m.questao==q && m.alt==alu); if(zAlu) { ctx.lineWidth = 6; ctx.strokeStyle = "#007bff"; ctx.strokeRect(zAlu.x-(zAlu.w/2), zAlu.y-(zAlu.h/2), zAlu.w, zAlu.h); } }
                    } else {
                        if(alu) { 
                            const z = configAtual.mapa.find(m => m.questao==q && m.alt==alu); 
                            if(z) { 
                                ctx.lineWidth = 5; 
                                if(prof && alu==prof) { 
                                    ctx.strokeStyle="#0b7a25"; acertosM++; 
                                } else { 
                                    ctx.strokeStyle="#c62828"; 
                                    errosDoAluno.push(q);
                                } 
                                ctx.strokeRect(z.x-(z.w/2), z.y-(z.h/2), z.w, z.h); 
                            } 
                        } else {
                            if(prof) errosDoAluno.push(q);
                        }

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

    const resultadoSalvamento = await salvarAlunoNoHistorico({
        id: Date.now(), 
        data: new Date().toLocaleDateString(), 
        nome: nomeAluno, 
        turma: configAtual.nome, 
        redacao: notaRedacao.toFixed(1), 
        total: parseFloat(totalPontos.toFixed(1)), 
        b1: notaBloco1.toFixed(1),
        b2: notaBloco2.toFixed(1),
        b3: notaBloco3.toFixed(1),
        b4: notaBloco4.toFixed(1),
        erros: errosDoAluno,
        revisoesManuais: revisoesManuais,
        qtdRevisoesManuais: Object.keys(revisoesManuais).length,
        versaoSistema: VERSAO_SISTEMA
    });

    if(!resultadoSalvamento?.ok) {
        definirStatusCorrecao('Correção calculada, mas NÃO foi salva no histórico. Verifique a conexão.', 'erro');
        throw new Error(resultadoSalvamento?.mensagem || 'Falha ao salvar histórico');
    }
    definirStatusCorrecao(`Correção salva com sucesso${Object.keys(revisoesManuais).length ? ` (${Object.keys(revisoesManuais).length} revisão(ões) manual(is))` : ''}.`, 'ok');
}
