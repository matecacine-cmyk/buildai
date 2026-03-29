// ─── LocalStorage Database ────────────────────────────────────────────────────
const DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem('buildai_' + key) || 'null'); } catch { return null; }
  },
  set(key, val) {
    localStorage.setItem('buildai_' + key, JSON.stringify(val));
  },
  // Users
  getUsers() { return this.get('users') || []; },
  saveUsers(u) { this.set('users', u); },
  getUserById(id) { return this.getUsers().find(u => u.id === id) || null; },
  // Session
  getSession() { return this.get('session'); },
  setSession(user) { this.set('session', user); },
  clearSession() { localStorage.removeItem('buildai_session'); },
  // Projects
  getProjects(userId) { return (this.get('projects') || []).filter(p => p.userId === userId); },
  saveProject(p) {
    const all = this.get('projects') || [];
    const idx = all.findIndex(x => x.id === p.id);
    if (idx > -1) all[idx] = p; else all.push(p);
    this.set('projects', all);
  },
  deleteProject(id) { this.set('projects', (this.get('projects') || []).filter(p => p.id !== id)); },
  // Clients
  getClients(userId) { return (this.get('clients') || []).filter(c => c.userId === userId); },
  saveClient(c) {
    const all = this.get('clients') || [];
    const idx = all.findIndex(x => x.id === c.id);
    if (idx > -1) all[idx] = c; else all.push(c);
    this.set('clients', all);
  },
  deleteClient(id) { this.set('clients', (this.get('clients') || []).filter(c => c.id !== id)); },
  // Invoices
  getInvoices(userId) { return (this.get('invoices') || []).filter(i => i.userId === userId); },
  saveInvoice(inv) {
    const all = this.get('invoices') || [];
    const idx = all.findIndex(x => x.id === inv.id);
    if (idx > -1) all[idx] = inv; else all.push(inv);
    this.set('invoices', all);
  },
  deleteInvoice(id) { this.set('invoices', (this.get('invoices') || []).filter(i => i.id !== id)); },
  // Quotes
  getQuotes(userId) { return (this.get('quotes') || []).filter(q => q.userId === userId); },
  saveQuote(q) {
    const all = this.get('quotes') || [];
    const idx = all.findIndex(x => x.id === q.id);
    if (idx > -1) all[idx] = q; else all.push(q);
    this.set('quotes', all);
  },
  deleteQuote(id) { this.set('quotes', (this.get('quotes') || []).filter(q => q.id !== id)); },
  // ID generator
  newId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); },
};
