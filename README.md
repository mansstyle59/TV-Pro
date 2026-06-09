# 📺 Flux TV Pro

> **L'expérience TV premium réinventée.**  
> Une plateforme IPTV moderne, fluide et performante avec guide des programmes (EPG) dynamique, outils d'administration complets, intégrations multi-formats, et de superbes transitions fluides adaptées à toutes les tailles d'écrans.

---

## ✨ Fonctionnalités Majeures

- **📺 Lecteur HLS Premium** : Prise en charge intégrale des flux en streaming en direct avec indicateurs de bande passante, statistiques de flux en temps réel, et lecteur résilient.
- **📅 Guide des Programmes (EPG)** : Timeline interactive en temps réel affichant les grilles de diffusion actuelles et futures, avec barres de progression dynamiques.
- **⚙️ Administration Avancée** : Réorganisation Logical Channel Numbers (LCN), import de catalogues Vavoo, ajout/édition/suppression de chaînes personnalisées, fonctions avancées de backup/restauration.
- **🔌 Intégrations Multi-Formats** : Export instantané sous forme de lien playlist M3U épuré, serveur XMLTV pour guide de programmes complet, ou simulation Xtream Codes API pour une compatibilité absolue avec des applications tierces (Perfect Player, Smarters, Tivimate...).
- **📱 PWA & D-Pad TV-Ready** : Design entièrement adaptatif, gérant le mode tactile mobile, la souris de bureau et la navigation par clavier / télécommande de salon (D-pad) avec gestion du focus stylisée.
- **🔒 Protection par Code d'Accès** : Gatekeeper optionnel pour privatiser et sécuriser l'accès à votre portail TV.

---

## 🚀 Déploiement Automatisé sur GitHub Pages

L'application est entièrement optimisée pour fonctionner **directement sur GitHub Pages sans l'erreur classique de l'écran blanc**.

### Vos optimisations prêtes à l'emploi :
1. **URLs Relatives** : Configuration configurée avec `base: './'` dans `vite.config.ts`.
2. **Anti-Echec Routage** : Création automatique d'une copie `404.html` de votre point d'entrée pour capturer les rechargements de pages et les chemins directs.
3. **Pas de limitations Jekyll** : Fichier `.nojekyll` généré automatiquement pour autoriser le chargement correct des fichiers d'assets préfixés par des underscores.

### Comment déployer en 3 étapes :

1. Enregistrez votre code sur un dépôt **GitHub** :
   ```bash
   git init
   git add .
   git commit -m "feat: initialisation Flux TV Pro complet"
   git branch -M main
   git remote add origin <VOTRE_URL_REPOSIT_GITHUB>
   git push -u origin main
   ```

2. Sur GitHub, allez dans les **Settings** (Paramètres) de votre dépôt.
3. Dans l'onglet **Pages** (dans la barre latérale gauche) :
   - Sous **Build and deployment** > **Source**, sélectionnez **GitHub Actions** au lieu de *Deploy from a branch*.
   - Le workflow d'intégration continue `.github/workflows/deploy.yml` s'occupe de compiler et mettre en ligne votre application instantanément à chaque mise à jour !

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
   *L'application sera accessible en local à l'adresse de votre choix.*

3. Compilez pour la production :
   ```bash
   npm run build
   ```

---

## 📺 Optimisation Android TV & Wrapper WebView

Flux TV Pro est compatible Progressive Web App (PWA) de niveau natif. Pour l'installer directement sur vos boîtiers de télévisions connectées (Android TV, Chromecast, Fire TV Stick) :

1. **Wrapper Natif** : Créez une application native basique en Kotlin ou Java contenant un conteneur `WebView` en plein écran (`match_parent`).
2. **D-Pad Support** : La navigation est entièrement pilotable au clavier par défaut. Mappez les touches physiques de vos télécommandes de télévision de façon à ce que le conteneur WebView reçoive les codes d'événement de navigation standards de JavaScript (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, `Escape`).
3. **UserAgent recommandé** : Utilisez un `User-Agent` standard d'un appareil Android ou Smart TV pour optimiser le rendu et la compatibilité globale.

---

## 🎨 Design & Identité Visuelle

L'interface repose sur une esthétique haut de gamme sombre **Cosmic Charcoal** avec des accents **Orange de marque** soignés :
- Marges équilibrées et vastes espaces aérés pour une lecture reposante et immersive.
- Composants interactifs animés en douceur avec des micro-mouvements fluides gérés par `motion`.
- Icônes issues de la bibliothèque de référence `lucide-react`.
