'use strict';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const STYLES = `
:root{
  --bg:#131313; --surface:#1c1c1c; --surface-2:#242424; --border:#2e2e2e;
  --text:#f2f0ec; --muted:#9a968f; --accent:#e8613c; --accent-soft:#e8613c22;
  --green:#4caf50; --radius:14px;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  line-height:1.5;-webkit-font-smoothing:antialiased}
a{color:inherit}
.container{max-width:1040px;margin:0 auto;padding:24px 20px 96px}
header.top{display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:20px;border-bottom:1px solid var(--border);position:sticky;top:0;
  background:rgba(19,19,19,.85);backdrop-filter:blur(8px);z-index:20}
.brand{font-weight:700;letter-spacing:.5px}
.brand small{display:block;font-weight:400;color:var(--muted);letter-spacing:0;font-size:12px;margin-top:2px}
.top-right{display:flex;align-items:center;gap:14px;font-size:14px}
.chip{background:var(--surface-2);border:1px solid var(--border);border-radius:999px;padding:6px 12px;font-size:13px}
.logout{color:var(--muted);text-decoration:none;font-size:13px}
.logout:hover{color:var(--text)}
h1{font-size:26px;margin:28px 0 4px}
h2{font-size:18px;margin:40px 0 14px;display:flex;align-items:center;gap:10px}
h2 .count{color:var(--muted);font-size:14px;font-weight:400}
.sub{color:var(--muted);margin-top:0}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px}
.progress-card{display:flex;align-items:center;gap:24px;margin-top:24px;flex-wrap:wrap}
.pct{font-size:44px;font-weight:700;line-height:1}
.progress-info{flex:1;min-width:200px}
.bar{height:12px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin-top:10px}
.bar > i{display:block;height:100%;background:var(--accent);border-radius:999px;transition:width .4s}
.kanban{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.col{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;min-height:80px}
.col h3{margin:4px 6px 12px;font-size:13px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted)}
.task{background:var(--surface-2);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px}
.task .t{font-size:14px;font-weight:600;margin-bottom:8px}
.task .meta{display:flex;flex-wrap:wrap;gap:8px;font-size:12px;color:var(--muted);margin-bottom:8px}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;border:1px solid var(--border)}
.badge.h{color:#ff8a80;border-color:#ff8a8044}
.badge.m{color:#ffd54f;border-color:#ffd54f44}
.badge.l{color:var(--muted)}
select,input,button{font-family:inherit}
select.status{width:100%;background:var(--bg);color:var(--text);border:1px solid var(--border);
  border-radius:8px;padding:7px;font-size:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
.module{display:flex;flex-direction:column;gap:8px}
.module .phase{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--accent)}
.module .tt{font-weight:600;font-size:15px}
.module .m{font-size:12px;color:var(--muted)}
.module a.btn{margin-top:auto}
.btn{display:inline-block;background:var(--accent);color:#fff;text-decoration:none;text-align:center;
  padding:9px 14px;border-radius:9px;font-size:13px;font-weight:600;border:none;cursor:pointer}
.btn.ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.livrable .st{font-size:12px;color:var(--muted);margin-top:4px}
.suivi-item{border-left:2px solid var(--accent);padding:4px 0 4px 16px;margin-bottom:18px}
.suivi-item .d{font-size:12px;color:var(--muted)}
.suivi-item .a{font-size:12px;color:var(--accent);margin-left:8px}
.empty{color:var(--muted);font-size:14px;padding:14px 0}
.wa{position:fixed;right:22px;bottom:22px;background:#25D366;color:#fff;border-radius:999px;
  padding:14px 18px;text-decoration:none;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.4);z-index:30;font-size:14px}
/* login */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.login-card{width:100%;max-width:380px;background:var(--surface);border:1px solid var(--border);
  border-radius:18px;padding:32px}
.login-card h1{font-size:22px;margin:0 0 6px}
.login-card p{color:var(--muted);font-size:14px;margin:0 0 22px}
.field{margin-bottom:14px}
.field label{display:block;font-size:13px;color:var(--muted);margin-bottom:6px}
.field input{width:100%;background:var(--bg);border:1px solid var(--border);color:var(--text);
  border-radius:10px;padding:12px;font-size:15px}
.field input:focus{outline:none;border-color:var(--accent)}
.login-card .btn{width:100%;padding:12px}
.error{background:var(--accent-soft);border:1px solid var(--accent);color:#ffb4a0;
  border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:16px}
.foot{color:var(--muted);font-size:12px;text-align:center;margin-top:18px}
@media(max-width:760px){.kanban{grid-template-columns:1fr}.container{padding-bottom:110px}}
`;

function layout(title, body, opts = {}) {
  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>${STYLES}</style></head><body>${body}
${opts.script || ''}</body></html>`;
}

function renderLogin({ error, email } = {}) {
  const body = `<div class="login-wrap"><div class="login-card">
  <div class="brand">YOUNÈS M'HAMED<small>Espace d'accompagnement · Personal Branding</small></div>
  <h1 style="margin-top:24px">Connexion</h1>
  <p>Connecte-toi avec ton email et le code d'accès reçu par WhatsApp.</p>
  ${error ? `<div class="error">${esc(error)}</div>` : ''}
  <form method="POST" action="/login">
    <div class="field"><label>Email</label>
      <input type="email" name="email" required autofocus value="${esc(email || '')}" placeholder="ton@email.com"></div>
    <div class="field"><label>Code d'accès</label>
      <input type="text" name="code" required placeholder="Ton code"></div>
    <button class="btn" type="submit">Accéder à mon espace</button>
  </form>
  <div class="foot">Un souci pour te connecter ? Contacte Younès.</div>
</div></div>`;
  return layout('Connexion · Espace Personal Branding', body);
}

const STATUS_LABELS = ['À faire', 'En cours', 'À valider', 'Validé'];

function taskCard(t, csrf) {
  const prioClass = t.priorite === 'Haute' ? 'h' : t.priorite === 'Moyenne' ? 'm' : 'l';
  const locked = t.statut === 'Validé';
  const options = STATUS_LABELS.map((s) => {
    const disabled = s === 'Validé' && t.statut !== 'Validé' ? 'disabled' : '';
    return `<option value="${esc(s)}" ${s === t.statut ? 'selected' : ''} ${disabled}>${esc(s)}</option>`;
  }).join('');
  return `<div class="task">
    <div class="t">${esc(t.titre)}</div>
    <div class="meta">
      ${t.echeance ? `<span>📅 ${esc(t.echeance)}</span>` : ''}
      ${t.priorite ? `<span class="badge ${prioClass}">${esc(t.priorite)}</span>` : ''}
    </div>
    ${locked
      ? '<div class="badge" style="color:#7cd992;border-color:#7cd99244">✓ Validé par Younès</div>'
      : `<form method="POST" action="/tache" class="statusForm">
           <input type="hidden" name="taskId" value="${esc(t.id)}">
           <input type="hidden" name="csrf" value="${esc(csrf)}">
           <select class="status" name="statut" onchange="this.form.submit()">${options}</select>
           <noscript><button class="btn ghost" style="margin-top:8px;width:100%" type="submit">Mettre à jour</button></noscript>
         </form>`}
  </div>`;
}

function renderDashboard({ client, modules, tasks, livrables, suivi, csrf }) {
  const cols = STATUS_LABELS.map((s) => {
    const items = tasks.filter((t) => t.statut === s);
    return `<div class="col"><h3>${esc(s)} · ${items.length}</h3>
      ${items.map((t) => taskCard(t, csrf)).join('') || '<div class="empty" style="padding:6px">—</div>'}
    </div>`;
  }).join('');

  const moduleCards = modules.map((m) => `<div class="card module">
    <span class="phase">${esc(m.phase)}${m.type ? ' · ' + esc(m.type) : ''}</span>
    <span class="tt">${esc(m.titre)}</span>
    <span class="m">${m.duree ? '⏱ ' + esc(m.duree) : ''}${m.deblocage ? ' · ' + esc(m.deblocage) : ''}</span>
    ${m.lien ? `<a class="btn" href="${esc(m.lien)}" target="_blank" rel="noopener">Ouvrir</a>`
      : '<span class="m">Contenu bientôt disponible</span>'}
  </div>`).join('');

  const livrableCards = livrables.length ? livrables.map((l) => `<div class="card livrable">
    <div class="tt" style="font-weight:600">${esc(l.titre)}</div>
    <div class="st">${esc(l.type)} · ${esc(l.statut)}</div>
    ${l.commentaire ? `<div class="st" style="margin-top:8px;color:var(--text)">💬 ${esc(l.commentaire)}</div>` : ''}
    ${l.fichiers && l.fichiers.length
      ? l.fichiers.map((f) => `<a class="btn ghost" style="margin-top:10px" href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name || 'Fichier')}</a>`).join('')
      : ''}
  </div>`).join('') : '<div class="empty">Aucun livrable pour le moment.</div>';

  const suiviItems = suivi.length ? suivi.map((s) => `<div class="suivi-item">
    <div class="d">${esc(s.date)} · ${esc(s.type)}<span class="a">${esc(s.auteur)}</span></div>
    <div class="tt" style="font-weight:600;margin:2px 0">${esc(s.titre)}</div>
    <div>${esc(s.contenu)}</div>
  </div>`).join('') : '<div class="empty">Aucune note de suivi pour le moment.</div>';

  const wa = client.whatsapp
    ? `<a class="wa" href="${esc(client.whatsapp)}" target="_blank" rel="noopener">💬 Écrire à Younès</a>`
    : '';

  const body = `
  <header class="top">
    <div class="brand">YOUNÈS M'HAMED<small>Espace d'accompagnement</small></div>
    <div class="top-right">
      <span class="chip">${esc(client.name)}</span>
      <a class="logout" href="/logout">Déconnexion</a>
    </div>
  </header>
  <div class="container">
    <h1>Bonjour ${esc(client.name.split(' ')[0])} 👋</h1>
    <p class="sub">Voici où tu en es dans ton accompagnement Personal Branding.</p>

    <div class="card progress-card">
      <div class="pct">${client.progression}%</div>
      <div class="progress-info">
        <strong>Ta progression</strong>
        <div class="bar"><i style="width:${client.progression}%"></i></div>
        <div class="sub" style="margin-top:8px;font-size:13px">${client.tasksDone} tâche(s) validée(s) sur ${client.tasksTotal} · Offre : ${esc(client.offre || '—')}</div>
      </div>
    </div>

    <h2>Mes tâches <span class="count">${tasks.length}</span></h2>
    <div class="kanban">${cols}</div>

    <h2>Mes modules <span class="count">${modules.length}</span></h2>
    <div class="grid">${moduleCards}</div>

    <h2>Mes livrables <span class="count">${livrables.length}</span></h2>
    <div class="grid">${livrableCards}</div>

    <h2>Mon suivi <span class="count">${suivi.length}</span></h2>
    <div>${suiviItems}</div>
  </div>
  ${wa}`;
  return layout(`Mon espace · ${client.name}`, body);
}

module.exports = { renderLogin, renderDashboard, layout, esc };
