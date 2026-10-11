# FreeTV-France — plan d'implémentation séparé

Ce document décrit un futur service TV multiplateforme inspiré des interfaces de streaming TV, sans reprendre la marque ni les éléments graphiques propriétaires de Free.

## Objectif

Créer une interface web responsive et installable (PWA) utilisable sur iPhone, Mac et navigateurs de téléviseurs, avec une trajectoire possible vers des applications natives.

## Périmètre de la première version

- Accueil sombre en français avec sections « En direct », « Replay », « VOD » et « Favoris ».
- Lecteur HLS pour les flux compatibles.
- Ajout/import local de playlists M3U/M3U8 fourni par l'utilisateur.
- Recherche, catégories et favoris sauvegardés sur l'appareil.
- Démonstrations uniquement avec des flux de test ou contenus expressément autorisés.
- Aucun flux de chaîne payante ou protégé n'est intégré par défaut.

## À prévoir ensuite

- Catalogue éditorial français, avec autorisations écrites de diffusion et contrats des fournisseurs.
- EPG/XMLTV et logos, dans le respect de leurs licences.
- Replay et VOD uniquement lorsque le fournisseur autorise cette intégration.
- Compte facultatif, synchronisation multi-appareil, backend sécurisé et gestion du consentement.
- Tests de compatibilité sur Safari iOS, navigateurs desktop et appareils TV cibles.

## Déploiement

La première version peut être publiée comme PWA. Une application native pour Apple TV, Android TV ou Fire TV nécessitera un travail dédié et des validations distinctes.

## Licence et conformité

Avant réutilisation de code existant, vérifier et conserver les licences et notices de toutes les dépendances. La présence publique d'une URL de flux ne vaut pas autorisation de redistribution. Toute mise en production doit utiliser des sources dont les droits et les conditions d'utilisation ont été vérifiés.

## État

Document de cadrage uniquement. Ce fichier ne modifie pas les applications ou fichiers de TV-Pro, Course-Pro, FormIA ou autres projets.