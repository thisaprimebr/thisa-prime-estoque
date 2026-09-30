const KEY='thisa_prime_v1';
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{
 user:null,
 materials:[
  {id:1,code:'MAT-001',name:'Cabo de rede CAT6',category:'Redes',qty:35,min:10,location:'Almoxarifado A',supplier:'—',notes:''},
  {id:2,code:'MAT-002',name:'Fonte 12V 5A',category:'Eletrônica',qty:8,min:10,location:'Prateleira B',supplier:'—',notes:''},
  {id:3,code:'MAT-003',name:'Conector RJ45',category:'Redes',qty:120,min:30,location:'Gaveta 03',supplier:'—',notes:''}
 ],
 movements:[],
 requests:[],
 users:[{id:1,name:'Administrador',username:'admin',password:'admin123',role:'Administrador'}],
 history:[]
};
function persist(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function now(){return new Date().toLocaleString('pt-BR')}
function addHistory(action,detail){state.history.unshift({date:now(),user:state.user?.name||'Sistema',action,detail});state.history=state.history.slice(0,200);persist()}
function login(){
 const u=document.getElementById('loginUser').value.trim(),p=document.getElementById('loginPass').value;
 const found=state.users.find(x=>x.username===u&&x.password===p);
 if(!found){document.getElementById('loginMsg').textContent='Usuário ou senha inválidos.';return}
 state.user={id:found.id,name:found.name,role:found.role};persist();startApp();
}
function logout(){state.user=null;persist();location.reload()}
function startApp(){document.getElementById('loginScreen').classList.add('hidden');document.getElementById('app').classList.remove('hidden');document.getElementById('loggedUser').textContent=state.user.name+' · '+state.user.role;renderAll()}
function showPage(page){
 document.querySelectorAll('.page').forEach(x=>x.classList.add('hidden'));document.getElementById(page).classList.remove('hidden');
 document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
 const titles={dashboard:'Dashboard',materials:'Materiais',movement:'Movimentação',requests:'Solicitações',history:'Histórico',users:'Usuários'};
 document.getElementById('pageTitle').textContent=titles[page]||page;
 document.querySelector('.sidebar').classList.remove('open');
 renderAll();
}
function toggleSide(){document.querySelector('.sidebar').classList.toggle('open')}
function renderAll(){renderDashboard();renderMaterials();renderMovement();renderRequests();renderHistory();renderUsers();fillMoveMaterials()}
function status(m){if(m.qty<=0)return '<span class="badge out">Sem estoque</span>';if(m.qty<=m.min)return '<span class="badge low">Estoque baixo</span>';return '<span class="badge ok">Normal</span>'}
function renderDashboard(){
 document.getElementById('kpiMaterials').textContent=state.materials.length;
 document.getElementById('kpiUnits').textContent=state.materials.reduce((a,m)=>a+Number(m.qty),0);
 document.getElementById('kpiLow').textContent=state.materials.filter(m=>m.qty<=m.min).length;
 document.getElementById('kpiRequests').textContent=state.requests.filter(r=>r.status==='Aberta').length;
 const q=(document.getElementById('dashSearch')?.value||'').toLowerCase();
 const ms=state.materials.filter(m=>(m.name+' '+m.code+' '+m.category).toLowerCase().includes(q));
 document.getElementById('stockTable').innerHTML=table(['Código','Material','Categoria','Qtd.','Mínimo','Status'],ms.map(m=>[esc(m.code),esc(m.name),esc(m.category),m.qty,m.min,status(m)]));
 const h=state.history.slice(0,7);
 document.getElementById('recentHistory').innerHTML=h.length?h.map(x=>`<div class="list-item"><b>${esc(x.action)}</b><span class="muted">${esc(x.detail)} · ${esc(x.date)}</span></div>`).join(''):'<div class="empty">Nenhuma atividade registrada.</div>';
}
function table(headers,rows){if(!rows.length)return '<div class="empty">Nenhum registro encontrado.</div>';return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function renderMaterials(){
 const q=(document.getElementById('materialSearch')?.value||'').toLowerCase();
 const ms=state.materials.filter(m=>(m.name+' '+m.code+' '+m.category).toLowerCase().includes(q));
 document.getElementById('materialsTable').innerHTML=table(['Código','Material','Categoria','Qtd.','Local','Status','Ações'],ms.map(m=>[
 esc(m.code),esc(m.name),esc(m.category),m.qty,esc(m.location),status(m),
 `<div class="actions"><button onclick="openMaterial(${m.id})">Editar</button><button class="danger-btn" onclick="deleteMaterial(${m.id})">Excluir</button></div>`
 ]));
}
function openModal(title,body){document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').innerHTML=body;document.getElementById('modal').classList.remove('hidden')}
function closeModal(){document.getElementById('modal').classList.add('hidden')}
function openMaterial(id){
 const m=state.materials.find(x=>x.id===id)||{code:'',name:'',category:'',qty:0,min:0,location:'',supplier:'',notes:''};
 openModal(id?'Editar material':'Novo material',`<div class="modal-form">
 <label>Código<input id="fCode" value="${esc(m.code)}"></label><label>Nome<input id="fName" value="${esc(m.name)}"></label>
 <label>Categoria<input id="fCat" value="${esc(m.category)}"></label><label>Quantidade<input id="fQty" type="number" min="0" value="${m.qty}"></label>
 <label>Estoque mínimo<input id="fMin" type="number" min="0" value="${m.min}"></label><label>Localização<input id="fLoc" value="${esc(m.location)}"></label>
 <label>Fornecedor<input id="fSup" value="${esc(m.supplier)}"></label><label>Observações<input id="fNotes" value="${esc(m.notes)}"></label>
 </div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancelar</button><button class="primary" onclick="saveMaterial(${id||0})">Salvar</button></div>`);
}
function saveMaterial(id){
 const data={code:f('fCode'),name:f('fName'),category:f('fCat'),qty:+f('fQty'),min:+f('fMin'),location:f('fLoc'),supplier:f('fSup'),notes:f('fNotes')};
 if(!data.name||!data.code){alert('Informe pelo menos código e nome.');return}
 if(id){Object.assign(state.materials.find(m=>m.id===id),data);addHistory('Material alterado',data.name)}else{data.id=Date.now();state.materials.push(data);addHistory('Material cadastrado',data.name)}
 persist();closeModal();renderAll();
}
function deleteMaterial(id){const m=state.materials.find(x=>x.id===id);if(!m)return;if(confirm(`Excluir "${m.name}"?`)){state.materials=state.materials.filter(x=>x.id!==id);addHistory('Material excluído',m.name);persist();renderAll()}}
function f(id){return document.getElementById(id).value.trim()}
function fillMoveMaterials(){const s=document.getElementById('moveMaterial');if(!s)return;s.innerHTML=state.materials.map(m=>`<option value="${m.id}">${esc(m.code)} — ${esc(m.name)} (estoque: ${m.qty})</option>`).join('')}
function saveMovement(){
 const id=+f('moveMaterial'),type=f('moveType'),qty=+f('moveQty'),note=f('moveNote');const m=state.materials.find(x=>x.id===id);
 if(!m||qty<1)return alert('Selecione um material e uma quantidade válida.');
 if(type==='saida'&&m.qty<qty)return alert('Quantidade maior que o estoque disponível.');
 m.qty += type==='entrada'?qty:-qty;
 state.movements.unshift({date:now(),material:m.name,type,qty,note,user:state.user.name});
 addHistory(type==='entrada'?'Entrada de material':'Saída de material',`${m.name} · ${qty} un.`);
 persist();renderAll();alert('Movimentação registrada.');
}
function renderMovement(){document.getElementById('movementTable').innerHTML=table(['Data','Material','Tipo','Qtd.','Usuário','Observação'],state.movements.map(x=>[x.date,esc(x.material),x.type==='entrada'?'<span class="badge ok">Entrada</span>':'<span class="badge out">Saída</span>',x.qty,esc(x.user),esc(x.note||'—')]))}
function openRequest(){
 openModal('Nova solicitação',`<div class="modal-form"><label class="full-row">Material<select id="rMat">${state.materials.map(m=>`<option value="${m.id}">${esc(m.code)} — ${esc(m.name)}</option>`).join('')}</select></label><label>Quantidade<input id="rQty" type="number" min="1" value="1"></label><label>Solicitante<input id="rWho" value="${esc(state.user.name)}"></label><label class="full-row">Observação<input id="rNote" placeholder="Motivo ou aplicação"></label></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancelar</button><button class="primary" onclick="saveRequest()">Criar solicitação</button></div>`);
}
function saveRequest(){const m=state.materials.find(x=>x.id===+f('rMat'));const r={id:Date.now(),date:now(),material:m.name,qty:+f('rQty'),requester:f('rWho'),note:f('rNote'),status:'Aberta'};state.requests.unshift(r);addHistory('Solicitação criada',`${m.name} · ${r.qty} un.`);persist();closeModal();renderAll()}
function renderRequests(){document.getElementById('requestsTable').innerHTML=table(['Data','Material','Qtd.','Solicitante','Status','Ação'],state.requests.map(r=>[r.date,esc(r.material),r.qty,esc(r.requester),`<span class="badge ${r.status==='Aberta'?'low':'ok'}">${r.status}</span>`,`<select class="status-select" onchange="changeRequest(${r.id},this.value)"><option ${r.status==='Aberta'?'selected':''}>Aberta</option><option ${r.status==='Atendida'?'selected':''}>Atendida</option><option ${r.status==='Cancelada'?'selected':''}>Cancelada</option></select>`]))}
function changeRequest(id,status){const r=state.requests.find(x=>x.id===id);r.status=status;addHistory('Solicitação atualizada',`${r.material} · ${status}`);persist();renderAll()}
function renderHistory(){document.getElementById('historyTable').innerHTML=table(['Data','Usuário','Ação','Detalhes'],state.history.map(x=>[x.date,esc(x.user),esc(x.action),esc(x.detail)]))}
function openUser(){
 openModal('Novo usuário',`<div class="modal-form"><label>Nome<input id="uName"></label><label>Usuário<input id="uUser"></label><label>Senha<input id="uPass" type="password"></label><label>Perfil<select id="uRole"><option>Usuário</option><option>Administrador</option></select></label></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancelar</button><button class="primary" onclick="saveUser()">Criar</button></div>`)
}
function saveUser(){const name=f('uName'),username=f('uUser'),password=f('uPass'),role=f('uRole');if(!name||!username||!password)return alert('Preencha todos os campos.');if(state.users.some(x=>x.username===username))return alert('Esse usuário já existe.');state.users.push({id:Date.now(),name,username,password,role});addHistory('Usuário criado',username);persist();closeModal();renderAll()}
function renderUsers(){document.getElementById('usersTable').innerHTML=table(['Nome','Usuário','Perfil','Ação'],state.users.map(u=>[esc(u.name),esc(u.username),esc(u.role),`<div class="actions">${u.username==='admin'?'<span class="muted">Principal</span>':`<button class="danger-btn" onclick="deleteUser(${u.id})">Excluir</button>`}</div>`]))}
function deleteUser(id){const u=state.users.find(x=>x.id===id);if(confirm(`Excluir usuário ${u.username}?`)){state.users=state.users.filter(x=>x.id!==id);addHistory('Usuário excluído',u.username);persist();renderAll()}}
document.getElementById('loginPass').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
if(state.user){startApp()}
