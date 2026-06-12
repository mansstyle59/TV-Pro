# 📺 Flux TV Pro

> **L'expérience TV premium réinventée.**  
> Une plateforme IPTV moderne, fluide et performante développée avec React et TypeScript. Elle offre un guide des programmes (EPG) dynamique, des outils d'administration complets, des intégrations multi-formats, le support expérimental MHub et de superbes transitions fluides pour toutes les tailles d'écrans.

---

## ✨ Fonctionnalités Majeures

- **📺 Lecteur HLS Premium** : Prise en charge intégrale des flux en streaming en direct avec indicateurs de bande passante, statistiques en temps réel et lecteur résilient via Hls.js.
- **📅 Guide des Programmes (EPG)** : Timeline interactive en temps réel affichant les grilles de diffusion, avec barres de progression dynamiques.
- **⚙️ Administration Avancée** : Réorganisation Logical Channel Numbers (LCN), import de listes de chaînes, ajout/édition/suppression personnalisée, fonctions de backup/restauration.
- **🔌 Intégrations API & Réseaux** : Export immédiat sous forme de lien playlist M3U/M3U8 et simulation intégrale d'un serveur IPTV Xtream Codes (API) pour une compatibilité absolue avec des applications tierces (Tivimate, Smarters, Perfect Player).
- **📦 Support MHub Expérimental** : Pré-implémentation du protocole `mhub://` et de la compatibilité des bundles (Huhu.to, Watched, Rokkr, Vypn, Lokke) avec détection et intégration automatique.
- **📱 PWA & D-Pad TV-Ready** : Design entièrement adaptatif, parfait sur mobile tactile, navigateur de bureau ou TV avec support de la touche multidirectionnelle (clavier/télécommande).
- **🔒 Sécurité** : Portail verrouillable via un code d'accès Gatekeeper sécurisé.

---

## 🔗 Liens et Accès

- **Application Web (Production)** : `https://<VOTRE_NOM_D_UTILISATEUR>.github.io/<VOTRE_NOM_DE_DEPOT>/` (une fois déployée sur GitHub Pages)
- **Dépôt du Code Source** : `https://github.com/<VOTRE_NOM_D_UTILISATEUR>/<VOTRE_NOM_DE_DEPOT>`
- **Lien Playlist M3U** : Accessible via l'interface TV via le bouton "Playlist M3U" après génération locale.

---

## 🚀 Déploiement Automatisé sur GitHub Pages

L'application est configurée pour fonctionner de manière native, rapide et **directement sur GitHub Pages (sans l'erreur classique d'écran blanc ou routing 404)**.

### Vos optimisations "Prêtes à l'emploi" :
1. **Routing Relatif** : Vite calibré avec `base: './'` (`vite.config.ts`).
2. **Anti-Echec Routage SPA** : Déploiement générant un clone intelligent `.nojekyll` et un fichier de catch-all `404.html`.
3. **PWA Offline** : Capacités d'installation progressive (Standalone).

### Comment déployer en 3 minutes :

1. Initialisez et envoyez votre code sur **GitHub** :
   ```bash
   git init
   git add .
   git commit -m "feat: initialisation du portail TV"
   git branch -M main
   # Remplacez <NOM_UTILISATEUR>/<NOM_DEPOT> par vos infos :
   git remote add origin https://github.com/NOM_UTILISATEUR/NOM_DEPOT.git
   git push -u origin main
   ```

2. Dans l'interface Web GitHub, allez dans les **Settings** (Paramètres) du projet.
3. Allez dans **Pages** (dans le menu gauche) :
   - Sous **Build and deployment > Source**, choisissez **GitHub Actions** (au lieu de *Deploy from a branch*).
   - Le script automatisé `deploy.yml` va compiler et mettre en ligne votre app (un lien sera généré et visible).

---

## 🧩 Compatibilité des protocoles MHub et Bundles (Watched, Rokkr)

La plateforme prend en charge de façon expérimentale la reconnaissance des URL de type MHub (`mhub://`) :
- Dans la page "Réglages", sous "**Compatibilité MHub**", vous pouvez entrer des adresses de bundles (ex: `huhu.to`, `oha.to`).
- Les liens avec le préfixe `mhub://` ou des extensions de playlists M3U standards se verront identifiés.
- *Note : L'ingestion 100% native côté client des bundles complexes en JavaScript encapsulé nécessite une configuration CORS étendue que vous pouvez paramétrer sur votre dépôt d'hébergement.*

---

## 💻 Développement Local

### Prérequis
- **Node.js** v18 ou v20+
- **npm** (inclus avec Node.js)

### Installation
1. Installez les dépendances du projet :
   ```bash
   npm install
   ```
2. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
   *Application accessible en local, généralement sous `http://localhost:3000`.*
3. Compilez :
   ```bash
   npm run build
   ```

---

## 📺 Astuces pour déploiement Android TV

Pour en faire une application fluide sur Fire TV ou Xiaomi Mi Box :
- Créez un wrapper **WebView natif** plein écran (Java/Kotlin).
- Permettre à JavaScript son exécution totale (`setJavaScriptEnabled(true)`).
- Les événements clavier (Flèches, `Enter`, `Escape`) sont d'ores et déjà gérés par notre application Web !

---

## 🎨 Conception Visuelle

- L'interface repose sur une esthétique haut de gamme sombre **Cosmic Charcoal** avec des accents **Orange Premium** soignés.
- Marges équilibrées et vastes espaces aérés pour une lecture reposante et immersive.
- Composants interactifs fluides gérés par `motion`.
- Icônes issues de la bibliothèque de référence `lucide-react`.

