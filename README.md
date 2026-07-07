# Portail client — Personal Branding · Younès M'hamed

Une application web sur-mesure : chaque client se connecte à son espace privé et retrouve ses **modules**, ses **tâches** (avec statuts), ses **livrables**, son **suivi**, sa **progression**, et un **bouton WhatsApp** direct vers toi. Les données viennent en direct de tes 5 bases Notion — rien n'est dupliqué.

Aucune dépendance externe : c'est du Node.js pur. Léger, rapide, hébergeable gratuitement.

---

## Comment ça marche

- **Ton Notion = la base de données.** Tu gères tes clients, tâches, modules, etc. dans Notion comme d'habitude. Le portail ne fait que les afficher joliment à chaque client.
- **Connexion par email + code d'accès.** Chaque client a un *Email de login* et un *Code d'accès* (champ dans la base Clients). Tu lui transmets son code par WhatsApp. Pas de mot de passe à gérer.
- **Cloisonnement automatique.** Un client ne voit QUE les lignes reliées à sa fiche (ses tâches, ses livrables, son suivi).

### Mode démo (pour visualiser tout de suite)

Sans configuration, l'appli démarre avec des données d'exemple. Ouvre les fichiers `preview-login.html` et `preview-dashboard.html` dans ton navigateur pour voir le rendu, ou lance-la :

```bash
cd portail
npm start
# puis ouvre http://localhost:3000
# connexion démo : demo@exemple.com / DEMO2026
```

---

## Mise en ligne (3 étapes)

### 1. Créer le jeton Notion

1. Va sur https://www.notion.so/my-integrations → **New integration** → nomme-la « Portail ».
2. Copie le **Internal Integration Secret** (commence par `ntn_`).
3. Ouvre ta page **🚀 PLATEFORME ACCOMPAGNEMENT** dans Notion → menu `•••` → **Connections** → ajoute ton intégration « Portail ». (Cela donne accès aux 5 bases en dessous.)

### 2. Héberger gratuitement (Render.com)

1. Crée un compte sur https://render.com.
2. Mets ce dossier `portail/` sur un dépôt GitHub (ou utilise « Deploy from public Git »).
3. Sur Render : **New → Web Service** → sélectionne le dépôt.
   - Runtime : **Node**
   - Start command : `node server.js`
   - Plan : **Free**
4. Dans **Environment**, ajoute les variables :
   - `NOTION_TOKEN` = ton secret `ntn_...`
   - `SESSION_SECRET` = une longue chaîne aléatoire
   - `NODE_ENV` = `production`
5. Déploie. Render te donne une URL du type `https://portail-xxx.onrender.com`. Teste la connexion avec `demo@exemple.com` / `DEMO2026`.

> Le fichier `render.yaml` fourni automatise cette config si tu utilises l'option « Blueprint » de Render.

### 3. Brancher ton sous-domaine

1. Sur Render : **Settings → Custom Domains → Add** → `espace.younes-mhamed.fr`.
2. Render affiche un enregistrement **CNAME** à créer chez ton gestionnaire de domaine.
3. Ajoute ce CNAME `espace` là où est géré `younes-mhamed.fr`. Ton site vitrine (Framer) n'est pas touché.
4. Une fois le certificat HTTPS actif, le portail vit sur `https://espace.younes-mhamed.fr`.

Il ne reste qu'à ajouter un bouton « Espace client » dans ton menu Framer pointant vers cette adresse.

---

## Gérer tes clients au quotidien (dans Notion)

Pour ajouter un vrai client :

1. Base **Clients** → nouvelle ligne : *Nom*, *Email de login*, *Code d'accès* (invente-le), *Lien WhatsApp* (`https://wa.me/33XXXXXXXXX`), *Offre*, *Date de début*.
2. Base **Tâches** → crée ses tâches en les reliant à sa fiche Client + au Module concerné.
3. Transmets-lui par WhatsApp : l'adresse du portail, son email, son code.

La progression se calcule toute seule : dès que tu passes une tâche en **Validé**, le pourcentage du client monte.

---

## Sécurité

- Sessions signées (HMAC), cookie `HttpOnly` + `Secure` en production.
- Protection CSRF sur la mise à jour des tâches.
- Un client ne peut modifier que ses propres tâches, et ne peut pas s'auto-attribuer le statut « Validé » (réservé à toi dans Notion).

---

## Structure du projet

```
portail/
├── server.js          Serveur HTTP + routes
├── lib/
│   ├── notion.js      Connexion Notion (+ mode démo)
│   ├── auth.js        Sessions / cookies signés
│   └── views.js       Pages HTML + styles
├── package.json
├── render.yaml        Config de déploiement Render
├── .env.example       Variables d'environnement à remplir
└── preview-*.html     Aperçus visuels statiques
```

Besoin d'une évolution (dépôt de fichiers par le client, déblocage progressif, notifications) ? C'est prévu pour, il suffit de le demander.
