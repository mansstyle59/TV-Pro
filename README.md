# TV PRO Explore

Plateforme de streaming IPTV haute performance.

## Déploiement sur GitHub

Pour partager votre projet sur GitHub :

1. Créez un nouveau repository sur [GitHub](https://github.com/).
2. Initialisez les commandes suivantes dans votre terminal local :

   ```bash
   git init
   git add .
   git commit -m "Initial commit of TV PRO Explore"
   git branch -M main
   git remote add origin <VOTRE_URL_GITHUB_REPOSITORY>
   git push -u origin main
   ```

## Adaptations pour Android TV

Cette application est une PWA (Progressive Web App). Pour une expérience optimale sur Android TV (support de la télécommande/D-pad, comportement natif) :

1. **Wrapper WebView** : Il est recommandé de créer un projet Android natif minimal (Kotlin/Jetpack Compose) qui contient une `WebView` en plein écran.
2. **Navigation D-pad** : Assurez-vous d'ajouter des écouteurs de touches (KeyEvents) dans votre wrapper Android pour mapper les boutons de la télécommande (Up, Down, Left, Right, Center) vers des événements de navigation JavaScript (`key="ArrowUp"`, etc.).
3. **Optimisations** : Dans le code de cette application, assurez-vous que tous les éléments interactifs sont accessibles via le focus clavier (utilisez des `tabIndex` appropriés et des styles `:focus` visibles).
