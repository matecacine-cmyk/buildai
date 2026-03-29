// ─── Auth ─────────────────────────────────────────────────────────────────────
const Auth = {
  current: null,

  init() {
    const session = DB.getSession();
    if (session) {
      this.current = session;
      this.showApp();
    } else {
      this.showAuth();
    }
    // Handle #register hash
    if (location.hash === '#register') showTab('register');
  },

  register() {
    const name = document.getElementById('reg-name').value.trim();
    const company = document.getElementById('reg-company').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const pass = document.getElementById('reg-pass').value;
    const err = document.getElementById('reg-error');

    if (!name || !email || !pass) { err.textContent = 'Preenche todos os campos obrigatórios.'; return; }
    if (pass.length < 6) { err.textContent = 'Palavra-passe mínimo 6 caracteres.'; return; }

    const users = DB.getUsers();
    if (users.find(u => u.email === email)) { err.textContent = 'Este email já está registado.'; return; }

    const user = { id: DB.newId(), name, company, email, pass, plan: 'free', createdAt: new Date().toISOString() };
    users.push(user);
    DB.saveUsers(users);
    DB.setSession(user);
    this.current = user;
    err.textContent = '';
    this.showApp();
    App.toast('Bem-vindo, ' + name + '!', 'success');
  },

  login() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pass = document.getElementById('login-pass').value;
    const err = document.getElementById('login-error');

    if (!email || !pass) { err.textContent = 'Preenche todos os campos.'; return; }

    const user = DB.getUsers().find(u => u.email === email && u.pass === pass);
    if (!user) { err.textContent = 'Email ou palavra-passe incorretos.'; return; }

    DB.setSession(user);
    this.current = user;
    err.textContent = '';
    this.showApp();
    App.toast('Bem-vindo, ' + user.name + '!', 'success');
  },

  logout() {
    DB.clearSession();
    this.current = null;
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
  },

  showApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    document.getElementById('user-name-header').textContent = this.current.name;
    document.getElementById('user-avatar').textContent = this.current.name[0].toUpperCase();
    document.getElementById('plan-badge').textContent = this.current.plan.toUpperCase();
    App.goto('dashboard');
  },

  showAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
  },
};

function showTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('tab-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('tab-register').classList.toggle('hidden', tab !== 'register');
}
