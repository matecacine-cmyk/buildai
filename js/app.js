// ─── BuildAI App ──────────────────────────────────────────────────────────────
const App = {
  goto(page) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    const titles = { dashboard:'Dashboard', projects:'Projetos', quotes:'Orçamentos', invoices:'Faturas', clients:'Clientes', settings:'Definições', statistics:'Estatísticas' };
    document.getElementById('page-title').textContent = titles[page] || page;
    document.getElementById('sidebar').classList.remove('open');
    const pages = { dashboard: Pages.dashboard, projects: Pages.projects, quotes: Pages.quotes, invoices: Pages.invoices, clients: Pages.clients, settings: Pages.settings, statistics: Pages.statistics };
    if (pages[page]) pages[page]();
  },

  toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 3000);
  },

  fmt(val) {
    return '€' + Number(val || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  uid() { return Auth.current.id; },
};

// ─── Modal ────────────────────────────────────────────────────────────────────
function openModal(title, html) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}
document.addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

// ─── Pages ────────────────────────────────────────────────────────────────────
const Pages = {
  set(html) { document.getElementById('app-main').innerHTML = html; },

  // ── Dashboard ──
  dashboard() {
    const uid = App.uid();
    const projects = DB.getProjects(uid);
    const invoices = DB.getInvoices(uid);
    const quotes = DB.getQuotes(uid);
    const clients = DB.getClients(uid);

    const totalFaturado = invoices.filter(i => i.status === 'pago').reduce((s, i) => s + Number(i.total || 0), 0);
    const pendentes = invoices.filter(i => i.status === 'pendente').length;
    const ativos = projects.filter(p => p.status === 'ativo').length;

    Pages.set(`
      <div class="page-content">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div>
              <div class="stat-val">${projects.length}</div>
              <div class="stat-label">Projetos</div>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">💶</div>
            <div>
              <div class="stat-val">${App.fmt(totalFaturado)}</div>
              <div class="stat-label">Total Faturado</div>
            </div>
          </div>
          <div class="stat-card yellow">
            <div class="stat-icon">⏳</div>
            <div>
              <div class="stat-val">${pendentes}</div>
              <div class="stat-label">Faturas Pendentes</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div>
              <div class="stat-val">${clients.length}</div>
              <div class="stat-label">Clientes</div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="dash-section">
            <div class="section-row">
              <h3>Projetos Recentes</h3>
              <button class="btn-sm" onclick="App.goto('projects')">Ver todos</button>
            </div>
            ${projects.length === 0
              ? '<p class="empty-hint">Sem projetos ainda. <a onclick="Pages.newProject()">Criar primeiro projeto →</a></p>'
              : projects.slice(-5).reverse().map(p => `
                <div class="list-item" onclick="Pages.editProject('${p.id}')">
                  <div>
                    <strong>${p.name}</strong>
                    <span class="meta">${p.client || 'Sem cliente'}</span>
                  </div>
                  <span class="status-badge ${p.status}">${p.status}</span>
                </div>
              `).join('')}
          </div>

          <div class="dash-section">
            <div class="section-row">
              <h3>Faturas Recentes</h3>
              <button class="btn-sm" onclick="App.goto('invoices')">Ver todas</button>
            </div>
            ${invoices.length === 0
              ? '<p class="empty-hint">Sem faturas ainda. <a onclick="Pages.newInvoice()">Criar fatura →</a></p>'
              : invoices.slice(-5).reverse().map(i => `
                <div class="list-item" onclick="Pages.viewInvoice('${i.id}')">
                  <div>
                    <strong>Fatura #${i.number}</strong>
                    <span class="meta">${i.client || 'Sem cliente'}</span>
                  </div>
                  <div style="text-align:right">
                    <strong>${App.fmt(i.total)}</strong>
                    <span class="status-badge ${i.status}">${i.status}</span>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    `);
  },

  // ── Projects ──
  projects() {
    const list = DB.getProjects(App.uid());
    Pages.set(`
      <div class="page-content">
        <div class="page-toolbar">
          <h2>Projetos <span class="count">${list.length}</span></h2>
          <button class="btn-primary" onclick="Pages.newProject()">+ Novo Projeto</button>
        </div>
        ${list.length === 0
          ? '<div class="empty-state"><div class="empty-icon">📋</div><p>Sem projetos ainda.</p><button class="btn-primary" onclick="Pages.newProject()">Criar Primeiro Projeto</button></div>'
          : `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>Nome</th><th>Cliente</th><th>Valor</th><th>Estado</th><th>Data</th><th></th></tr></thead>
              <tbody>${list.reverse().map(p => `
                <tr>
                  <td><strong>${p.name}</strong>${p.desc ? `<br><small>${p.desc}</small>` : ''}</td>
                  <td>${p.client || '—'}</td>
                  <td>${App.fmt(p.value)}</td>
                  <td><span class="status-badge ${p.status}">${p.status}</span></td>
                  <td>${p.date || '—'}</td>
                  <td class="actions">
                    <button onclick="Pages.editProject('${p.id}')" title="Editar">✏️</button>
                    <button onclick="Pages.deleteProject('${p.id}')" title="Apagar">🗑️</button>
                  </td>
                </tr>
              `).join('')}</tbody>
            </table></div>`
        }
      </div>
    `);
  },

  newProject() {
    const clients = DB.getClients(App.uid());
    openModal('Novo Projeto', `
      <div class="form-grid">
        <div class="form-group full"><label>Nome do Projeto *</label><input id="p-name" placeholder="Ex: Remodelação Cozinha"></div>
        <div class="form-group"><label>Cliente</label>
          <select id="p-client">
            <option value="">Sem cliente</option>
            ${clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Valor (€)</label><input id="p-value" type="number" placeholder="0.00"></div>
        <div class="form-group"><label>Data de Início</label><input id="p-date" type="date"></div>
        <div class="form-group"><label>Estado</label>
          <select id="p-status">
            <option value="ativo">Ativo</option>
            <option value="concluído">Concluído</option>
            <option value="pausado">Pausado</option>
          </select>
        </div>
        <div class="form-group full"><label>Descrição</label><textarea id="p-desc" rows="3" placeholder="Detalhes do projeto..."></textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="Pages.saveProject()">Guardar</button>
      </div>
    `);
  },

  saveProject(id) {
    const name = document.getElementById('p-name').value.trim();
    if (!name) { App.toast('Nome obrigatório', 'error'); return; }
    const p = {
      id: id || DB.newId(), userId: App.uid(),
      name, client: document.getElementById('p-client').value,
      value: document.getElementById('p-value').value,
      date: document.getElementById('p-date').value,
      status: document.getElementById('p-status').value,
      desc: document.getElementById('p-desc').value,
      updatedAt: new Date().toISOString(),
    };
    DB.saveProject(p);
    closeModal();
    App.toast('Projeto guardado!', 'success');
    Pages.projects();
  },

  editProject(id) {
    const p = DB.getProjects(App.uid()).find(x => x.id === id);
    if (!p) return;
    const clients = DB.getClients(App.uid());
    openModal('Editar Projeto', `
      <div class="form-grid">
        <div class="form-group full"><label>Nome *</label><input id="p-name" value="${p.name}"></div>
        <div class="form-group"><label>Cliente</label>
          <select id="p-client">
            <option value="">Sem cliente</option>
            ${clients.map(c => `<option value="${c.name}" ${c.name === p.client ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Valor (€)</label><input id="p-value" type="number" value="${p.value || ''}"></div>
        <div class="form-group"><label>Data</label><input id="p-date" type="date" value="${p.date || ''}"></div>
        <div class="form-group"><label>Estado</label>
          <select id="p-status">
            ${['ativo','concluído','pausado'].map(s => `<option value="${s}" ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full"><label>Descrição</label><textarea id="p-desc" rows="3">${p.desc || ''}</textarea></div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="Pages.saveProject('${id}')">Guardar</button>
      </div>
    `);
  },

  deleteProject(id) {
    if (!confirm('Apagar projeto?')) return;
    DB.deleteProject(id);
    App.toast('Projeto apagado.', '');
    Pages.projects();
  },

  // ── Clients ──
  clients() {
    const list = DB.getClients(App.uid());
    Pages.set(`
      <div class="page-content">
        <div class="page-toolbar">
          <h2>Clientes <span class="count">${list.length}</span></h2>
          <button class="btn-primary" onclick="Pages.newClient()">+ Novo Cliente</button>
        </div>
        ${list.length === 0
          ? '<div class="empty-state"><div class="empty-icon">👥</div><p>Sem clientes ainda.</p><button class="btn-primary" onclick="Pages.newClient()">Adicionar Cliente</button></div>'
          : `<div class="clients-grid">${list.map(c => `
              <div class="client-card">
                <div class="client-avatar">${c.name[0].toUpperCase()}</div>
                <div class="client-info">
                  <strong>${c.name}</strong>
                  <span>${c.email || ''}</span>
                  <span>${c.phone || ''}</span>
                </div>
                <div class="actions">
                  <button onclick="Pages.editClient('${c.id}')">✏️</button>
                  <button onclick="Pages.deleteClient('${c.id}')">🗑️</button>
                </div>
              </div>
            `).join('')}</div>`
        }
      </div>
    `);
  },

  newClient() {
    openModal('Novo Cliente', `
      <div class="form-grid">
        <div class="form-group full"><label>Nome *</label><input id="c-name" placeholder="Nome do cliente"></div>
        <div class="form-group"><label>Email</label><input id="c-email" type="email" placeholder="email@exemplo.com"></div>
        <div class="form-group"><label>Telefone</label><input id="c-phone" placeholder="+351 900 000 000"></div>
        <div class="form-group full"><label>Morada</label><input id="c-address" placeholder="Rua, Cidade"></div>
        <div class="form-group"><label>NIF</label><input id="c-nif" placeholder="000000000"></div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="Pages.saveClient()">Guardar</button>
      </div>
    `);
  },

  saveClient(id) {
    const name = document.getElementById('c-name').value.trim();
    if (!name) { App.toast('Nome obrigatório', 'error'); return; }
    DB.saveClient({ id: id || DB.newId(), userId: App.uid(), name, email: document.getElementById('c-email').value, phone: document.getElementById('c-phone').value, address: document.getElementById('c-address').value, nif: document.getElementById('c-nif').value });
    closeModal();
    App.toast('Cliente guardado!', 'success');
    Pages.clients();
  },

  editClient(id) {
    const c = DB.getClients(App.uid()).find(x => x.id === id);
    if (!c) return;
    openModal('Editar Cliente', `
      <div class="form-grid">
        <div class="form-group full"><label>Nome *</label><input id="c-name" value="${c.name}"></div>
        <div class="form-group"><label>Email</label><input id="c-email" type="email" value="${c.email || ''}"></div>
        <div class="form-group"><label>Telefone</label><input id="c-phone" value="${c.phone || ''}"></div>
        <div class="form-group full"><label>Morada</label><input id="c-address" value="${c.address || ''}"></div>
        <div class="form-group"><label>NIF</label><input id="c-nif" value="${c.nif || ''}"></div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="Pages.saveClient('${id}')">Guardar</button>
      </div>
    `);
  },

  deleteClient(id) {
    if (!confirm('Apagar cliente?')) return;
    DB.deleteClient(id);
    App.toast('Cliente apagado.', '');
    Pages.clients();
  },

  // ── Invoices ──
  invoices() {
    const list = DB.getInvoices(App.uid());
    const total = list.reduce((s, i) => s + Number(i.total || 0), 0);
    Pages.set(`
      <div class="page-content">
        <div class="page-toolbar">
          <h2>Faturas <span class="count">${list.length}</span></h2>
          <button class="btn-primary" onclick="Pages.newInvoice()">+ Nova Fatura</button>
        </div>
        <div class="invoice-summary">
          <div class="inv-sum-item"><strong>${App.fmt(list.filter(i=>i.status==='pago').reduce((s,i)=>s+Number(i.total||0),0))}</strong><span>Recebido</span></div>
          <div class="inv-sum-item yellow"><strong>${App.fmt(list.filter(i=>i.status==='pendente').reduce((s,i)=>s+Number(i.total||0),0))}</strong><span>Pendente</span></div>
          <div class="inv-sum-item"><strong>${App.fmt(total)}</strong><span>Total</span></div>
        </div>
        ${list.length === 0
          ? '<div class="empty-state"><div class="empty-icon">🧾</div><p>Sem faturas ainda.</p><button class="btn-primary" onclick="Pages.newInvoice()">Criar Fatura</button></div>'
          : `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>#</th><th>Cliente</th><th>Data</th><th>Total</th><th>Estado</th><th></th></tr></thead>
              <tbody>${list.reverse().map(i => `
                <tr>
                  <td><strong>#${i.number}</strong></td>
                  <td>${i.client || '—'}</td>
                  <td>${i.date || '—'}</td>
                  <td><strong>${App.fmt(i.total)}</strong></td>
                  <td>
                    <select class="status-select ${i.status}" onchange="Pages.updateInvoiceStatus('${i.id}',this.value)">
                      <option value="pendente" ${i.status==='pendente'?'selected':''}>Pendente</option>
                      <option value="pago" ${i.status==='pago'?'selected':''}>Pago</option>
                      <option value="cancelado" ${i.status==='cancelado'?'selected':''}>Cancelado</option>
                    </select>
                  </td>
                  <td class="actions">
                    <button onclick="Pages.viewInvoice('${i.id}')" title="Ver">👁️</button>
                    <button onclick="Pages.deleteInvoice('${i.id}')" title="Apagar">🗑️</button>
                  </td>
                </tr>
              `).join('')}</tbody>
            </table></div>`
        }
      </div>
    `);
  },

  newInvoice() {
    const clients = DB.getClients(App.uid());
    const invoices = DB.getInvoices(App.uid());
    const nextNum = (invoices.length + 1).toString().padStart(4, '0');
    const today = new Date().toISOString().split('T')[0];
    openModal('Nova Fatura', `
      <div class="form-grid">
        <div class="form-group"><label>Nº Fatura</label><input id="i-number" value="${nextNum}"></div>
        <div class="form-group"><label>Data *</label><input id="i-date" type="date" value="${today}"></div>
        <div class="form-group full"><label>Cliente</label>
          <select id="i-client">
            <option value="">Sem cliente</option>
            ${clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full"><label>Descrição / Serviços</label><textarea id="i-desc" rows="4" placeholder="Descrição dos serviços prestados..."></textarea></div>
        <div class="form-group"><label>Subtotal (€)</label><input id="i-subtotal" type="number" placeholder="0.00" oninput="calcInvoice()"></div>
        <div class="form-group"><label>IVA (%)</label><input id="i-iva" type="number" value="23" oninput="calcInvoice()"></div>
        <div class="form-group"><label>Total (€)</label><input id="i-total" type="number" placeholder="0.00" readonly></div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="Pages.saveInvoice()">Guardar Fatura</button>
      </div>
    `);
  },

  saveInvoice(id) {
    const date = document.getElementById('i-date').value;
    if (!date) { App.toast('Data obrigatória', 'error'); return; }
    const sub = Number(document.getElementById('i-subtotal').value || 0);
    const iva = Number(document.getElementById('i-iva').value || 0);
    const total = sub + (sub * iva / 100);
    const inv = {
      id: id || DB.newId(), userId: App.uid(),
      number: document.getElementById('i-number').value,
      date, client: document.getElementById('i-client').value,
      desc: document.getElementById('i-desc').value,
      subtotal: sub, iva, total, status: 'pendente',
      createdAt: new Date().toISOString(),
    };
    DB.saveInvoice(inv);
    closeModal();
    App.toast('Fatura criada!', 'success');
    Pages.invoices();
  },

  updateInvoiceStatus(id, status) {
    const inv = DB.getInvoices(App.uid()).find(i => i.id === id);
    if (!inv) return;
    inv.status = status;
    DB.saveInvoice(inv);
    App.toast('Estado atualizado!', 'success');
  },

  viewInvoice(id) {
    const inv = DB.getInvoices(App.uid()).find(i => i.id === id);
    if (!inv) return;
    const user = Auth.current;
    openModal('Fatura #' + inv.number, `
      <div class="invoice-preview">
        <div class="inv-header">
          <div><h2>🏗️ ${user.company || user.name}</h2></div>
          <div style="text-align:right"><strong>FATURA</strong><br>#${inv.number}<br>${inv.date}</div>
        </div>
        <div class="inv-client"><strong>Para:</strong> ${inv.client || 'N/A'}</div>
        <div class="inv-desc">${(inv.desc || '').replace(/\n/g,'<br>')}</div>
        <div class="inv-totals">
          <div class="inv-row"><span>Subtotal</span><span>${App.fmt(inv.subtotal)}</span></div>
          <div class="inv-row"><span>IVA (${inv.iva}%)</span><span>${App.fmt(inv.subtotal * inv.iva / 100)}</span></div>
          <div class="inv-row total"><span>TOTAL</span><span>${App.fmt(inv.total)}</span></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" onclick="closeModal()">Fechar</button>
        <button class="btn-primary" onclick="window.print()">🖨️ Imprimir</button>
      </div>
    `);
  },

  deleteInvoice(id) {
    if (!confirm('Apagar fatura?')) return;
    DB.deleteInvoice(id);
    App.toast('Fatura apagada.', '');
    Pages.invoices();
  },

  // ── Quotes ──
  quotes() {
    const list = DB.getQuotes(App.uid());
    Pages.set(`
      <div class="page-content">
        <div class="page-toolbar">
          <h2>Orçamentos <span class="count">${list.length}</span></h2>
          <button class="btn-primary" onclick="Pages.newQuote()">+ Novo Orçamento</button>
        </div>
        ${list.length === 0
          ? '<div class="empty-state"><div class="empty-icon">📊</div><p>Sem orçamentos ainda.</p><button class="btn-primary" onclick="Pages.newQuote()">Criar Orçamento</button></div>'
          : `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>Título</th><th>Cliente</th><th>Total</th><th>Estado</th><th></th></tr></thead>
              <tbody>${list.reverse().map(q => `
                <tr>
                  <td><strong>${q.title}</strong></td>
                  <td>${q.client || '—'}</td>
                  <td><strong>${App.fmt(q.total)}</strong></td>
                  <td><span class="status-badge ${q.status}">${q.status}</span></td>
                  <td class="actions">
                    <button onclick="Pages.editQuote('${q.id}')" title="Editar">✏️</button>
                    <button onclick="Pages.deleteQuote('${q.id}')" title="Apagar">🗑️</button>
                  </td>
                </tr>
              `).join('')}</tbody>
            </table></div>`
        }
      </div>
    `);
  },

  newQuote() {
    const clients = DB.getClients(App.uid());
    openModal('Novo Orçamento', `
      <div class="form-grid">
        <div class="form-group full"><label>Título *</label><input id="q-title" placeholder="Ex: Remodelação Casa de Banho"></div>
        <div class="form-group full"><label>Cliente</label>
          <select id="q-client">
            <option value="">Sem cliente</option>
            ${clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full"><label>Descrição / Itens</label><textarea id="q-desc" rows="5" placeholder="Detalha os trabalhos e materiais incluídos..."></textarea></div>
        <div class="form-group"><label>Mão de Obra (€)</label><input id="q-labor" type="number" placeholder="0.00" oninput="calcQuote()"></div>
        <div class="form-group"><label>Materiais (€)</label><input id="q-materials" type="number" placeholder="0.00" oninput="calcQuote()"></div>
        <div class="form-group"><label>Total (€)</label><input id="q-total" type="number" placeholder="0.00" readonly></div>
        <div class="form-group"><label>Validade</label><input id="q-valid" type="date"></div>
        <div class="form-group"><label>Estado</label>
          <select id="q-status">
            <option value="enviado">Enviado</option>
            <option value="aprovado">Aprovado</option>
            <option value="recusado">Recusado</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="Pages.saveQuote()">Guardar</button>
      </div>
    `);
  },

  saveQuote(id) {
    const title = document.getElementById('q-title').value.trim();
    if (!title) { App.toast('Título obrigatório', 'error'); return; }
    const labor = Number(document.getElementById('q-labor').value || 0);
    const materials = Number(document.getElementById('q-materials').value || 0);
    const total = labor + materials;
    DB.saveQuote({ id: id || DB.newId(), userId: App.uid(), title, client: document.getElementById('q-client').value, desc: document.getElementById('q-desc').value, labor, materials, total, valid: document.getElementById('q-valid').value, status: document.getElementById('q-status').value, createdAt: new Date().toISOString() });
    closeModal();
    App.toast('Orçamento guardado!', 'success');
    Pages.quotes();
  },

  editQuote(id) {
    const q = DB.getQuotes(App.uid()).find(x => x.id === id);
    if (!q) return;
    const clients = DB.getClients(App.uid());
    openModal('Editar Orçamento', `
      <div class="form-grid">
        <div class="form-group full"><label>Título *</label><input id="q-title" value="${q.title}"></div>
        <div class="form-group full"><label>Cliente</label>
          <select id="q-client">
            <option value="">Sem cliente</option>
            ${clients.map(c => `<option value="${c.name}" ${c.name===q.client?'selected':''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group full"><label>Descrição</label><textarea id="q-desc" rows="5">${q.desc||''}</textarea></div>
        <div class="form-group"><label>Mão de Obra (€)</label><input id="q-labor" type="number" value="${q.labor||''}" oninput="calcQuote()"></div>
        <div class="form-group"><label>Materiais (€)</label><input id="q-materials" type="number" value="${q.materials||''}" oninput="calcQuote()"></div>
        <div class="form-group"><label>Total (€)</label><input id="q-total" type="number" value="${q.total||''}" readonly></div>
        <div class="form-group"><label>Validade</label><input id="q-valid" type="date" value="${q.valid||''}"></div>
        <div class="form-group"><label>Estado</label>
          <select id="q-status">
            ${['enviado','aprovado','recusado'].map(s=>`<option value="${s}" ${s===q.status?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="btn-primary" onclick="Pages.saveQuote('${id}')">Guardar</button>
      </div>
    `);
  },

  deleteQuote(id) {
    if (!confirm('Apagar orçamento?')) return;
    DB.deleteQuote(id);
    App.toast('Orçamento apagado.', '');
    Pages.quotes();
  },

  // ── Statistics ──
  statistics() {
    const uid = App.uid();
    const invoices = DB.getInvoices(uid);
    const quotes = DB.getQuotes(uid);
    const projects = DB.getProjects(uid);
    const clients = DB.getClients(uid);

    // Totals
    const paid    = invoices.filter(i => i.status === 'pago');
    const pending = invoices.filter(i => i.status === 'pendente');
    const overdue = invoices.filter(i => {
      if (i.status !== 'pendente') return false;
      const d = new Date(i.date); d.setDate(d.getDate() + 30);
      return d < new Date();
    });
    const cancelled = invoices.filter(i => i.status === 'cancelado');

    const totalPaid    = paid.reduce((s,i) => s + Number(i.total||0), 0);
    const totalPending = pending.reduce((s,i) => s + Number(i.total||0), 0);
    const totalOverdue = overdue.reduce((s,i) => s + Number(i.total||0), 0);
    const totalAll     = invoices.reduce((s,i) => s + Number(i.total||0), 0);
    const avgInvoice   = invoices.length ? totalAll / invoices.length : 0;
    const payRate      = invoices.length ? Math.round((paid.length / invoices.length) * 100) : 0;

    // Monthly revenue — last 12 months
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const now = new Date();
    const monthlyData = Array.from({length: 12}, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return { label: months[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), paid: 0, pending: 0 };
    });
    invoices.forEach(inv => {
      if (!inv.date) return;
      const d = new Date(inv.date);
      const slot = monthlyData.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (!slot) return;
      if (inv.status === 'pago') slot.paid += Number(inv.total||0);
      else if (inv.status === 'pendente') slot.pending += Number(inv.total||0);
    });

    // Top clients
    const clientTotals = {};
    paid.forEach(inv => {
      if (!inv.client) return;
      clientTotals[inv.client] = (clientTotals[inv.client] || 0) + Number(inv.total||0);
    });
    const topClients = Object.entries(clientTotals).sort((a,b) => b[1]-a[1]).slice(0, 5);
    const maxClientVal = topClients[0]?.[1] || 1;

    // Quotes conversion
    const quotesApproved = quotes.filter(q => q.status === 'aprovado').length;
    const quoteRate = quotes.length ? Math.round((quotesApproved / quotes.length) * 100) : 0;

    Pages.set(`
      <div class="page-content stats-page">

        <!-- KPI row -->
        <div class="stats-kpi-grid">
          <div class="stat-kpi green">
            <div class="stat-kpi-icon">💶</div>
            <div class="stat-kpi-val">${App.fmt(totalPaid)}</div>
            <div class="stat-kpi-label">Total Recebido</div>
            <div class="stat-kpi-sub">${paid.length} fatura${paid.length!==1?'s':''} paga${paid.length!==1?'s':''}</div>
          </div>
          <div class="stat-kpi yellow">
            <div class="stat-kpi-icon">⏳</div>
            <div class="stat-kpi-val">${App.fmt(totalPending)}</div>
            <div class="stat-kpi-label">Por Receber</div>
            <div class="stat-kpi-sub">${pending.length} pendente${pending.length!==1?'s':''}</div>
          </div>
          <div class="stat-kpi red">
            <div class="stat-kpi-icon">⚠️</div>
            <div class="stat-kpi-val">${App.fmt(totalOverdue)}</div>
            <div class="stat-kpi-label">Em Atraso</div>
            <div class="stat-kpi-sub">${overdue.length} fatura${overdue.length!==1?'s':''} vencida${overdue.length!==1?'s':''}</div>
          </div>
          <div class="stat-kpi">
            <div class="stat-kpi-icon">📊</div>
            <div class="stat-kpi-val">${App.fmt(avgInvoice)}</div>
            <div class="stat-kpi-label">Fatura Média</div>
            <div class="stat-kpi-sub">${invoices.length} fatura${invoices.length!==1?'s':''} no total</div>
          </div>
        </div>

        <!-- Charts row 1 -->
        <div class="stats-row">
          <!-- Monthly revenue bar chart -->
          <div class="stats-card stats-card-wide">
            <div class="stats-card-header">
              <h3>Receita Mensal</h3>
              <div class="stats-legend">
                <span class="legend-dot green"></span>Recebido
                <span class="legend-dot yellow" style="margin-left:12px"></span>Pendente
              </div>
            </div>
            <canvas id="chart-monthly" class="stats-canvas" height="200"></canvas>
          </div>

          <!-- Invoice status donut -->
          <div class="stats-card">
            <div class="stats-card-header"><h3>Faturas por Estado</h3></div>
            <div class="donut-wrap">
              <canvas id="chart-donut" width="160" height="160"></canvas>
              <div class="donut-center">
                <strong>${invoices.length}</strong>
                <span>faturas</span>
              </div>
            </div>
            <div class="donut-legend-list">
              ${[
                {label:'Pagas', count:paid.length, color:'#16a34a'},
                {label:'Pendentes', count:pending.length, color:'#eab308'},
                {label:'Em Atraso', count:overdue.length, color:'#ef4444'},
                {label:'Canceladas', count:cancelled.length, color:'#6b7280'},
              ].map(s => `
                <div class="donut-leg-item">
                  <div class="donut-leg-dot" style="background:${s.color}"></div>
                  <span>${s.label}</span>
                  <strong>${s.count}</strong>
                  <span class="donut-leg-pct">${invoices.length ? Math.round(s.count/invoices.length*100) : 0}%</span>
                </div>`).join('')}
            </div>
          </div>
        </div>

        <!-- Charts row 2 -->
        <div class="stats-row">
          <!-- Top clients -->
          <div class="stats-card">
            <div class="stats-card-header"><h3>Top Clientes</h3><span class="stats-tag">por receita recebida</span></div>
            ${topClients.length === 0
              ? '<p class="empty-hint" style="padding:20px">Sem dados ainda.</p>'
              : `<div class="top-clients-list">
                  ${topClients.map(([name, val]) => `
                    <div class="top-client-item">
                      <div class="top-client-avatar">${name[0].toUpperCase()}</div>
                      <div class="top-client-info">
                        <strong>${name}</strong>
                        <div class="top-client-bar-wrap">
                          <div class="top-client-bar" style="width:${Math.round(val/maxClientVal*100)}%"></div>
                        </div>
                      </div>
                      <span class="top-client-val">${App.fmt(val)}</span>
                    </div>`).join('')}
                </div>`}
          </div>

          <!-- Summary metrics -->
          <div class="stats-card">
            <div class="stats-card-header"><h3>Resumo Geral</h3></div>
            <div class="summary-metrics">
              <div class="summary-row">
                <span>Taxa de Pagamento</span>
                <div class="summary-bar-wrap">
                  <div class="summary-bar" style="width:${payRate}%;background:var(--green)"></div>
                </div>
                <strong>${payRate}%</strong>
              </div>
              <div class="summary-row">
                <span>Taxa de Conversão Orçamentos</span>
                <div class="summary-bar-wrap">
                  <div class="summary-bar" style="width:${quoteRate}%;background:var(--gold)"></div>
                </div>
                <strong>${quoteRate}%</strong>
              </div>
              <div class="summary-divider"></div>
              <div class="metric-grid">
                <div class="metric-item"><strong>${projects.filter(p=>p.status==='ativo').length}</strong><span>Projetos Ativos</span></div>
                <div class="metric-item"><strong>${projects.filter(p=>p.status==='concluído').length}</strong><span>Concluídos</span></div>
                <div class="metric-item"><strong>${quotes.length}</strong><span>Orçamentos</span></div>
                <div class="metric-item"><strong>${quotesApproved}</strong><span>Aprovados</span></div>
                <div class="metric-item"><strong>${clients.length}</strong><span>Clientes</span></div>
                <div class="metric-item"><strong>${App.fmt(totalAll)}</strong><span>Faturado Total</span></div>
              </div>
            </div>
          </div>

          <!-- Quotes pipeline -->
          <div class="stats-card">
            <div class="stats-card-header"><h3>Pipeline de Orçamentos</h3></div>
            ${quotes.length === 0
              ? '<p class="empty-hint" style="padding:20px">Sem orçamentos ainda.</p>'
              : `<div class="pipeline-list">
                  ${[
                    {label:'Aprovados', items: quotes.filter(q=>q.status==='aprovado'), color:'#16a34a'},
                    {label:'Enviados', items: quotes.filter(q=>q.status==='enviado'), color:'#eab308'},
                    {label:'Recusados', items: quotes.filter(q=>q.status==='recusado'), color:'#ef4444'},
                  ].map(g => `
                    <div class="pipeline-group">
                      <div class="pipeline-header">
                        <span class="pipeline-dot" style="background:${g.color}"></span>
                        <strong>${g.label}</strong>
                        <span class="pipeline-count">${g.items.length}</span>
                        <span class="pipeline-total">${App.fmt(g.items.reduce((s,q)=>s+Number(q.total||0),0))}</span>
                      </div>
                      ${g.items.slice(0,3).map(q=>`
                        <div class="pipeline-item" onclick="Pages.editQuote('${q.id}')">
                          <span>${q.title}</span>
                          <strong>${App.fmt(q.total)}</strong>
                        </div>`).join('')}
                    </div>`).join('')}
                </div>`}
          </div>
        </div>

        <!-- Invoice list with overdue highlight -->
        ${overdue.length > 0 ? `
          <div class="stats-card stats-alert-card">
            <div class="stats-card-header">
              <h3>⚠️ Faturas em Atraso</h3>
              <span class="stats-tag red">${overdue.length} vencida${overdue.length!==1?'s':''}</span>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>#</th><th>Cliente</th><th>Data</th><th>Total</th><th>Dias Atraso</th><th></th></tr></thead>
                <tbody>
                  ${overdue.map(inv => {
                    const due = new Date(inv.date); due.setDate(due.getDate()+30);
                    const days = Math.floor((new Date()-due)/(1000*60*60*24));
                    return `<tr>
                      <td><strong>#${inv.number}</strong></td>
                      <td>${inv.client||'—'}</td>
                      <td>${inv.date||'—'}</td>
                      <td><strong>${App.fmt(inv.total)}</strong></td>
                      <td><span class="badge-overdue">${days}d</span></td>
                      <td class="actions">
                        <button onclick="Pages.viewInvoice('${inv.id}')" title="Ver">👁️</button>
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>` : ''}

      </div>
    `);

    // Draw charts
    setTimeout(() => {
      // Bar chart — monthly revenue
      const canvas = document.getElementById('chart-monthly');
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const W = canvas.offsetWidth;
        const H = 200;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.height = H + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const PAD = {top:16, right:16, bottom:32, left:56};
        const cW = W - PAD.left - PAD.right;
        const cH = H - PAD.top - PAD.bottom;
        const maxV = Math.max(...monthlyData.map(m => m.paid + m.pending)) * 1.1 || 1;
        const barGroup = cW / monthlyData.length;
        const barW = barGroup * 0.35;

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i <= 4; i++) {
          const y = PAD.top + cH - (i/4)*cH;
          ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left+cW, y); ctx.stroke();
          ctx.fillStyle = 'rgba(134,239,172,0.5)';
          ctx.font = '10px Helvetica Neue'; ctx.textAlign = 'right';
          ctx.fillText('€'+(maxV/4*i).toFixed(0), PAD.left-6, y+4);
        }

        monthlyData.forEach((m, i) => {
          const x = PAD.left + i * barGroup + barGroup * 0.1;
          // Paid bar
          const paidH = (m.paid/maxV)*cH;
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.roundRect(x, PAD.top+cH-paidH, barW, paidH, [3,3,0,0]);
          ctx.fill();
          // Pending bar
          const pendH = (m.pending/maxV)*cH;
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.roundRect(x+barW+2, PAD.top+cH-pendH, barW, pendH, [3,3,0,0]);
          ctx.fill();
          // Label
          ctx.fillStyle = 'rgba(134,239,172,0.5)';
          ctx.font = '10px Helvetica Neue'; ctx.textAlign = 'center';
          ctx.fillText(m.label, x+barW, H-PAD.bottom+14);
        });
      }

      // Donut — invoice status
      const dc = document.getElementById('chart-donut');
      if (dc) {
        const dpr = window.devicePixelRatio || 1;
        dc.width = 160*dpr; dc.height = 160*dpr;
        dc.style.width = '160px'; dc.style.height = '160px';
        const ctx = dc.getContext('2d');
        ctx.scale(dpr, dpr);
        const segs = [
          {val:paid.length, color:'#16a34a'},
          {val:pending.length, color:'#eab308'},
          {val:overdue.length, color:'#ef4444'},
          {val:cancelled.length, color:'#374151'},
        ].filter(s => s.val > 0);
        const total = segs.reduce((s,x)=>s+x.val,0) || 1;
        let angle = -Math.PI/2;
        const cx=80, cy=80, r=70, inner=48;
        segs.forEach(s => {
          const sweep = (s.val/total)*Math.PI*2;
          ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,angle,angle+sweep); ctx.closePath();
          ctx.fillStyle = s.color; ctx.fill();
          angle += sweep;
        });
        ctx.beginPath(); ctx.arc(cx,cy,inner,0,Math.PI*2);
        ctx.fillStyle = '#0f170f'; ctx.fill();
      }
    }, 80);
  },

  // ── Settings ──
  settings() {
    const u = Auth.current;
    Pages.set(`
      <div class="page-content">
        <div class="settings-grid">
          <div class="settings-section">
            <h3>Perfil</h3>
            <div class="form-grid">
              <div class="form-group full"><label>Nome</label><input id="s-name" value="${u.name}"></div>
              <div class="form-group full"><label>Empresa</label><input id="s-company" value="${u.company||''}"></div>
              <div class="form-group full"><label>Email</label><input value="${u.email}" disabled></div>
            </div>
            <button class="btn-primary" onclick="Pages.saveSettings()">Guardar Alterações</button>
          </div>
          <div class="settings-section">
            <h3>Plano Atual</h3>
            <div class="plan-info">
              <div class="plan-name-badge ${u.plan}">${u.plan.toUpperCase()}</div>
              <p>${u.plan === 'free' ? '3 projetos · 5 faturas/mês · 3 clientes' : 'Tudo ilimitado'}</p>
              ${u.plan === 'free' ? '<a href="../index.html#precos" class="btn-primary" target="_blank">Upgrade para Pro →</a>' : '<p class="success-text">Tens o plano completo!</p>'}
            </div>
          </div>
        </div>
      </div>
    `);
  },

  saveSettings() {
    const user = Auth.current;
    user.name = document.getElementById('s-name').value.trim() || user.name;
    user.company = document.getElementById('s-company').value.trim();
    const users = DB.getUsers().map(u => u.id === user.id ? user : u);
    DB.saveUsers(users);
    DB.setSession(user);
    Auth.current = user;
    document.getElementById('user-name-header').textContent = user.name;
    document.getElementById('user-avatar').textContent = user.name[0].toUpperCase();
    App.toast('Perfil atualizado!', 'success');
  },
};

// ─── Calc helpers ─────────────────────────────────────────────────────────────
function calcInvoice() {
  const sub = Number(document.getElementById('i-subtotal')?.value || 0);
  const iva = Number(document.getElementById('i-iva')?.value || 0);
  const total = document.getElementById('i-total');
  if (total) total.value = (sub + sub * iva / 100).toFixed(2);
}
function calcQuote() {
  const labor = Number(document.getElementById('q-labor')?.value || 0);
  const mat = Number(document.getElementById('q-materials')?.value || 0);
  const total = document.getElementById('q-total');
  if (total) total.value = (labor + mat).toFixed(2);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => Auth.init());
