'use strict';

const http = require('http');
const crypto = require('crypto');
const data = require('./notion');
const auth = require('./auth');
const views = require('./views');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const SECURE = process.env.NODE_ENV === 'production';

function csrfFor(cid) {
  return crypto.createHmac('sha256', SECRET).update('csrf:' + cid).digest('base64url');
}

function send(res, status, html, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
  res.end(html);
}
function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, ...headers });
  res.end();
}

function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => { b += c; if (b.length > 1e6) req.destroy(); });
    req.on('end', () => resolve(new URLSearchParams(b)));
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;
    const session = auth.getSession(req);

    if (path === '/health') return send(res, 200, 'ok');

    // ---- Login ----
    if (path === '/login' && req.method === 'GET') {
      if (session) return redirect(res, '/');
      return send(res, 200, views.renderLogin());
    }
    if (path === '/login' && req.method === 'POST') {
      const form = await readBody(req);
      const email = form.get('email');
      const code = form.get('code');
      let client = null;
      try { client = await data.authenticate(email, code); }
      catch (e) { console.error('auth error', e.message); }
      if (!client) {
        return send(res, 401, views.renderLogin({
          error: 'Email ou code incorrect. Vérifie tes identifiants.', email,
        }));
      }
      const token = auth.createSession(client);
      return redirect(res, '/', { 'Set-Cookie': auth.sessionCookie(token, SECURE) });
    }

    // ---- Logout ----
    if (path === '/logout') {
      return redirect(res, '/login', { 'Set-Cookie': auth.clearCookie() });
    }

    // ---- Everything below requires a session ----
    if (!session) return redirect(res, '/login');

    // ---- Update task status ----
    if (path === '/tache' && req.method === 'POST') {
      const form = await readBody(req);
      if (form.get('csrf') !== csrfFor(session.cid)) return send(res, 403, 'Requête invalide');
      const taskId = form.get('taskId');
      const statut = form.get('statut');
      // Sécurité : on vérifie que la tâche appartient bien au client connecté.
      const tasks = await data.getTasks(session.cid);
      if (tasks.some((t) => t.id === taskId) && statut !== 'Validé') {
        try { await data.updateTaskStatus(taskId, statut); }
        catch (e) { console.error('update error', e.message); }
      }
      return redirect(res, '/');
    }

    // ---- Dashboard ----
    if (path === '/' && req.method === 'GET') {
      const [client, modules, tasks, livrables, suivi] = await Promise.all([
        data.getClient(session.cid),
        data.getModules(),
        data.getTasks(session.cid),
        data.getLivrables(session.cid),
        data.getSuivi(session.cid),
      ]);
      if (!client) return redirect(res, '/logout');
      tasks.sort((a, b) => (a.echeance || '').localeCompare(b.echeance || ''));
      return send(res, 200, views.renderDashboard({
        client, modules, tasks, livrables, suivi, csrf: csrfFor(session.cid),
      }));
    }

    return send(res, 404, views.layout('Introuvable', '<div class="container"><h1>Page introuvable</h1><p><a href="/">Retour</a></p></div>'));
  } catch (err) {
    console.error(err);
    return send(res, 500, views.layout('Erreur', '<div class="container"><h1>Une erreur est survenue</h1></div>'));
  }
});

server.listen(PORT, () => {
  console.log(`Portail en ligne sur http://localhost:${PORT}  (mode ${data.MOCK ? 'DÉMO' : 'NOTION'})`);
});
