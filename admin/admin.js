// ─── Admin Auth ───────────────────────────────────────────────────────────────
// Muda esta password para a tua
const ADMIN_PASS = 'buildai@admin2025';

const AdminAuth = {
  login() {
    const pass = document.getElementById('admin-pass').value;
    const err = document.getElementById('admin-error');
    if (pass !== ADMIN_PASS) { err.textContent = 'Password incorreta.'; return; }
    sessionStorage.setItem('buildai_admin', '1');
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-app').classList.remove('hidden');
    Admin.goto('overview');
  },
  logout() {
    sessionStorage.removeItem('buildai_admin');
    document.getElementById('admin-app').classList.add('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
    document.getElementById('admin-pass').value = '';
  },
  check() {
    if (sessionStorage.getItem('buildai_admin')) {
      document.getElementById('admin-login').classList.add('hidden');
      document.getElementById('admin-app').classList.remove('hidden');
      Admin.goto('overview');
    }
  },
};

// ─── Admin App ────────────────────────────────────────────────────────────────
const Admin = {
  goto(page) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    const titles = { overview:'Visão Geral', users:'Utilizadores', projects:'Todos os Projetos', invoices:'Todas as Faturas', revenue:'Receita' };
    document.getElementById('admin-page-title').textContent = titles[page] || page;
    document.querySelector('.sidebar')?.classList.remove('open');
    const pages = { overview: Admin.overview, users: Admin.users, projects: Admin.projects, invoices: Admin.invoices, revenue: Admin.revenue };
    if (pages[page]) pages[page]();
  },

  set(html) { document.getElementById('admin-main').innerHTML = html; },

  fmt(val) { return '€' + Number(val || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },

  toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    document.getElementById('toast-container').appendChild(t);
    setTimeout(() => t.remove(), 3000);
  },

  // ── Overview ──
  overview() {
    const users = DB.getUsers();
    const allProjects = DB.get('projects') || [];
    const allInvoices = DB.get('invoices') || [];
    const allClients = DB.get('clients') || [];

    const totalRevenue = allInvoices.filter(i => i.status === 'pago').reduce((s, i) => s + Number(i.total || 0), 0);
    const pendingRevenue = allInvoices.filter(i => i.status === 'pendente').reduce((s, i) => s + Number(i.total || 0), 0);
    const proUsers = users.filter(u => u.plan !== 'free').length;
    const mrr = proUsers * 9.99;

    Admin.set(`
      <div class="page-content">
        <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div><div class="stat-val">${users.length}</div><div class="stat-label">Total Utilizadores</div></div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">💶</div>
            <div><div class="stat-val">${Admin.fmt(totalRevenue)}</div><div class="stat-label">Total Faturado</div></div>
          </div>
          <div class="stat-card yellow">
            <div class="stat-icon">⏳</div>
            <div><div class="stat-val">${Admin.fmt(pendingRevenue)}</div><div class="stat-label">Pendente</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div><div class="stat-val">${allProjects.length}</div><div class="stat-label">Total Projetos</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🧾</div>
            <div><div class="stat-val">${allInvoices.length}</div><div class="stat-label">Total Faturas</div></div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">🚀</div>
            <div><div class="stat-val">${Admin.fmt(mrr)}</div><div class="stat-label">MRR Estimado</div></div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="dash-section">
            <div class="section-row"><h3>Utilizadores Recentes</h3><button class="btn-sm" onclick="Admin.goto('users')">Ver todos</button></div>
            ${users.slice(-5).reverse().map(u => `
              <div class="list-item">
                <div>
                  <strong>${u.name}</strong>
                  <span class="meta">${u.email}</span>
                </div>
                <span class="status-badge ${u.plan === 'free' ? 'pendente' : 'ativo'}">${u.plan.toUpperCase()}</span>
              </div>
            `).join('') || '<p class="empty-hint">Sem utilizadores.</p>'}
          </div>
          <div class="dash-section">
            <div class="section-row"><h3>Distribuição de Planos</h3></div>
            <div class="plan-dist">
              ${['free','pro','business'].map(plan => {
                const count = users.filter(u => u.plan === plan).length;
                const pct = users.length ? Math.round(count / users.length * 100) : 0;
                return `
                  <div class="plan-dist-item">
                    <div class="plan-dist-label"><span>${plan.toUpperCase()}</span><span>${count} utilizadores</span></div>
                    <div class="plan-dist-bar"><div style="width:${pct}%"></div></div>
                    <span class="plan-dist-pct">${pct}%</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `);
  },

  // ── Users ──
  users() {
    const users = DB.getUsers();
    Admin.set(`
      <div class="page-content">
        <div class="page-toolbar">
          <h2>Utilizadores <span class="count">${users.length}</span></h2>
        </div>
        ${users.length === 0
          ? '<div class="empty-state"><div class="empty-icon">👥</div><p>Sem utilizadores registados.</p></div>'
          : `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>Nome</th><th>Email</th><th>Empresa</th><th>Plano</th><th>Registado</th><th>Ações</th></tr></thead>
              <tbody>${users.map(u => `
                <tr>
                  <td><strong>${u.name}</strong></td>
                  <td>${u.email}</td>
                  <td>${u.company || '—'}</td>
                  <td>
                    <select class="status-select" onchange="Admin.changePlan('${u.id}',this.value)">
                      <option value="free" ${u.plan==='free'?'selected':''}>Free</option>
                      <option value="pro" ${u.plan==='pro'?'selected':''}>Pro</option>
                      <option value="business" ${u.plan==='business'?'selected':''}>Business</option>
                    </select>
                  </td>
                  <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-PT') : '—'}</td>
                  <td class="actions">
                    <button onclick="Admin.viewUser('${u.id}')" title="Ver detalhes">👁️</button>
                    <button onclick="Admin.deleteUser('${u.id}')" title="Apagar" style="color:#f87171">🗑️</button>
                  </td>
                </tr>
              `).join('')}</tbody>
            </table></div>`
        }
      </div>
    `);
  },

  changePlan(userId, plan) {
    const users = DB.getUsers();
    const u = users.find(x => x.id === userId);
    if (!u) return;
    u.plan = plan;
    DB.saveUsers(users);
    Admin.toast(`Plano de ${u.name} alterado para ${plan.toUpperCase()}`, 'success');
  },

  viewUser(userId) {
    const u = DB.getUserById(userId);
    if (!u) return;
    const projects = DB.getProjects(userId);
    const invoices = DB.getInvoices(userId);
    const clients = DB.getClients(userId);
    const totalFat = invoices.filter(i => i.status === 'pago').reduce((s, i) => s + Number(i.total || 0), 0);
    openModal(`Utilizador: ${u.name}`, `
      <div class="user-detail">
        <div class="user-detail-header">
          <div class="client-avatar" style="width:56px;height:56px;font-size:1.4rem">${u.name[0].toUpperCase()}</div>
          <div>
            <h3>${u.name}</h3>
            <p>${u.email}</p>
            ${u.company ? `<p>${u.company}</p>` : ''}
          </div>
        </div>
        <div class="user-stats">
          <div class="user-stat"><strong>${projects.length}</strong><span>Projetos</span></div>
          <div class="user-stat"><strong>${invoices.length}</strong><span>Faturas</span></div>
          <div class="user-stat"><strong>${clients.length}</strong><span>Clientes</span></div>
          <div class="user-stat"><strong>${Admin.fmt(totalFat)}</strong><span>Faturado</span></div>
        </div>
        <div class="user-detail-row"><strong>Plano:</strong> <span class="status-badge ${u.plan === 'free' ? 'pendente' : 'ativo'}">${u.plan.toUpperCase()}</span></div>
        <div class="user-detail-row"><strong>Registado:</strong> ${u.createdAt ? new Date(u.createdAt).toLocaleString('pt-PT') : '—'}</div>
      </div>
      <div class="modal-footer">
        <button class="btn-ghost" onclick="closeModal()">Fechar</button>
      </div>
    `);
  },

  deleteUser(userId) {
    const u = DB.getUserById(userId);
    if (!u) return;
    if (!confirm(`Apagar utilizador ${u.name}? Esta ação é irreversível.`)) return;
    const users = DB.getUsers().filter(x => x.id !== userId);
    DB.saveUsers(users);
    Admin.toast('Utilizador apagado.', '');
    Admin.users();
  },

  // ── Projects ──
  projects() {
    const allProjects = DB.get('projects') || [];
    const users = DB.getUsers();
    Admin.set(`
      <div class="page-content">
        <div class="page-toolbar">
          <h2>Todos os Projetos <span class="count">${allProjects.length}</span></h2>
        </div>
        ${allProjects.length === 0
          ? '<div class="empty-state"><div class="empty-icon">📋</div><p>Sem projetos.</p></div>'
          : `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>Nome</th><th>Utilizador</th><th>Cliente</th><th>Valor</th><th>Estado</th><th>Data</th></tr></thead>
              <tbody>${allProjects.reverse().map(p => {
                const user = users.find(u => u.id === p.userId);
                return `<tr>
                  <td><strong>${p.name}</strong></td>
                  <td>${user ? user.name : '—'}</td>
                  <td>${p.client || '—'}</td>
                  <td>${Admin.fmt(p.value)}</td>
                  <td><span class="status-badge ${p.status}">${p.status}</span></td>
                  <td>${p.date || '—'}</td>
                </tr>`;
              }).join('')}</tbody>
            </table></div>`
        }
      </div>
    `);
  },

  // ── Invoices ──
  invoices() {
    const allInvoices = DB.get('invoices') || [];
    const users = DB.getUsers();
    const total = allInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
    Admin.set(`
      <div class="page-content">
        <div class="page-toolbar">
          <h2>Todas as Faturas <span class="count">${allInvoices.length}</span></h2>
        </div>
        <div class="invoice-summary">
          <div class="inv-sum-item"><strong>${Admin.fmt(allInvoices.filter(i=>i.status==='pago').reduce((s,i)=>s+Number(i.total||0),0))}</strong><span>Pago</span></div>
          <div class="inv-sum-item yellow"><strong>${Admin.fmt(allInvoices.filter(i=>i.status==='pendente').reduce((s,i)=>s+Number(i.total||0),0))}</strong><span>Pendente</span></div>
          <div class="inv-sum-item"><strong>${Admin.fmt(total)}</strong><span>Total</span></div>
        </div>
        ${allInvoices.length === 0
          ? '<div class="empty-state"><div class="empty-icon">🧾</div><p>Sem faturas.</p></div>'
          : `<div class="table-wrap"><table class="data-table">
              <thead><tr><th>#</th><th>Utilizador</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Data</th></tr></thead>
              <tbody>${allInvoices.reverse().map(i => {
                const user = users.find(u => u.id === i.userId);
                return `<tr>
                  <td><strong>#${i.number}</strong></td>
                  <td>${user ? user.name : '—'}</td>
                  <td>${i.client || '—'}</td>
                  <td><strong>${Admin.fmt(i.total)}</strong></td>
                  <td><span class="status-badge ${i.status}">${i.status}</span></td>
                  <td>${i.date || '—'}</td>
                </tr>`;
              }).join('')}</tbody>
            </table></div>`
        }
      </div>
    `);
  },

  // ── Revenue ──
  revenue() {
    const users = DB.getUsers();
    const allInvoices = DB.get('invoices') || [];
    const paid = allInvoices.filter(i => i.status === 'pago');
    const pending = allInvoices.filter(i => i.status === 'pendente');
    const proUsers = users.filter(u => u.plan === 'pro').length;
    const bizUsers = users.filter(u => u.plan === 'business').length;
    const mrr = (proUsers * 9.99) + (bizUsers * 24.99);

    // Group by month
    const byMonth = {};
    paid.forEach(i => {
      const month = (i.date || '').substring(0, 7);
      if (month) byMonth[month] = (byMonth[month] || 0) + Number(i.total || 0);
    });
    const months = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
    const maxVal = Math.max(...months.map(m => m[1]), 1);

    Admin.set(`
      <div class="page-content">
        <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
          <div class="stat-card green">
            <div class="stat-icon">💶</div>
            <div><div class="stat-val">${Admin.fmt(paid.reduce((s,i)=>s+Number(i.total||0),0))}</div><div class="stat-label">Total Recebido</div></div>
          </div>
          <div class="stat-card yellow">
            <div class="stat-icon">⏳</div>
            <div><div class="stat-val">${Admin.fmt(pending.reduce((s,i)=>s+Number(i.total||0),0))}</div><div class="stat-label">A Receber</div></div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">📈</div>
            <div><div class="stat-val">${Admin.fmt(mrr)}</div><div class="stat-label">MRR Subscriptions</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🚀</div>
            <div><div class="stat-val">${proUsers + bizUsers}</div><div class="stat-label">Subscritores Pagos</div></div>
          </div>
        </div>

        <div class="dash-section" style="margin-top:20px">
          <h3 style="margin-bottom:20px">Faturação por Mês</h3>
          ${months.length === 0
            ? '<p class="empty-hint">Sem dados de faturação ainda.</p>'
            : `<div class="bar-chart">
                ${months.map(([month, val]) => `
                  <div class="bar-item">
                    <div class="bar-fill" style="height:${Math.round(val/maxVal*100)}%"></div>
                    <div class="bar-val">${Admin.fmt(val)}</div>
                    <div class="bar-label">${month}</div>
                  </div>
                `).join('')}
              </div>`
          }
        </div>

        <div class="dash-section" style="margin-top:20px">
          <h3 style="margin-bottom:16px">Top Utilizadores por Faturação</h3>
          ${(() => {
            const byUser = {};
            paid.forEach(i => { byUser[i.userId] = (byUser[i.userId] || 0) + Number(i.total || 0); });
            return Object.entries(byUser).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([uid, total]) => {
              const u = users.find(x => x.id === uid);
              return `<div class="list-item">
                <div><strong>${u ? u.name : 'Desconhecido'}</strong><span class="meta">${u ? u.email : ''}</span></div>
                <strong style="color:var(--text3)">${Admin.fmt(total)}</strong>
              </div>`;
            }).join('') || '<p class="empty-hint">Sem dados.</p>';
          })()}
        </div>
      </div>
    `);
  },
};

// Modal helpers
function openModal(title, html) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => AdminAuth.check());
