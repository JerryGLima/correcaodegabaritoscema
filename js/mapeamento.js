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
