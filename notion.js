'use strict';

/*
 * Couche de données du portail.
 * - Si NOTION_TOKEN est défini : lit/écrit dans le vrai Notion via l'API officielle.
 * - Sinon : bascule en MODE DÉMO (données en mémoire) pour tester en local.
 */

const NOTION_TOKEN = process.env.NOTION_TOKEN || '';
const NOTION_VERSION = '2022-06-28';

// Identifiants des bases (databases) Notion créées pour le portail.
const DB = {
  clients: process.env.DB_CLIENTS || '7cb3384bcfea41cabdc8ce4e1de78149',
  modules: process.env.DB_MODULES || '85d8efbef8884f64848d97e2b69d10a7',
  taches: process.env.DB_TACHES || '7d81cec04fce4d24be8646ac80c2e0b1',
  livrables: process.env.DB_LIVRABLES || 'bc00afc419fb4ce5a26affc81ed7d173',
  suivi: process.env.DB_SUIVI || 'cf608a0e8a714339a975f49c3d26d4d4',
};

const MOCK = !NOTION_TOKEN;

/* ------------------------------------------------------------------ */
/* Appels API Notion                                                   */
/* ------------------------------------------------------------------ */

async function notionFetch(path, options = {}) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API ${res.status}: ${body}`);
  }
  return res.json();
}

async function queryDatabase(databaseId, body = {}) {
  const results = [];
  let cursor;
  do {
    const data = await notionFetch(`databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({ ...body, start_cursor: cursor }),
    });
    results.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return results;
}

/* ------------------------------------------------------------------ */
/* Lecture des valeurs de propriétés Notion                            */
/* ------------------------------------------------------------------ */

function readProp(page, name) {
  const p = page.properties?.[name];
  if (!p) return null;
  switch (p.type) {
    case 'title': return p.title.map((t) => t.plain_text).join('');
    case 'rich_text': return p.rich_text.map((t) => t.plain_text).join('');
    case 'email': return p.email || '';
    case 'url': return p.url || '';
    case 'phone_number': return p.phone_number || '';
    case 'number': return p.number;
    case 'select': return p.select?.name || '';
    case 'status': return p.status?.name || '';
    case 'multi_select': return p.multi_select.map((s) => s.name);
    case 'date': return p.date?.start || '';
    case 'checkbox': return p.checkbox;
    case 'relation': return p.relation.map((r) => r.id);
    case 'files': return p.files.map((f) => ({ name: f.name, url: f.external?.url || f.file?.url || '' }));
    case 'formula':
      return p.formula.type === 'number' ? p.formula.number
        : p.formula.type === 'string' ? p.formula.string
        : p.formula.type === 'boolean' ? p.formula.boolean
        : '';
    case 'rollup':
      return p.rollup.type === 'number' ? p.rollup.number : '';
    default: return '';
  }
}

/* ------------------------------------------------------------------ */
/* Mapping des pages -> objets métier                                  */
/* ------------------------------------------------------------------ */

function mapClient(page) {
  return {
    id: page.id,
    name: readProp(page, 'Nom') || 'Client',
    email: (readProp(page, 'Email de login') || '').toLowerCase().trim(),
    code: (readProp(page, "Code d'accès") || '').trim(),
    offre: readProp(page, 'Offre') || '',
    statut: readProp(page, 'Statut') || '',
    whatsapp: readProp(page, 'Lien WhatsApp') || '',
    progression: Number(readProp(page, 'Progression %')) || 0,
    tasksTotal: Number(readProp(page, 'Tâches totales')) || 0,
    tasksDone: Number(readProp(page, 'Tâches validées')) || 0,
  };
}

function mapModule(page) {
  return {
    id: page.id,
    titre: readProp(page, 'Titre'),
    ordre: readProp(page, 'Ordre') ?? 999,
    phase: readProp(page, 'Phase') || '',
    type: readProp(page, 'Type') || '',
    deblocage: readProp(page, 'Déblocage') || '',
    duree: readProp(page, 'Durée estimée') || '',
    lien: readProp(page, 'Lien contenu / replay') || '',
  };
}

function mapTask(page) {
  return {
    id: page.id,
    titre: readProp(page, 'Tâche'),
    statut: readProp(page, 'Statut') || 'À faire',
    echeance: readProp(page, 'Échéance') || '',
    priorite: readProp(page, 'Priorité') || '',
    moduleIds: readProp(page, 'Module') || [],
    instructions: readProp(page, 'Instructions') || '',
  };
}

function mapLivrable(page) {
  return {
    id: page.id,
    titre: readProp(page, 'Livrable'),
    type: readProp(page, 'Type') || '',
    statut: readProp(page, 'Statut') || '',
    fichiers: readProp(page, 'Fichiers') || [],
    commentaire: readProp(page, 'Commentaire Younès') || '',
  };
}

function mapSuivi(page) {
  return {
    id: page.id,
    titre: readProp(page, 'Entrée'),
    date: readProp(page, 'Date') || '',
    type: readProp(page, 'Type') || '',
    auteur: readProp(page, 'Auteur') || '',
    contenu: readProp(page, 'Contenu') || '',
  };
}

/* ------------------------------------------------------------------ */
/* API publique de la couche de données                                */
/* ------------------------------------------------------------------ */

const TASK_STATUSES = ['À faire', 'En cours', 'À valider', 'Validé'];

async function authenticate(email, code) {
  email = (email || '').toLowerCase().trim();
  code = (code || '').trim();
  if (MOCK) return mockAuthenticate(email, code);

  const pages = await queryDatabase(DB.clients, {
    filter: { property: 'Email de login', email: { equals: email } },
  });
  if (!pages.length) return null;
  const client = mapClient(pages[0]);
  if (!client.code || client.code !== code) return null;
  return client;
}

async function getClient(clientId) {
  if (MOCK) return mockGetClient(clientId);
  const page = await notionFetch(`pages/${clientId}`);
  return mapClient(page);
}

async function getModules() {
  if (MOCK) return mockData.modules.slice().sort((a, b) => a.ordre - b.ordre);
  const pages = await queryDatabase(DB.modules, {
    sorts: [{ property: 'Ordre', direction: 'ascending' }],
  });
  return pages.map(mapModule);
}

async function getTasks(clientId) {
  if (MOCK) return mockData.tasks.filter((t) => t.clientId === clientId);
  const pages = await queryDatabase(DB.taches, {
    filter: { property: 'Client', relation: { contains: clientId } },
  });
  return pages.map(mapTask);
}

async function getLivrables(clientId) {
  if (MOCK) return mockData.livrables.filter((l) => l.clientId === clientId);
  const pages = await queryDatabase(DB.livrables, {
    filter: { property: 'Client', relation: { contains: clientId } },
  });
  return pages.map(mapLivrable);
}

async function getSuivi(clientId) {
  if (MOCK) {
    return mockData.suivi
      .filter((s) => s.clientId === clientId)
      .sort((a, b) => (b.date > a.date ? 1 : -1));
  }
  const pages = await queryDatabase(DB.suivi, {
    filter: { property: 'Client', relation: { contains: clientId } },
    sorts: [{ property: 'Date', direction: 'descending' }],
  });
  return pages.map(mapSuivi);
}

async function updateTaskStatus(taskId, status) {
  if (!TASK_STATUSES.includes(status)) throw new Error('Statut invalide');
  if (MOCK) {
    const t = mockData.tasks.find((x) => x.id === taskId);
    if (t) t.statut = status;
    return true;
  }
  await notionFetch(`pages/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties: { Statut: { select: { name: status } } } }),
  });
  return true;
}

/* ------------------------------------------------------------------ */
/* Données de DÉMO (mode local, sans jeton Notion)                     */
/* ------------------------------------------------------------------ */

const DEMO_CLIENT_ID = 'demo-client';

const mockData = {
  clients: [
    {
      id: DEMO_CLIENT_ID,
      name: 'Client Démo',
      email: 'demo@exemple.com',
      code: 'DEMO2026',
      offre: 'Accompagnement complet',
      statut: 'En cours',
      whatsapp: 'https://wa.me/33600000000',
    },
  ],
  modules: [
    { id: 'm1', titre: 'Bienvenue & tes objectifs', ordre: 1, phase: 'Fondations', type: 'Module', deblocage: 'Immédiat', duree: '15 min', lien: '' },
    { id: 'm2', titre: 'Live 1 — Introduction au Personal Branding & valeurs', ordre: 2, phase: 'Fondations', type: 'Live', deblocage: 'Immédiat', duree: '1 h', lien: '' },
    { id: 'm3', titre: 'Semaine 1 — Poser les bases de ton image de marque', ordre: 3, phase: 'Fondations', type: 'Module', deblocage: 'Immédiat', duree: '2 h', lien: '' },
    { id: 'm4', titre: 'Exercice — Cartographie de tes valeurs', ordre: 4, phase: 'Fondations', type: 'Exercice', deblocage: 'Après validation précédente', duree: '45 min', lien: '' },
    { id: 'm5', titre: 'Module — Positionnement & image de marque', ordre: 5, phase: 'Identité', type: 'Module', deblocage: 'Après validation précédente', duree: '2 h', lien: '' },
    { id: 'm6', titre: 'Module — Ligne éditoriale & piliers de contenu', ordre: 7, phase: 'Contenu', type: 'Module', deblocage: 'Après validation précédente', duree: '2 h', lien: '' },
  ],
  tasks: [
    { id: 't1', clientId: DEMO_CLIENT_ID, titre: 'Compléter tes objectifs personnels', statut: 'Validé', echeance: '2026-07-03', priorite: 'Haute', moduleIds: ['m1'], instructions: '' },
    { id: 't2', clientId: DEMO_CLIENT_ID, titre: 'Regarder le Live 1 et noter tes valeurs', statut: 'Validé', echeance: '2026-07-05', priorite: 'Moyenne', moduleIds: ['m2'], instructions: '' },
    { id: 't3', clientId: DEMO_CLIENT_ID, titre: 'Semaine 1 : lire le module et compléter les bases', statut: 'À valider', echeance: '2026-07-08', priorite: 'Moyenne', moduleIds: ['m3'], instructions: '' },
    { id: 't4', clientId: DEMO_CLIENT_ID, titre: "Réaliser l'exercice de cartographie des valeurs", statut: 'En cours', echeance: '2026-07-10', priorite: 'Haute', moduleIds: ['m4'], instructions: '' },
    { id: 't5', clientId: DEMO_CLIENT_ID, titre: 'Rédiger la première version de ton positionnement', statut: 'À faire', echeance: '2026-07-17', priorite: 'Moyenne', moduleIds: ['m5'], instructions: '' },
  ],
  livrables: [
    { id: 'l1', clientId: DEMO_CLIENT_ID, titre: 'Dossier de marque — v1', type: 'Dossier de marque', statut: 'À produire', fichiers: [], commentaire: "À remplir après l'exercice de positionnement." },
  ],
  suivi: [
    { id: 's1', clientId: DEMO_CLIENT_ID, titre: 'Séance de lancement', date: '2026-07-02', type: 'Note de séance', auteur: 'Younès', contenu: 'Premier échange de cadrage : objectifs, cible et rythme de travail définis.' },
  ],
};

function computeProgression(clientId) {
  const tasks = mockData.tasks.filter((t) => t.clientId === clientId);
  const done = tasks.filter((t) => t.statut === 'Validé').length;
  return {
    total: tasks.length,
    done,
    pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}

function mockAuthenticate(email, code) {
  const c = mockData.clients.find((x) => x.email === email);
  if (!c || c.code !== code) return null;
  return mockGetClient(c.id);
}

function mockGetClient(clientId) {
  const c = mockData.clients.find((x) => x.id === clientId);
  if (!c) return null;
  const prog = computeProgression(clientId);
  return { ...c, progression: prog.pct, tasksTotal: prog.total, tasksDone: prog.done };
}

module.exports = {
  MOCK,
  TASK_STATUSES,
  authenticate,
  getClient,
  getModules,
  getTasks,
  getLivrables,
  getSuivi,
  updateTaskStatus,
};
