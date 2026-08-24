// ==========================================
// MAPEAMENTO OMR - V2.5
// Mapeamento por MODELO DE CARTÃO compartilhado entre turmas.
// Firebase é preferencial; localStorage é fallback.
// ==========================================

const MAPA_STORAGE_PREFIX = 'cema_omr_modelo_';
const MODELOS_MAPA = {
    medio125: { nome:'Ensino Médio — 125 questões', turmas:['medio1','medio2','medio3A','medio3B'] },
    fund105:  { nome:'Fundamental — 105 questões', turmas:['fund9A','fund9B'] },
    fund100:  { nome:'Fundamental — 100 questões', turmas:['fund6','fund7','fund8'] }
};

function obterIdTurmaAtual() {
    const selAdmin = document.getElementById('selTurmaAdmin');
    const selProf = document.getElementById('selTurmaProf');
    return (usuarioAtualRole === 'admin' && selAdmin ? selAdmin.value : (selProf ? selProf.value : (selAdmin ? selAdmin.value : 'medio1')));
}
function obterIdModeloDaTurma(idTurma) { return BANCO_DE_PROVAS[idTurma]?.modeloMapa || idTurma; }
function obterModeloAtual() { return obterIdModeloDaTurma(obterIdTurmaAtual()); }
function turmasDoModelo(idModelo) { return MODELOS_MAPA[idModelo]?.turmas || [obterIdTurmaAtual()]; }
function nomeModelo(idModelo) { return MODELOS_MAPA[idModelo]?.nome || idModelo; }

function atualizarInfoModeloMapa() {
    const idModelo = obterModeloAtual();
    const el = document.getElementById('infoModeloMapa');
    if(!el) return;
    const nomes = turmasDoModelo(idModelo).map(id => BANCO_DE_PROVAS[id]?.nome).filter(Boolean);
    el.innerHTML = `<b>Modelo:</b> ${nomeModelo(idModelo)}<br><span style="font-size:.85rem;color:#666">Usado automaticamente por: ${nomes.join(', ')}</span>`;
}

function mapaEhValido(mapa) {
    if(!Array.isArray(mapa) || mapa.length === 0) return false;
    return mapa.every(i => i && Number.isFinite(Number(i.questao)) && ['A','B','C','D','E'].includes(i.alt) && Number.isFinite(Number(i.x)) && Number.isFinite(Number(i.y)) && Number.isFinite(Number(i.w)) && Number.isFinite(Number(i.h)));
}
function definirStatusMapa(texto, tipo='info') {
    const el = document.getElementById('statusMapa'); if(!el) return;
    el.textContent = texto; el.className = 'mapa-status ' + tipo;
}
function salvarMapaLocal(idModelo, mapa, meta={}) {
    try { localStorage.setItem(MAPA_STORAGE_PREFIX + idModelo, JSON.stringify({ mapa, ...meta, salvoEm:new Date().toISOString() })); return true; }
    catch(e) { console.warn('Não foi possível salvar mapa localmente:', e); return false; }
}
function carregarMapaLocal(idModelo) {
    try { const raw=localStorage.getItem(MAPA_STORAGE_PREFIX+idModelo); if(!raw) return null; const obj=JSON.parse(raw); return mapaEhValido(obj?.mapa)?obj:null; }
    catch(e) { console.warn('Mapa local inválido:', e); return null; }
}
function aplicarMapaAoModelo(idModelo, mapa) {
    turmasDoModelo(idModelo).forEach(id => { if(BANCO_DE_PROVAS[id]) BANCO_DE_PROVAS[id].mapa = mapa; });
    const idTurma=obterIdTurmaAtual(); if(BANCO_DE_PROVAS[idTurma]) configAtual=BANCO_DE_PROVAS[idTurma];
}

async function carregarMapeamentoSalvo(idTurma) {
    if(!idTurma || !BANCO_DE_PROVAS[idTurma]) return;
    const idModelo=obterIdModeloDaTurma(idTurma); let carregado=false;
    atualizarInfoModeloMapa();
    if(db) {
        try {
            const doc=await db.collection('mapas_modelos').doc(idModelo).get();
            if(doc.exists && mapaEhValido(doc.data().mapa)) {
                const dados=doc.data(); aplicarMapaAoModelo(idModelo,dados.mapa);
                salvarMapaLocal(idModelo,dados.mapa,{origem:'firebase',largura:dados.largura||null,altura:dados.altura||null});
                definirStatusMapa(`☁️ Modelo compartilhado carregado da nuvem (${dados.mapa.length} pontos).`,'ok'); carregado=true;
            }
        } catch(e) { console.warn('Não foi possível carregar mapa do modelo na nuvem.',e); }
    }
    if(!carregado) {
        const local=carregarMapaLocal(idModelo);
        if(local) { aplicarMapaAoModelo(idModelo,local.mapa); definirStatusMapa(`💻 Modelo compartilhado carregado deste computador (${local.mapa.length} pontos).`,'ok'); carregado=true; }
    }
    // Compatibilidade V2.4: tenta migrar mapa salvo por turma para o novo modelo.
    if(!carregado) {
        try {
            const antigoLocal=localStorage.getItem('cema_omr_mapa_'+idTurma);
            if(antigoLocal) { const obj=JSON.parse(antigoLocal); if(mapaEhValido(obj?.mapa)) { aplicarMapaAoModelo(idModelo,obj.mapa); salvarMapaLocal(idModelo,obj.mapa,{origem:'migrado-v24'}); definirStatusMapa('✅ Mapeamento da V2.4 migrado para o modelo compartilhado.','ok'); carregado=true; } }
        } catch(e) {}
    }
    if(!carregado) definirStatusMapa(`✅ Usando o mapa padrão do modelo ${nomeModelo(idModelo)} (${BANCO_DE_PROVAS[idTurma].mapa.length} pontos).`,'info');
}

async function salvarMapeamentoAtual() {
    const idTurma=obterIdTurmaAtual(); if(!idTurma || !BANCO_DE_PROVAS[idTurma]) return alert('Selecione uma turma.');
    if(!mapaEhValido(mapaTemp)) return alert('Finalize o mapeamento antes de salvar.');
    const idModelo=obterIdModeloDaTurma(idTurma); const totalQuestoes=configAtual.materias.reduce((s,m)=>s+Number(m.qtd||0),0); const esperado=totalQuestoes*5;
    if(mapaTemp.length!==esperado && !confirm(`O mapa possui ${mapaTemp.length} pontos, mas eram esperados ${esperado}. Deseja salvar mesmo assim?`)) return;
    const mapa=mapaTemp.map(i=>({id:String(i.id),questao:Number(i.questao),alt:String(i.alt),x:Number(i.x),y:Number(i.y),w:Number(i.w),h:Number(i.h)}));
    const localOk=salvarMapaLocal(idModelo,mapa,{modeloNome:nomeModelo(idModelo),turmas:turmasDoModelo(idModelo),largura:imgAtual.width||null,altura:imgAtual.height||null,origem:'mapeamento'});
    aplicarMapaAoModelo(idModelo,mapa); definirStatusMapa('Salvando modelo compartilhado...','info');
    let nuvemOk=false;
    if(db) try {
        await db.collection('mapas_modelos').doc(idModelo).set({modeloId:idModelo,modeloNome:nomeModelo(idModelo),turmas:turmasDoModelo(idModelo),mapa,largura:imgAtual.width||null,altura:imgAtual.height||null,atualizadoEm:firebase.firestore.FieldValue.serverTimestamp()}); nuvemOk=true;
    } catch(e) { console.warn('Firebase não permitiu salvar o modelo:',e); }
    const nomes=turmasDoModelo(idModelo).map(id=>BANCO_DE_PROVAS[id]?.nome).filter(Boolean).join(', ');
    if(nuvemOk) { definirStatusMapa(`✅ Modelo salvo e aplicado a ${turmasDoModelo(idModelo).length} turma(s).`,'ok'); alert(`Mapeamento salvo com sucesso!\n\nEste mesmo mapa agora será usado automaticamente por:\n${nomes}\n\nNão é necessário mapear cada turma separadamente.`); }
    else if(localOk) { definirStatusMapa(`✅ Modelo salvo neste computador e compartilhado entre as turmas.`,'ok'); alert(`Mapeamento salvo neste computador.\n\nEle será usado por:\n${nomes}\n\nO Firebase não aceitou a nova coleção, mas você não precisa copiar código.`); }
    else { definirStatusMapa('⚠️ Aplicado nesta sessão, mas não foi possível salvar.','erro'); alert('O mapa foi aplicado nesta sessão, mas não foi possível gravá-lo. Baixe o JSON antes de fechar.'); }
}

function iniciarMapeamento(){ if(!imgAtual.src)return alert('Carregue uma imagem!'); resetMapeamento(); }
function resetMapeamento(){ estadoMap=1;indiceDisc=0;mapaTemp=[];const area=document.getElementById('areaCodigo');if(area)area.style.display='none';atualizarInfoModeloMapa();atualizarTextoMap(); }
function copiarCodigo(){const out=document.getElementById('outputCodigo');if(!out)return;out.select();document.execCommand('copy');const btn=document.getElementById('btnCopiar');if(btn){btn.innerText='✅ Copiado!';setTimeout(()=>btn.innerText='📋 Copiar JSON de backup',2000);}}
function baixarMapaJSON(){if(!mapaEhValido(mapaTemp))return alert('Finalize o mapeamento primeiro.');const idModelo=obterModeloAtual();const dados=JSON.stringify({modelo:idModelo,nome:nomeModelo(idModelo),turmas:turmasDoModelo(idModelo),mapa:mapaTemp},null,2);const blob=new Blob([dados],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mapa-${idModelo}.json`;a.click();URL.revokeObjectURL(a.href);}
function atualizarTextoMap(){const txt=document.getElementById('instrucaoTexto');if(!txt||!configAtual?.materias?.length)return;const qtdPrimeira=configAtual.materias[0].qtd,nomePrimeira=configAtual.materias[0].nome;if(estadoMap===1)txt.innerHTML=`<b>PASSO 1:</b> Clique <b>01-A</b> (${nomePrimeira})`;else if(estadoMap===2)txt.innerHTML='<b>PASSO 2:</b> Clique <b>01-E</b> (Largura)';else if(estadoMap===3)txt.innerHTML=`<b>PASSO 3:</b> Clique <b>${qtdPrimeira}-A</b> (Altura)`;else if(estadoMap===4&&indiceDisc<configAtual.materias.length)txt.innerHTML=`<b>PASSO 4:</b> Clique Letra A de <b>${configAtual.materias[indiceDisc].nome}</b>`;else if(indiceDisc>=configAtual.materias.length)txt.innerHTML='<b>FIM!</b> Confira e clique em <b>Salvar mapeamento</b>.';}
if(canvasEl)canvasEl.addEventListener('mousedown',e=>{if(!document.getElementById('tab-mapear').classList.contains('active')||!imgAtual.src)return;const rect=canvasEl.getBoundingClientRect(),scaleX=canvasEl.width/rect.width,scaleY=canvasEl.height/rect.height,x=(e.clientX-rect.left)*scaleX,y=(e.clientY-rect.top)*scaleY;ctx.strokeStyle='blue';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-10,y-10);ctx.lineTo(x+10,y+10);ctx.moveTo(x+10,y-10);ctx.lineTo(x-10,y+10);ctx.stroke();if(estadoMap===1){calib.xA=x;calib.yA=y;estadoMap=2;}else if(estadoMap===2){calib.distX=(x-calib.xA)/4;estadoMap=3;}else if(estadoMap===3){const qtdPrimeira=configAtual.materias[0].qtd;calib.distY=(y-calib.yA)/(qtdPrimeira-1);estadoMap=4;}else if(estadoMap===4&&indiceDisc<configAtual.materias.length){gerarBlocoDisciplina(x,y,configAtual.materias[indiceDisc]);indiceDisc++;if(indiceDisc>=configAtual.materias.length)finalizarMapeamento();}atualizarTextoMap();});
function gerarBlocoDisciplina(xBase,yBase,config){for(let i=0;i<config.qtd;i++){const qNum=config.inicio+i,y=yBase+(i*calib.distY);['A','B','C','D','E'].forEach((letra,idx)=>{const x=xBase+(idx*calib.distX);mapaTemp.push({id:`Q${qNum}-${letra}`,questao:qNum,alt:letra,x:Math.round(x),y:Math.round(y),w:Math.round(calib.distX*.7),h:Math.round(calib.distY*.7)});ctx.strokeStyle='lime';ctx.lineWidth=2;ctx.strokeRect(x-(calib.distX*.35),y-(calib.distY*.35),calib.distX*.7,calib.distY*.7);});}}
function finalizarMapeamento(){const area=document.getElementById('areaCodigo'),out=document.getElementById('outputCodigo');if(area)area.style.display='block';if(out)out.value=JSON.stringify(mapaTemp);definirStatusMapa(`🟢 Mapeamento concluído: ${mapaTemp.length} pontos. Salve uma vez para todas as turmas deste modelo.`,'ok');}
