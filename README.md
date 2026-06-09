# TV PRO Explore

Plateforme de streaming IPTV haute performance.

## À propos

TV PRO Explore est une Progressive Web App (PWA) conçue pour offrir une expérience de streaming fluide et performante sur plusieurs plateformes, notamment Android TV.

## Caractéristiques

- ✨ Progressive Web App (PWA)
- 📱 Compatible Android TV
- 🎮 Navigation par télécommande/D-pad
- ⚡ Performance optimisée
- 🔌 Support WebView

## Installation

### Prérequis

- Git
- Node.js (v14+)
- npm ou yarn

### Déploiement

1. Clonez le repository :
   ```bash
   git clone https://github.com/mansstyle59/TV-Pro.git
   cd TV-Pro
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Lancez l'application :
   ```bash
   npm run dev
   ```

## Adaptations Android TV

Cette application est optimisée pour Android TV :

- **Wrapper WebView** : Créez un projet Android natif minimal (Kotlin/Jetpack Compose) avec une `WebView` en plein écran
- **Navigation D-pad** : Les écouteurs de touches (KeyEvents) mappent les boutons de la télécommande (Up, Down, Left, Right, Center)
- **Accessibilité** : Tous les éléments interactifs sont accessibles via le focus clavier avec `tabIndex` et styles `:focus` appropriés

## Technologies

- TypeScript
- JavaScript
- PWA

## Licence

Voir le fichier LICENSE pour plus de détails.

## Support

Pour plus d'informations, visitez [GitHub](https://github.com/mansstyle59/TV-Pro).
